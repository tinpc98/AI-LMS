import mongoose from "mongoose";
import User from "../models/user.model.js";
import classModel from "../models/class.model.js";
import Notification from "../models/notification.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Các giá trị role hợp lệ theo spec API */
const VALID_TARGET_ROLES = ["all", "teacher", "student"];

/** Các giá trị enrollment filter hợp lệ */
const VALID_ENROLLMENT_STATUSES = ["all_active", "enrolled_only"];

/**
 * Map targetRole (lowercase từ request) → role PascalCase lưu trong DB.
 * User model dùng enum: "Admin" | "Teacher" | "Student"
 */
const ROLE_MAP = {
  teacher: "Teacher",
  student: "Student",
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class NotificationService {
  // ──────────────────────────────────────────────
  // 1. VALIDATE PAYLOAD
  // ──────────────────────────────────────────────

  /**
   * Kiểm tra tính hợp lệ của payload gửi lên.
   * Throw Error nếu thiếu hoặc sai giá trị.
   * @param {Object} payload
   */
  validatePayload({ targetRole, enrollmentStatus, title, content }) {
    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new Error("Tiêu đề thông báo (title) là bắt buộc và không được để trống.");
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      throw new Error("Nội dung thông báo (content) là bắt buộc và không được để trống.");
    }
    if (!VALID_TARGET_ROLES.includes(targetRole)) {
      throw new Error(
        `targetRole không hợp lệ. Giá trị được chấp nhận: ${VALID_TARGET_ROLES.join(", ")}.`
      );
    }
    if (!VALID_ENROLLMENT_STATUSES.includes(enrollmentStatus)) {
      throw new Error(
        `enrollmentStatus không hợp lệ. Giá trị được chấp nhận: ${VALID_ENROLLMENT_STATUSES.join(", ")}.`
      );
    }
  }

  // ──────────────────────────────────────────────
  // 2. BUILD USER QUERY
  // ──────────────────────────────────────────────

  /**
   * Xây dựng MongoDB query để lọc người nhận thông báo.
   *
   * Luôn bao gồm bộ lọc bắt buộc:
   *   { isDeleted: false, status: "Active" }
   *
   * Lưu ý: User.status dùng PascalCase "Active" (không phải "active")
   *
   * @param {string} targetRole - "all" | "teacher" | "student"
   * @returns {Object} MongoDB query object
   */
  buildBaseUserQuery(targetRole) {
    // Bộ lọc bắt buộc: không gửi tới tài khoản bị xóa hoặc bị khoá
    const query = {
      isDeleted: false,
      status: "Active",
    };

    // Lọc theo role nếu không phải "all"
    if (targetRole !== "all" && ROLE_MAP[targetRole]) {
      query.role = ROLE_MAP[targetRole];
    }

    return query;
  }

  // ──────────────────────────────────────────────
  // 3. RESOLVE ENROLLED-ONLY USER IDs
  // ──────────────────────────────────────────────

  /**
   * Lấy danh sách ObjectId của những user đang thực sự tham gia lớp học.
   *
   * - "teacher" → lấy teacherId từ các lớp học có isDeleted: false
   * - "student" → lấy students.studentId từ các lớp học có isDeleted: false
   * - "all"     → lấy cả hai nhóm trên
   *
   * Chỉ select `_id` để tối thiểu hoá bộ nhớ sử dụng.
   *
   * @param {string} targetRole - "all" | "teacher" | "student"
   * @returns {Promise<string[]>} Mảng userId dạng string (unique)
   */
  async resolveEnrolledUserIds(targetRole) {
    // Lấy tất cả lớp học đang hoạt động (không bị xóa mềm)
    // softDeletePlugin tự động filter isDeleted: false nên chỉ cần find({})
    const activeClasses = await classModel.find({}).select("teacherId students.studentId").lean();

    const enrolledIdSet = new Set();

    activeClasses.forEach((cls) => {
      // Thu thập teacherId nếu cần lấy teacher
      if (targetRole === "all" || targetRole === "teacher") {
        if (cls.teacherId) {
          enrolledIdSet.add(cls.teacherId.toString());
        }
      }

      // Thu thập studentId nếu cần lấy student
      if (targetRole === "all" || targetRole === "student") {
        (cls.students || []).forEach((s) => {
          if (s.studentId) {
            enrolledIdSet.add(s.studentId.toString());
          }
        });
      }
    });

    // Chuyển Set<string> → Array<ObjectId> cho $in query
    return [...enrolledIdSet].map((id) => new mongoose.Types.ObjectId(id));
  }

  // ──────────────────────────────────────────────
  // 4. FETCH RECIPIENT LIST
  // ──────────────────────────────────────────────

  /**
   * Tổng hợp bước 2 + 3: build query, áp dụng enrollment filter nếu cần,
   * sau đó trả về mảng ObjectId của người nhận.
   *
   * Chỉ select `_id` để tối thiểu memory footprint.
   *
   * @param {string} targetRole
   * @param {string} enrollmentStatus
   * @returns {Promise<mongoose.Types.ObjectId[]>}
   */
  async fetchRecipientIds(targetRole, enrollmentStatus) {
    const baseQuery = this.buildBaseUserQuery(targetRole);

    if (enrollmentStatus === "enrolled_only") {
      // Lấy danh sách id đang có trong lớp học, dùng $in để giao với baseQuery
      const enrolledIds = await this.resolveEnrolledUserIds(targetRole);

      if (enrolledIds.length === 0) {
        // Không có user nào đang enroll → danh sách rỗng, không cần query thêm
        return [];
      }

      baseQuery._id = { $in: enrolledIds };
    }

    // Chỉ lấy _id – memory-efficient
    const users = await User.find(baseQuery).select("_id").lean();
    return users.map((u) => u._id);
  }

  // ──────────────────────────────────────────────
  // 5. SEND BULK NOTIFICATIONS
  // ──────────────────────────────────────────────

  /**
   * Điểm vào chính của service.
   *
   * Thứ tự thực hiện:
   *  1. Validate payload
   *  2. Fetch danh sách người nhận
   *  3. Build mảng notification document
   *  4. insertMany() một lần duy nhất (không dùng vòng lặp .save())
   *
   * @param {Object} params
   * @param {string} params.targetRole       - "all" | "teacher" | "student"
   * @param {string} params.enrollmentStatus - "all_active" | "enrolled_only"
   * @param {string} params.title            - Tiêu đề thông báo
   * @param {string} params.content          - Nội dung thông báo
   * @param {string} params.senderId         - ObjectId của Admin đang gửi
   * @returns {Promise<{ recipientCount: number, notificationsSent: number }>}
   */
  async sendBulkNotifications({ targetRole, enrollmentStatus, title, content, senderId }) {
    // ── Bước 1: Validate ──
    this.validatePayload({ targetRole, enrollmentStatus, title, content });

    // ── Bước 2: Xác định danh sách người nhận ──
    const recipientIds = await this.fetchRecipientIds(targetRole, enrollmentStatus);

    if (recipientIds.length === 0) {
      return {
        recipientCount: 0,
        notificationsSent: 0,
        message: "Không tìm thấy người dùng nào phù hợp với điều kiện lọc.",
      };
    }

    // ── Bước 3: Build mảng document ──
    // Dùng .map() để tạo 1 document cho mỗi người nhận
    const senderObjectId = senderId ? new mongoose.Types.ObjectId(senderId) : null;

    const notificationDocs = recipientIds.map((recipientId) => ({
      recipientId,
      senderId: senderObjectId,
      title: title.trim(),
      content: content.trim(),
      type: "system",
      isRead: false,
      readAt: null,
    }));

    // ── Bước 4: Bulk insert – O(1) DB round-trip thay vì O(n) .save() calls ──
    const insertResult = await Notification.insertMany(notificationDocs, {
      ordered: false, // Tiếp tục insert dù có 1 document lỗi
    });

    return {
      recipientCount: recipientIds.length,
      notificationsSent: insertResult.length,
    };
  }

  // ──────────────────────────────────────────────
  // 6. NOTIFY LIVE SESSION CREATED (REALTIME)
  // ──────────────────────────────────────────────

  /**
   * Tạo thông báo khi Teacher bắt đầu Live Session và emit qua Socket
   * Hàm này sử dụng bulkWrite upsert để ngăn chặn việc tạo trùng lặp
   */
  async notifyLiveSessionCreated({ session, classInfo, teacherInfo, io }) {
    if (!session || !classInfo) return;

    try {
      // 1. Chỉ lấy những Student đang thực sự enroll hợp lệ trong lớp
      const activeStudents = (classInfo.students || []).filter(
        (s) => s.status === "Enrolled" && s.studentId
      );

      if (activeStudents.length === 0) return;

      const actorId = typeof teacherInfo === "object" ? teacherInfo._id : teacherInfo;

      // 2. Chuẩn bị bulkWrite ops với upsert
      const bulkOps = activeStudents.map((s) => {
        const recipientId = typeof s.studentId === "object" ? s.studentId._id : s.studentId;

        return {
          updateOne: {
            // Điều kiện filter để upsert (phải khớp với unique compound index: recipientId, type, entityId)
            filter: {
              recipientId: new mongoose.Types.ObjectId(recipientId),
              type: "LIVE_SESSION_CREATED",
              entityId: new mongoose.Types.ObjectId(session._id),
            },
            update: {
              $setOnInsert: {
                recipientId: new mongoose.Types.ObjectId(recipientId),
                actorId: actorId ? new mongoose.Types.ObjectId(actorId) : null,
                senderId: actorId ? new mongoose.Types.ObjectId(actorId) : null, // legacy
                title: "Buổi học trực tuyến mới",
                message: `Giảng viên đã tạo buổi học trực tuyến cho lớp ${classInfo.className || "của bạn"}`,
                content: `Giảng viên đã tạo buổi học trực tuyến cho lớp ${classInfo.className || "của bạn"}`, // legacy
                type: "LIVE_SESSION_CREATED",
                entityType: "LIVE_SESSION",
                entityId: new mongoose.Types.ObjectId(session._id),
                classId: new mongoose.Types.ObjectId(session.classId),
                actionUrl: `/student/live/${session._id}`,
                link: `/student/live/${session._id}`, // legacy
                metadata: {
                  className: classInfo.className,
                  teacherName: teacherInfo?.fullName || "Giảng viên",
                  sessionNumber: session.sessionNumber,
                  roomName: session.roomName,
                },
                isRead: false,
                readAt: null,
              },
            },
            upsert: true,
          },
        };
      });

      // 3. Thực thi bulkWrite
      const result = await Notification.bulkWrite(bulkOps, { ordered: false });

      // Nếu upsertedCount > 0, tức là có thông báo mới được tạo (không bị duplicate)
      // Ta cần fetch lại những notification vừa mới tạo để emit qua socket
      if (result.upsertedCount > 0 && io) {
        // Lấy danh sách ID của các docs vừa được insert
        const upsertedIds = Object.values(result.upsertedIds);

        const newNotifications = await Notification.find({ _id: { $in: upsertedIds } })
          .populate("actorId senderId", "fullName email avatar")
          .lean();

        // 4. Emit socket.io cho từng user
        newNotifications.forEach((notif) => {
          io.to(`user:${notif.recipientId}`).emit("notification:new", notif);
        });

        console.log(
          `✅ [NotificationService] Đã tạo và emit ${result.upsertedCount} thông báo LiveSession.`
        );
      }
    } catch (error) {
      console.error("❌ [NotificationService] notifyLiveSessionCreated Error:", error);
    }
  }

  /**
   * Tạo thông báo khi Teacher kết thúc Live Session và emit qua Socket
   */
  async notifyLiveSessionEnded({ session, classInfo, teacherInfo, io }) {
    if (!session || !classInfo) return;

    try {
      const activeStudents = (classInfo.students || []).filter(
        (s) => s.status === "Enrolled" && s.studentId
      );

      if (activeStudents.length === 0) return;

      const actorId = typeof teacherInfo === "object" ? teacherInfo._id : teacherInfo;

      const bulkOps = activeStudents.map((s) => {
        const recipientId = typeof s.studentId === "object" ? s.studentId._id : s.studentId;

        return {
          updateOne: {
            filter: {
              recipientId: new mongoose.Types.ObjectId(recipientId),
              type: "LIVE_SESSION_ENDED",
              entityId: new mongoose.Types.ObjectId(session._id),
            },
            update: {
              $setOnInsert: {
                recipientId: new mongoose.Types.ObjectId(recipientId),
                actorId: actorId ? new mongoose.Types.ObjectId(actorId) : null,
                senderId: actorId ? new mongoose.Types.ObjectId(actorId) : null,
                title: "Buổi học trực tuyến kết thúc",
                message: `Giảng viên đã kết thúc buổi học trực tuyến của lớp ${classInfo.className || "của bạn"}`,
                content: `Giảng viên đã kết thúc buổi học trực tuyến của lớp ${classInfo.className || "của bạn"}`,
                type: "LIVE_SESSION_ENDED",
                entityType: "LIVE_SESSION",
                entityId: new mongoose.Types.ObjectId(session._id),
                classId: new mongoose.Types.ObjectId(session.classId),
                actionUrl: `/student/classes/${session.classId}`,
                link: `/student/classes/${session.classId}`,
                metadata: {
                  className: classInfo.className,
                  sessionNumber: session.sessionNumber,
                  duration: session.actualEnd
                    ? Math.round(
                        (session.actualEnd.getTime() - session.actualStart.getTime()) / 60000
                      )
                    : 0,
                },
                isRead: false,
                readAt: null,
              },
            },
            upsert: true,
          },
        };
      });

      const result = await Notification.bulkWrite(bulkOps, { ordered: false });

      if (result.upsertedCount > 0 && io) {
        const upsertedIds = Object.values(result.upsertedIds);

        const newNotifications = await Notification.find({ _id: { $in: upsertedIds } })
          .populate("actorId senderId", "fullName email avatar")
          .lean();

        newNotifications.forEach((notif) => {
          io.to(`user:${notif.recipientId}`).emit("notification:new", notif);
        });

        console.log(
          `✅ [NotificationService] Đã tạo và emit ${result.upsertedCount} thông báo LiveSession_ENDED.`
        );
      }
    } catch (error) {
      console.error("❌ [NotificationService] notifyLiveSessionEnded Error:", error);
    }
  }

  // Lấy danh sách thông báo inbox của người dùng hiện tại (có phân trang)
  async getMyNotifications(userId, queryOptions = {}) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return { items: [], pagination: {} };
    }

    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(50, Math.max(1, parseInt(queryOptions.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const filter = { recipientId: userId };
    if (queryOptions.isRead !== undefined) {
      filter.isRead = queryOptions.isRead === "true" || queryOptions.isRead === true;
    }
    if (queryOptions.type) {
      filter.type = queryOptions.type;
    }

    const [items, totalItems, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("actorId senderId", "fullName email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  // Đếm số thông báo chưa đọc
  async getUnreadCount(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return 0;
    return await Notification.countDocuments({ recipientId: userId, isRead: false });
  }

  // Đánh dấu 1 thông báo là đã đọc
  async markAsRead(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error("ID thông báo không hợp lệ!");
    }
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!notif) {
      throw new Error("Thông báo không tồn tại hoặc không thuộc quyền sở hữu!");
    }
    return notif;
  }

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(userId) {
    if (!userId) return { modifiedCount: 0 };
    return await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }
}

export default new NotificationService();

import mongoose from "mongoose";
import Enrollment, { ACTIVE_STATUSES } from "./enrollment.model.js";
import { Course } from "#modules/course";
import { User } from "#modules/auth";
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  ValidationError,
} from "#shared/utils/appError.js";

/**
 * Allowed status transitions.
 * Key = current status, Value = array of allowed next statuses.
 */
const STATUS_TRANSITIONS = {
  PENDING_PAYMENT: ["PAYMENT_PENDING_CONFIRMATION", "CANCELLED"],
  PAYMENT_PENDING_CONFIRMATION: ["APPROVED", "PENDING_PAYMENT", "CANCELLED"],
  APPROVED: ["COMPLETED", "CANCELLED"],
  // classEnrollment.service.js#assignClass set thẳng enrollment.status = "CLASS_ASSIGNED" (không
  // qua transitionStatus) sau khi xếp lớp — thiếu key này khiến completeEnrollment() luôn lỗi
  // 400 cho MỌI enrollment đã xếp lớp thật (đường duy nhất tới trạng thái CLASS_ASSIGNED).
  CLASS_ASSIGNED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // terminal
  CANCELLED: [], // terminal
  REJECTED: [], // (Not used as a main status for enrollment in normal flow, but just in case)
};

class EnrollmentService {
  /**
   * Student tự đăng ký Course.
   * studentId luôn lấy từ authenticated user, không từ request body.
   */
  async createEnrollment(studentId, courseId, level) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Validate Course tồn tại & PUBLISHED
      const course = await Course.findById(courseId).session(session);
      if (!course) {
        throw new NotFoundError("Khóa học không tồn tại.");
      }
      if (course.status !== "PUBLISHED") {
        throw new BusinessRuleError("Chỉ khóa học đã xuất bản mới được đăng ký.");
      }

      // 2. Validate level & lấy price
      const price = course.prices?.get(level);
      if (price === undefined || price === null) {
        throw new BusinessRuleError(`Khóa học không hỗ trợ level ${level}`);
      }

      // 3. Kiểm tra xem đã có enrollment active/pending chưa (Partial index cũng bảo vệ, nhưng check trước cho UX)
      const existing = await Enrollment.findOne({
        studentId,
        courseId,
        status: { $in: ACTIVE_STATUSES },
      }).session(session);
      if (existing) {
        throw new ConflictError("Bạn đã có một đăng ký đang hoạt động cho khóa học này.");
      }

      // 4. Tạo enrollment
      const enrollment = await Enrollment.create(
        [
          {
            studentId,
            courseId,
            level,
            price,
            status: "PENDING_PAYMENT",
          },
        ],
        { session }
      );

      const createdEnrollment = enrollment[0];

      // 5. Load cấu hình thanh toán
      // Dùng require dynamic hoặc import paymentConfig trực tiếp để tránh circular dependency
      const PaymentConfig = (await import("#modules/payment/paymentConfig.model.js")).default;
      const Payment = (await import("#modules/payment/payment.model.js")).default;

      let config = await PaymentConfig.findOne().session(session);
      if (!config || !config.isActive) {
        throw new BusinessRuleError("Hệ thống thanh toán đang bảo trì.");
      }

      // 6. Generate transferContent
      const enrollmentCode = createdEnrollment._id.toString().substring(18).toUpperCase();
      const transferContent = `${config.transferPrefix} ${enrollmentCode}`;

      // 7. Generate qrPayload
      const safeBankName = encodeURIComponent(config.bankName);
      const safeAccountName = encodeURIComponent(config.accountName);
      const safeTransferContent = encodeURIComponent(transferContent);
      const qrData = `https://img.vietqr.io/image/${safeBankName}-${config.accountNumber}-compact2.png?amount=${price}&addInfo=${safeTransferContent}&accountName=${safeAccountName}`;

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // 8. Tạo Payment
      await Payment.create(
        [
          {
            enrollmentId: createdEnrollment._id,
            studentId,
            courseId,
            amount: price,
            currency: "VND",
            paymentMethod: "BANK_TRANSFER",
            status: "PENDING",
            transferInfo: {
              bankName: config.bankName,
              accountNumber: config.accountNumber,
              accountName: config.accountName,
              transferContent,
              qrData,
            },
            expiresAt,
          },
        ],
        { session }
      );

      // Update User firstEnrollmentAt if null
      const user = await User.findById(studentId).session(session);
      if (user && !user.firstEnrollmentAt) {
        user.firstEnrollmentAt = new Date();
        await user.save({ session });
      }

      await session.commitTransaction();
      return createdEnrollment;
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
        throw new ConflictError("Bạn đã có một đăng ký đang được xử lý cho khóa học này.");
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin tạo enrollment cho một Student.
   */
  async createEnrollmentByAdmin(studentId, courseId) {
    // Verify student tồn tại và có role Student
    const student = await User.findOne({
      _id: studentId,
      role: "Student",
      isDeleted: { $ne: true },
    });
    if (!student) {
      throw new NotFoundError("Học sinh không tồn tại hoặc không có vai trò Student.");
    }

    return this.createEnrollment(studentId, courseId);
  }

  /**
   * Lấy danh sách enrollment của chính student (có pagination).
   */
  async getMyEnrollments(studentId, { status, page = 1, limit = 10 } = {}) {
    const query = { studentId };
    if (status && status !== "All") {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      // BUG ĐÃ SỬA: select string liệt kê "level"/"pricing" — cả 2 field này KHÔNG tồn tại trên
      // schema Course (course.model.js chỉ có `prices: Map`), nên Mongoose luôn bỏ qua chúng một
      // cách âm thầm. level/price thật đã được snapshot ngay trên Enrollment lúc đăng ký (xem
      // enrollment.model.js), không cần populate thêm từ Course.
      Enrollment.find(query)
        .populate("courseId", "name code subject grade duration status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Enrollment.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Admin: lấy tất cả enrollment (filters: studentId, courseId, status).
   */
  async getAllEnrollments({ studentId, courseId, status, page = 1, limit = 10 } = {}) {
    const query = {};
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (status && status !== "All") query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Enrollment.find(query)
        .populate("studentId", "fullName email")
        .populate("courseId", "name code subject grade status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Enrollment.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Lấy enrollment theo ID.
   */
  async getEnrollmentById(enrollmentId) {
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("studentId", "fullName email")
      .populate("courseId", "name code subject grade duration status");

    if (!enrollment) {
      throw new NotFoundError("Enrollment không tồn tại.");
    }
    return enrollment;
  }

  /**
   * Chuyển trạng thái enrollment theo business rules.
   * Validate transition hợp lệ.
   */
  async transitionStatus(enrollmentId, targetStatus, adminId = null) {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new NotFoundError("Enrollment không tồn tại.");
    }

    const currentStatus = enrollment.status;
    const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses || !allowedNextStatuses.includes(targetStatus)) {
      throw new BusinessRuleError(
        `Không thể chuyển trạng thái từ "${currentStatus}" sang "${targetStatus}".`
      );
    }

    // BUG ĐÃ SỬA: chuyển Enrollment sang CANCELLED/COMPLETED trước đây không cascade sang
    // ClassEnrollment — nếu Enrollment đã ở CLASS_ASSIGNED (tức có ClassEnrollment ACTIVE),
    // ClassEnrollment đó bị BỎ QUÊN mãi mãi ở ACTIVE: Class.activeCount không được giải phóng
    // (khóa sĩ số ảo), roster của giáo viên vẫn hiện học sinh đã hủy/hoàn thành, và Attendance
    // DRAFT tương lai không được dọn. Cascade TRƯỚC khi cập nhật Enrollment (không phải sau):
    // nếu cascade xong mà bước ghi Enrollment bên dưới thất bại, currentStatus vẫn là
    // CLASS_ASSIGNED nên gọi lại được (cascade sẽ no-op vì không còn ClassEnrollment ACTIVE nào);
    // ngược lại nếu ghi Enrollment trước mà cascade thất bại, CANCELLED/COMPLETED là trạng thái
    // terminal (không có đường quay lại) nên ClassEnrollment sẽ orphan vĩnh viễn — đúng bug gốc.
    if (targetStatus === "CANCELLED" || targetStatus === "COMPLETED") {
      const classEnrollmentService = (
        await import("#modules/classEnrollment/classEnrollment.service.js")
      ).default;
      if (targetStatus === "CANCELLED") {
        await classEnrollmentService.cancelClassEnrollmentByEnrollmentId(enrollmentId, adminId);
      } else {
        await classEnrollmentService.completeClassEnrollmentByEnrollmentId(enrollmentId, adminId);
      }
    }

    // Atomic update to prevent race conditions
    const updatedEnrollment = await Enrollment.findOneAndUpdate(
      { _id: enrollmentId, status: currentStatus },
      { status: targetStatus },
      { new: true }
    );

    if (!updatedEnrollment) {
      throw new BusinessRuleError(
        "Trạng thái đã bị thay đổi bởi một tiến trình khác. Vui lòng thử lại."
      );
    }

    return updatedEnrollment;
  }

  /**
   * Kiểm tra student có enrollment active cho bất kỳ course nào không.
   * Phục vụ studentLifecycle (expiry check).
   */
  async hasActiveEnrollment(studentId) {
    const exists = await Enrollment.exists({
      studentId,
      status: { $in: ACTIVE_STATUSES },
    });
    return !!exists;
  }

  /**
   * Admin phân công lớp cho học sinh
   */
  async assignClass(enrollmentId, classId, adminId) {
    const classEnrollmentService = (
      await import("#modules/classEnrollment/classEnrollment.service.js")
    ).default;
    return await classEnrollmentService.assignClass({ enrollmentId, classId, adminId });
  }
}

export default new EnrollmentService();

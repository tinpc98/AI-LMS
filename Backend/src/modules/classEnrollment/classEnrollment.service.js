import mongoose from "mongoose";
import ClassEnrollment from "./classEnrollment.model.js";
import Class from "../class/class.model.js";
import { Enrollment } from "../enrollment/index.js";
import ClassSession from "../classSession/classSession.model.js";
import Attendance from "../attendance/attendance.model.js";

class ClassEnrollmentService {
  async assignClass({ enrollmentId, classId, adminId }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const enrollment = await Enrollment.findById(enrollmentId).session(session);
      if (!enrollment) {
        throw new Error("Không tìm thấy ghi danh (Enrollment)");
      }

      if (enrollment.status !== "APPROVED") {
        throw new Error(
          `Chỉ Enrollment trạng thái APPROVED mới được xếp lớp. Trạng thái hiện tại: ${enrollment.status}`
        );
      }

      // Check Class capacity atomically
      const updatedClass = await Class.findOneAndUpdate(
        {
          _id: classId,
          status: "OPEN",
          $expr: { $lt: ["$activeCount", "$capacity"] },
        },
        { $inc: { activeCount: 1 } },
        { session, new: true }
      );

      if (!updatedClass) {
        // Fallback checks for precise error
        const targetClass = await Class.findById(classId).session(session);
        if (!targetClass) throw new Error("Không tìm thấy lớp học");
        if (targetClass.status !== "OPEN")
          throw new Error(`Lớp học không ở trạng thái OPEN (hiện tại: ${targetClass.status})`);
        if (targetClass.activeCount >= targetClass.capacity) throw new Error("Lớp học đã đủ sĩ số");
        throw new Error("Không thể xếp lớp (lỗi concurrency)");
      }

      if (enrollment.courseId.toString() !== updatedClass.courseId.toString()) {
        throw new Error("Lớp học và ghi danh không cùng khóa học (Course)");
      }

      // Create ClassEnrollment
      const [classEnrollment] = await ClassEnrollment.create(
        [
          {
            enrollmentId: enrollment._id,
            studentId: enrollment.studentId,
            classId: updatedClass._id,
            status: "ACTIVE",
            createdBy: adminId,
          },
        ],
        { session }
      );

      // Update Enrollment status
      enrollment.status = "CLASS_ASSIGNED";
      await enrollment.save({ session });

      // Auto set FULL
      if (updatedClass.activeCount >= updatedClass.capacity) {
        updatedClass.status = "FULL";
        await updatedClass.save({ session });
      }

      // Generate future attendance records
      const futureSessions = await ClassSession.find({
        classId: updatedClass._id,
        scheduledStartAt: { $gte: new Date() },
      })
        .session(session)
        .lean();

      if (futureSessions.length > 0) {
        const attendanceRecords = futureSessions.map((s) => ({
          sessionId: s._id,
          classId: s.classId,
          studentId: enrollment.studentId,
          status: "DRAFT",
        }));
        // Note: mongoose create with transactions uses the option object
        await Attendance.create(attendanceRecords, { session });
      }

      await session.commitTransaction();
      return classEnrollment;
    } catch (error) {
      await session.abortTransaction();
      // Handle MongoDB Duplicate Key Error for Partial Unique Index (One active class rule)
      if (error.code === 11000) {
        throw new Error("Học sinh này đã có lớp học ACTIVE cho Enrollment này");
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async transferClass({ classEnrollmentId, targetClassId, adminId }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const currentCE = await ClassEnrollment.findOne({
        _id: classEnrollmentId,
        status: "ACTIVE",
      }).session(session);

      if (!currentCE) {
        throw new Error("Không tìm thấy ClassEnrollment ACTIVE");
      }

      if (currentCE.classId.toString() === targetClassId.toString()) {
        throw new Error("Không thể chuyển sang cùng một lớp");
      }

      // Check current Class
      const currentClass = await Class.findById(currentCE.classId).session(session);

      // Target class atomic update
      const targetClass = await Class.findOneAndUpdate(
        {
          _id: targetClassId,
          status: "OPEN",
          $expr: { $lt: ["$activeCount", "$capacity"] },
        },
        { $inc: { activeCount: 1 } },
        { session, new: true }
      );

      if (!targetClass) {
        const checkClass = await Class.findById(targetClassId).session(session);
        if (!checkClass) throw new Error("Lớp học đích không tồn tại");
        if (checkClass.status !== "OPEN") throw new Error("Lớp học đích không mở");
        if (checkClass.activeCount >= checkClass.capacity) throw new Error("Lớp học đích đã đầy");
        throw new Error("Không thể chuyển lớp (lỗi concurrency)");
      }

      if (currentClass && currentClass.courseId.toString() !== targetClass.courseId.toString()) {
        throw new Error("Lớp học đích không cùng Course với lớp hiện tại");
      }

      // Update current class activeCount
      if (currentClass) {
        currentClass.activeCount = Math.max(0, currentClass.activeCount - 1);
        // If it was FULL, maybe auto OPEN it
        if (currentClass.status === "FULL" && currentClass.activeCount < currentClass.capacity) {
          currentClass.status = "OPEN";
        }
        await currentClass.save({ session });
      }

      // Clean up future DRAFT attendances in the current class
      const oldFutureSessions = await ClassSession.find({
        classId: currentCE.classId,
        scheduledStartAt: { $gte: new Date() },
      })
        .select("_id")
        .session(session)
        .lean();

      if (oldFutureSessions.length > 0) {
        const oldFutureSessionIds = oldFutureSessions.map((s) => s._id);
        await Attendance.deleteMany(
          {
            sessionId: { $in: oldFutureSessionIds },
            studentId: currentCE.studentId,
            status: "DRAFT",
          },
          { session }
        );
      }

      // Mark current CE as transferred
      currentCE.status = "TRANSFERRED";
      currentCE.leftAt = new Date();
      currentCE.updatedBy = adminId;
      await currentCE.save({ session });

      // Create new CE
      const [newCE] = await ClassEnrollment.create(
        [
          {
            enrollmentId: currentCE.enrollmentId,
            studentId: currentCE.studentId,
            classId: targetClassId,
            status: "ACTIVE",
            transferredFrom: currentCE._id,
            createdBy: adminId,
          },
        ],
        { session }
      );

      currentCE.transferredTo = newCE._id;
      await currentCE.save({ session });

      // Auto FULL target class
      if (targetClass.activeCount >= targetClass.capacity) {
        targetClass.status = "FULL";
        await targetClass.save({ session });
      }

      // Generate future attendance records for target class
      const futureSessions = await ClassSession.find({
        classId: targetClassId,
        scheduledStartAt: { $gte: new Date() },
      })
        .session(session)
        .lean();

      if (futureSessions.length > 0) {
        const attendanceRecords = futureSessions.map((s) => ({
          sessionId: s._id,
          classId: s.classId,
          studentId: currentCE.studentId,
          status: "DRAFT",
        }));
        await Attendance.create(attendanceRecords, { session });
      }

      await session.commitTransaction();
      return newCE;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async completeClassEnrollment({ classEnrollmentId, adminId }) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const ce = await ClassEnrollment.findOne({
        _id: classEnrollmentId,
        status: "ACTIVE",
      }).session(session);
      if (!ce) throw new Error("Không tìm thấy ClassEnrollment ACTIVE");

      ce.status = "COMPLETED";
      ce.leftAt = new Date();
      ce.updatedBy = adminId;
      await ce.save({ session });

      // Clean up future DRAFT attendances
      const futureSessions = await ClassSession.find({
        classId: ce.classId,
        scheduledStartAt: { $gte: new Date() },
      })
        .select("_id")
        .session(session)
        .lean();

      if (futureSessions.length > 0) {
        const futureSessionIds = futureSessions.map((s) => s._id);
        await Attendance.deleteMany(
          { sessionId: { $in: futureSessionIds }, studentId: ce.studentId, status: "DRAFT" },
          { session }
        );
      }

      const cls = await Class.findById(ce.classId).session(session);
      if (cls) {
        cls.activeCount = Math.max(0, cls.activeCount - 1);
        if (cls.status === "FULL" && cls.activeCount < cls.capacity) {
          cls.status = "OPEN";
        }
        await cls.save({ session });
      }

      await session.commitTransaction();
      return ce;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelClassEnrollment({ classEnrollmentId, adminId }) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const ce = await ClassEnrollment.findOne({
        _id: classEnrollmentId,
        status: "ACTIVE",
      }).session(session);
      if (!ce) throw new Error("Không tìm thấy ClassEnrollment ACTIVE");

      ce.status = "CANCELLED";
      ce.leftAt = new Date();
      ce.updatedBy = adminId;
      await ce.save({ session });

      // Clean up future DRAFT attendances
      const futureSessions = await ClassSession.find({
        classId: ce.classId,
        scheduledStartAt: { $gte: new Date() },
      })
        .select("_id")
        .session(session)
        .lean();

      if (futureSessions.length > 0) {
        const futureSessionIds = futureSessions.map((s) => s._id);
        await Attendance.deleteMany(
          { sessionId: { $in: futureSessionIds }, studentId: ce.studentId, status: "DRAFT" },
          { session }
        );
      }

      const cls = await Class.findById(ce.classId).session(session);
      if (cls) {
        cls.activeCount = Math.max(0, cls.activeCount - 1);
        if (cls.status === "FULL" && cls.activeCount < cls.capacity) {
          cls.status = "OPEN";
        }
        await cls.save({ session });
      }

      await session.commitTransaction();
      return ce;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Tìm ClassEnrollment ACTIVE của một Enrollment rồi hủy — dùng khi Enrollment bị CANCELLED
   * để cascade đúng (giải phóng activeCount, dọn Attendance DRAFT tương lai). Trả null nếu
   * Enrollment chưa từng được xếp lớp (không có ClassEnrollment ACTIVE nào để hủy).
   */
  async cancelClassEnrollmentByEnrollmentId(enrollmentId, adminId) {
    const ce = await ClassEnrollment.findOne({ enrollmentId, status: "ACTIVE" });
    if (!ce) return null;
    return await this.cancelClassEnrollment({ classEnrollmentId: ce._id, adminId });
  }

  /** Tương tự cancelClassEnrollmentByEnrollmentId nhưng dùng khi Enrollment COMPLETED. */
  async completeClassEnrollmentByEnrollmentId(enrollmentId, adminId) {
    const ce = await ClassEnrollment.findOne({ enrollmentId, status: "ACTIVE" });
    if (!ce) return null;
    return await this.completeClassEnrollment({ classEnrollmentId: ce._id, adminId });
  }

  async getClassEnrollments(filters = {}, options = {}) {
    const { skip = 0, limit = 10 } = options;
    const query = {};

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.classId) query.classId = filters.classId;
    if (filters.enrollmentId) query.enrollmentId = filters.enrollmentId;
    if (filters.status) query.status = filters.status;

    const [data, total] = await Promise.all([
      ClassEnrollment.find(query)
        .populate("classId", "name code mode status")
        .populate("studentId", "fullName email")
        .populate("enrollmentId", "status courseId")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      ClassEnrollment.countDocuments(query),
    ]);

    return { data, total, page: skip / limit + 1, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new ClassEnrollmentService();

import mongoose from "mongoose";
import PayrollPeriod from "./payrollPeriod.model.js";
import TeacherPayrollConfig from "./payrollConfig.model.js";
import Payroll from "./payroll.model.js";
import TeacherAttendance from "../teacherAttendance/teacherAttendance.model.js";
import ClassSession from "../classSession/classSession.model.js";
import Class from "../class/class.model.js";

class PayrollService {
  /**
   * Calculates the payroll for a given period.
   * This operation is idempotent. It can be run multiple times as long as the Payroll is in DRAFT or CALCULATED state.
   */
  async calculatePayroll(payrollPeriodId, adminId) {
    if (!mongoose.Types.ObjectId.isValid(payrollPeriodId)) {
      throw new Error("ID kỳ lương không hợp lệ");
    }

    const period = await PayrollPeriod.findById(payrollPeriodId);
    if (!period || period.isDeleted) {
      throw new Error("Không tìm thấy kỳ lương");
    }

    if (period.status === "PAID" || period.status === "LOCKED") {
      throw new Error("Không thể tính lại kỳ lương đã được thanh toán hoặc khóa");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Tìm tất cả các ClassSession COMPLETED diễn ra trong khoảng thời gian của kỳ lương
      // Dùng actualStartAt (ưu tiên) hoặc scheduledStartAt nếu actualStartAt null.
      const validSessions = await ClassSession.find({
        status: "COMPLETED",
        isDeleted: false,
        $or: [
          { actualStartAt: { $gte: period.startDate, $lte: period.endDate } },
          { actualStartAt: null, scheduledStartAt: { $gte: period.startDate, $lte: period.endDate } }
        ]
      }).session(session).select("_id").lean();
      
      const validSessionIds = validSessions.map(s => s._id);

      // 2. Lấy tất cả TeacherAttendance có status = CONFIRMED cho các session hợp lệ
      const validAttendances = await TeacherAttendance.find({
        status: "CONFIRMED",
        isDeleted: false,
        sessionId: { $in: validSessionIds },
      })
        .populate("sessionId")
        .session(session)
        .lean();

      // Group attendances by teacherId
      const attendancesByTeacher = {};
      for (const att of validAttendances) {
        const tId = att.teacherId.toString();
        if (!attendancesByTeacher[tId]) {
          attendancesByTeacher[tId] = [];
        }
        attendancesByTeacher[tId].push(att);
      }

      // 2. Tính toán Payroll cho từng Teacher
      for (const tId of Object.keys(attendancesByTeacher)) {
        const teacherAttendances = attendancesByTeacher[tId];

        // Lấy config lương của teacher này (có thể có nhiều config, cần match effectiveDate)
        const configs = await TeacherPayrollConfig.find({
          teacherId: tId,
          isDeleted: false,
        }).session(session).lean();

        let totalAmount = 0;
        let sessionCount = 0;
        let courseCount = 0;
        const items = [];

        for (const att of teacherAttendances) {
          const sessionDate = att.sessionId.actualStartAt || att.sessionId.scheduledStartAt;

          // Tìm config PER_SESSION phù hợp
          const matchingConfig = configs.find((cfg) => {
            if (cfg.type !== "PER_SESSION") return false;
            const effFrom = new Date(cfg.effectiveFrom);
            const effTo = cfg.effectiveTo ? new Date(cfg.effectiveTo) : new Date("2099-12-31");
            return sessionDate >= effFrom && sessionDate <= effTo && cfg.status === "ACTIVE";
          });

          if (matchingConfig) {
            const unitAmount = matchingConfig.amount;
            items.push({
              sessionId: att.sessionId._id,
              classId: att.classId,
              description: `Dạy buổi học: ${att.sessionId.title} (Session ${att.sessionId.sessionNumber})`,
              calculationType: "PER_SESSION",
              quantity: 1,
              unitAmount,
              totalAmount: unitAmount,
            });
            totalAmount += unitAmount;
            sessionCount++;
          }
        }

        // Logic PER_COURSE sẽ phức tạp hơn (cần check completed obligations).
        // Tạm thời tập trung vào PER_SESSION dựa trên yêu cầu cốt lõi. Có thể mở rộng sau.

        // Upsert Payroll document
        const payrollFilter = { teacherId: tId, payrollPeriodId: period._id };
        const existingPayroll = await Payroll.findOne(payrollFilter).session(session);

        if (existingPayroll) {
          if (["CONFIRMED", "PAID", "LOCKED"].includes(existingPayroll.status)) {
            // Không tính lại cho người này nếu đã confirm
            continue;
          }
          existingPayroll.items = items;
          existingPayroll.totalAmount = totalAmount;
          existingPayroll.sessionCount = sessionCount;
          existingPayroll.courseCount = courseCount;
          existingPayroll.baseAmount = totalAmount;
          existingPayroll.status = "CALCULATED";
          existingPayroll.calculatedAt = new Date();
          existingPayroll.calculatedBy = adminId;
          await existingPayroll.save({ session });
        } else {
          const newPayroll = new Payroll({
            teacherId: tId,
            payrollPeriodId: period._id,
            baseAmount: totalAmount,
            sessionCount,
            courseCount,
            totalAmount,
            status: "CALCULATED",
            items,
            calculatedAt: new Date(),
            calculatedBy: adminId,
          });
          await newPayroll.save({ session });
        }
      }

      period.status = "CALCULATED";
      await period.save({ session });

      await session.commitTransaction();
      return { message: "Tính lương thành công" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async confirmPayroll(payrollId, adminId) {
    if (!mongoose.Types.ObjectId.isValid(payrollId)) throw new Error("ID bảng lương không hợp lệ");
    
    const payroll = await Payroll.findById(payrollId);
    if (!payroll || payroll.isDeleted) throw new Error("Không tìm thấy bảng lương");
    
    if (payroll.status !== "CALCULATED") throw new Error("Bảng lương phải ở trạng thái CALCULATED mới được xác nhận");
    
    payroll.status = "CONFIRMED";
    payroll.confirmedAt = new Date();
    payroll.confirmedBy = adminId;
    await payroll.save();
    return payroll;
  }

  async payPayroll(payrollId, adminId) {
    if (!mongoose.Types.ObjectId.isValid(payrollId)) throw new Error("ID bảng lương không hợp lệ");
    
    const payroll = await Payroll.findById(payrollId);
    if (!payroll || payroll.isDeleted) throw new Error("Không tìm thấy bảng lương");
    
    if (payroll.status !== "CONFIRMED") throw new Error("Bảng lương phải ở trạng thái CONFIRMED mới được đánh dấu thanh toán");
    
    payroll.status = "PAID";
    payroll.paidAt = new Date();
    payroll.paidBy = adminId;
    await payroll.save();
    return payroll;
  }

  async getMyPayrolls(teacherId, queryOptions = {}) {
    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      Payroll.find({ teacherId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("payrollPeriodId")
        .lean(),
      Payroll.countDocuments({ teacherId, isDeleted: false }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getAllPayrolls(queryOptions = {}) {
    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (queryOptions.payrollPeriodId) filter.payrollPeriodId = queryOptions.payrollPeriodId;
    if (queryOptions.status) filter.status = queryOptions.status;

    const [items, totalItems] = await Promise.all([
      Payroll.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("teacherId", "fullName email")
        .populate("payrollPeriodId")
        .lean(),
      Payroll.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }
}

export default new PayrollService();

import mongoose from "mongoose";
import PayrollPeriod from "./payrollPeriod.model.js";
import TeacherPayrollConfig from "./payrollConfig.model.js";
import Payroll from "./payroll.model.js";
import TeacherAttendance from "../teacherAttendance/teacherAttendance.model.js";
import ClassSession from "../classSession/classSession.model.js";
import Class from "../class/class.model.js";
import { CommitmentEvent } from "#modules/class";

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
          {
            actualStartAt: null,
            scheduledStartAt: { $gte: period.startDate, $lte: period.endDate },
          },
        ],
      })
        .session(session)
        .select("_id")
        .lean();

      const validSessionIds = validSessions.map((s) => s._id);

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

      // TÍNH NĂNG MỚI (PER_COURSE): CommitmentEvent với toStatus="COMPLETED" trong khoảng thời
      // gian kỳ lương là tín hiệu "giáo viên vừa hoàn thành trọn vẹn 1 khóa/cohort" đã có sẵn
      // trong hệ thống (EduSpace mechanism design Phần A — commitment.service.js#transitionCommitment),
      // dùng lại thay vì phát minh field/cơ chế mới. Idempotent tự nhiên: ALLOWED_TRANSITIONS
      // (commitment.service.js) có COMPLETED là trạng thái terminal (không có transition nào đi
      // TỚI COMPLETED lần 2 cho cùng 1 class), nên 1 classId chỉ có ĐÚNG 1 CommitmentEvent
      // toStatus=COMPLETED trong toàn bộ vòng đời, rơi vào đúng 1 kỳ lương duy nhất theo
      // createdAt — không cần thêm cơ chế chống trả trùng riêng. Chỉ tính COMPLETED (hoàn thành
      // trọn vẹn), KHÔNG tính COMPLETED_PARTIAL — việc trả lương theo tỷ lệ khi giáo viên chỉ
      // hoàn thành một phần cohort cần quy tắc riêng, để dành cho quyết định sau.
      // Gán tiền cho teacherId TẠI THỜI ĐIỂM hoàn thành (không phải Class.teacherId đọc bây giờ)
      // — đúng người nếu có giáo viên dự bị (backupTeacher) tiếp quản và là người hoàn thành lớp.
      const completionEvents = await CommitmentEvent.find({
        toStatus: "COMPLETED",
        createdAt: { $gte: period.startDate, $lte: period.endDate },
      })
        .session(session)
        .lean();

      const completedClassIds = completionEvents.map((e) => e.classId);
      const completedClasses = await Class.find({ _id: { $in: completedClassIds } })
        .session(session)
        .select("courseId name code")
        .populate("courseId", "name")
        .lean();
      const classById = new Map(completedClasses.map((c) => [c._id.toString(), c]));

      const completionsByTeacher = {};
      for (const ev of completionEvents) {
        const tId = ev.teacherId.toString();
        if (!completionsByTeacher[tId]) {
          completionsByTeacher[tId] = [];
        }
        completionsByTeacher[tId].push(ev);
      }

      // Gộp danh sách giáo viên cần tính lương từ CẢ 2 nguồn — giáo viên chỉ nhận PER_COURSE
      // (không có buổi dạy lẻ nào trong kỳ) trước đây sẽ bị bỏ sót hoàn toàn nếu chỉ lặp qua
      // attendancesByTeacher.
      const allTeacherIds = new Set([
        ...Object.keys(attendancesByTeacher),
        ...Object.keys(completionsByTeacher),
      ]);

      // 2. Tính toán Payroll cho từng Teacher
      for (const tId of allTeacherIds) {
        const teacherAttendances = attendancesByTeacher[tId] || [];
        const teacherCompletions = completionsByTeacher[tId] || [];

        // Lấy config lương của teacher này (có thể có nhiều config, cần match effectiveDate)
        const configs = await TeacherPayrollConfig.find({
          teacherId: tId,
          isDeleted: false,
        })
          .session(session)
          .lean();

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

        for (const ev of teacherCompletions) {
          // Tìm config PER_COURSE phù hợp — cùng quy tắc match effectiveFrom/effectiveTo/ACTIVE
          // như PER_SESSION, lấy mốc thời gian từ CommitmentEvent.createdAt.
          const matchingConfig = configs.find((cfg) => {
            if (cfg.type !== "PER_COURSE") return false;
            const effFrom = new Date(cfg.effectiveFrom);
            const effTo = cfg.effectiveTo ? new Date(cfg.effectiveTo) : new Date("2099-12-31");
            return ev.createdAt >= effFrom && ev.createdAt <= effTo && cfg.status === "ACTIVE";
          });

          if (matchingConfig) {
            const cls = classById.get(ev.classId.toString());
            const unitAmount = matchingConfig.amount;
            items.push({
              classId: ev.classId,
              courseId: cls?.courseId?._id || null,
              description: `Hoàn thành khóa học: ${cls?.courseId?.name || "?"} (Lớp ${cls?.code || cls?.name || ""})`,
              calculationType: "PER_COURSE",
              quantity: 1,
              unitAmount,
              totalAmount: unitAmount,
            });
            totalAmount += unitAmount;
            courseCount++;
          }
        }

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

    const existing = await Payroll.findById(payrollId);
    if (!existing || existing.isDeleted) throw new Error("Không tìm thấy bảng lương");

    // BUG ĐÃ SỬA (TOCTOU): trước đây đọc-kiểm tra-ghi qua .save() thường, không atomic — 2 request
    // confirm đồng thời cùng đọc thấy CALCULATED, cùng qua được check, cùng ghi đè lên nhau (request
    // sau thắng, mất dấu vết ai xác nhận trước). Dùng findOneAndUpdate với điều kiện status ngay
    // trong filter để chỉ đúng 1 request thắng, giống pattern đã áp cho Enrollment.transitionStatus.
    const payroll = await Payroll.findOneAndUpdate(
      { _id: payrollId, status: "CALCULATED", isDeleted: false },
      { status: "CONFIRMED", confirmedAt: new Date(), confirmedBy: adminId },
      { new: true }
    );
    if (!payroll) throw new Error("Bảng lương phải ở trạng thái CALCULATED mới được xác nhận");
    return payroll;
  }

  async payPayroll(payrollId, adminId) {
    if (!mongoose.Types.ObjectId.isValid(payrollId)) throw new Error("ID bảng lương không hợp lệ");

    const existing = await Payroll.findById(payrollId);
    if (!existing || existing.isDeleted) throw new Error("Không tìm thấy bảng lương");

    // BUG ĐÃ SỬA (TOCTOU) — xem giải thích ở confirmPayroll.
    const payroll = await Payroll.findOneAndUpdate(
      { _id: payrollId, status: "CONFIRMED", isDeleted: false },
      { status: "PAID", paidAt: new Date(), paidBy: adminId },
      { new: true }
    );
    if (!payroll)
      throw new Error("Bảng lương phải ở trạng thái CONFIRMED mới được đánh dấu thanh toán");
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

  /**
   * Tạo kỳ lương mới.
   *
   * BUG ĐÃ SỬA: trước đây controller gọi thẳng PayrollPeriod.create(req.body), không kiểm tra
   * chồng lấn ngày với các kỳ lương đã có. calculatePayroll() tính lương dựa trên khoảng
   * [startDate, endDate] của kỳ — 2 kỳ lương chồng ngày sẽ cùng gom được các ClassSession/
   * TeacherAttendance giống nhau, khiến giáo viên bị tính lương (và có thể confirm/pay) 2 lần
   * cho cùng một buổi dạy.
   */
  async createPayrollPeriod(data) {
    const { startDate, endDate } = data;
    if (startDate && endDate) {
      const overlapping = await PayrollPeriod.findOne({
        isDeleted: false,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      }).lean();
      if (overlapping) {
        throw new Error(
          `Khoảng thời gian chồng lấn với kỳ lương đã tồn tại: "${overlapping.name}".`
        );
      }
    }
    return await PayrollPeriod.create(data);
  }
}

export default new PayrollService();

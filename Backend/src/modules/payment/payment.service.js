import mongoose from "mongoose";
import Payment from "./payment.model.js";
import PaymentConfig from "./paymentConfig.model.js";
import { Enrollment } from "#modules/enrollment";
import { Course } from "#modules/course";
import { NotFoundError, ConflictError, BusinessRuleError } from "#shared/utils/appError.js";

class PaymentService {
  async getPaymentConfig() {
    let config = await PaymentConfig.findOne();
    if (!config) {
      config = await PaymentConfig.create({
        bankName: "Ngân hàng mặc định",
        accountNumber: "0000000000",
        accountName: "CHUA CAU HINH",
        transferPrefix: "EDU",
        isActive: true,
      });
    }
    return config;
  }

  async updatePaymentConfig(data) {
    let config = await PaymentConfig.findOne();
    if (config) {
      Object.assign(config, data);
      await config.save();
    } else {
      config = await PaymentConfig.create(data);
    }
    return config;
  }

  /**
   * Tạo payment cho một enrollment (chỉ bởi student hoặc admin/teacher thay mặt).
   */
  async createPayment(enrollmentId, studentId) {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) throw new NotFoundError("Không tìm thấy ghi danh (Enrollment).");

    // Chỉ học viên sở hữu (hoặc admin) mới được tạo, filter xử lý ở controller
    if (studentId && enrollment.studentId.toString() !== studentId.toString()) {
      throw new BusinessRuleError("Không có quyền tạo thanh toán cho enrollment này.");
    }

    if (enrollment.status !== "PENDING_PAYMENT") {
      throw new BusinessRuleError(
        `Không thể tạo thanh toán cho enrollment có trạng thái ${enrollment.status}.`
      );
    }

    const course = await Course.findById(enrollment.courseId);
    if (!course || course.status === "ARCHIVED") {
      throw new BusinessRuleError("Khóa học không tồn tại hoặc đã bị lưu trữ.");
    }

    // Kiểm tra xem đã có payment PENDING hoặc PAID nào chưa
    const existingPayment = await Payment.findOne({
      enrollmentId,
      status: { $in: ["PENDING", "PAID"] },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const config = await this.getPaymentConfig();
    if (!config.isActive) {
      throw new BusinessRuleError("Tính năng thanh toán hiện đang bảo trì.");
    }

    // BUG ĐÃ SỬA: `course.pricing.tuitionFee`/`course.pricing.currency` không tồn tại trên schema
    // Course (giá thật nằm ở `prices: Map` theo level, xem course.model.js) — luôn undefined nên
    // MỌI payment tạo ra trước đây đều có amount=0đ và QR sinh ra với amount=0, bất kể giá khóa
    // học thật là bao nhiêu. `enrollment.price` đã được chốt (snapshot) đúng theo level lúc tạo
    // Enrollment (xem enrollment.service.js#createEnrollment: `course.prices?.get(level)`) — dùng
    // lại giá trị đã chốt này, vừa đúng field vừa đúng nguyên tắc "Snapshot field: must not change
    // if Course price changes" đã ghi chú sẵn ở amount trong payment.model.js.
    const tuitionFee = enrollment.price;
    const currency = "VND";

    // Sinh transferContent ví dụ: EDU ENR_ID
    const transferContent = `${config.transferPrefix} ${enrollment._id.toString().substring(18).toUpperCase()}`;

    // Chuỗi QR vietqr mẫu: https://img.vietqr.io/image/{bankName}-{accountNumber}-compact.png?amount={amount}&addInfo={transferContent}&accountName={accountName}
    const safeBankName = encodeURIComponent(config.bankName);
    const safeAccountName = encodeURIComponent(config.accountName);
    const safeTransferContent = encodeURIComponent(transferContent);
    const qrData = `https://img.vietqr.io/image/${safeBankName}-${config.accountNumber}-compact2.png?amount=${tuitionFee}&addInfo=${safeTransferContent}&accountName=${safeAccountName}`;

    // BUG ĐÃ SỬA: `expiresAt` là field required trên schema Payment (payment.model.js:88-91)
    // nhưng trước đây KHÔNG được set ở đây → Payment.create() luôn ném ValidationError, tức
    // hàm createPayment không bao giờ tạo được payment nào trong thực tế. Đặt hạn 24h, khớp với
    // hạn dùng ở nơi khởi tạo Payment còn lại (enrollment.service.js#createEnrollment).
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const payment = await Payment.create({
      enrollmentId: enrollment._id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      amount: tuitionFee,
      currency,
      paymentMethod: "BANK_TRANSFER",
      status: "PENDING",
      expiresAt,
      transferInfo: {
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        accountName: config.accountName,
        transferContent,
        qrData,
      },
    });

    return payment;
  }

  /**
   * Admin confirm thanh toán (Tương đương verifyPayment cũ nhưng strict hơn)
   */
  async confirmPayment(paymentId, adminId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) throw new NotFoundError("Không tìm thấy thông tin thanh toán.");

      if (payment.status !== "PENDING") {
        throw new BusinessRuleError(
          `Không thể xác nhận thanh toán đang ở trạng thái ${payment.status}.`
        );
      }
      if (payment.expiresAt && payment.expiresAt < new Date()) {
        throw new BusinessRuleError("Thanh toán đã quá hạn, không thể xác nhận.");
      }

      const enrollment = await Enrollment.findById(payment.enrollmentId).session(session);
      if (!enrollment) throw new NotFoundError("Ghi danh không tồn tại.");

      if (enrollment.status !== "PAYMENT_PENDING_CONFIRMATION") {
        throw new BusinessRuleError(
          `Ghi danh đang ở trạng thái ${enrollment.status}, không thể cập nhật thanh toán.`
        );
      }

      // Update Payment
      payment.status = "PAID";
      payment.paidAt = new Date();
      payment.confirmedAt = new Date();
      payment.confirmedBy = adminId;
      await payment.save({ session });

      // Update Enrollment
      enrollment.status = "APPROVED";
      enrollment.approvedAt = new Date();
      enrollment.approvedBy = adminId;
      await enrollment.save({ session });

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin reject payment
   */
  async rejectPayment(paymentId, reason, adminId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) throw new NotFoundError("Không tìm thấy thanh toán.");

      if (payment.status !== "PENDING") {
        throw new BusinessRuleError(`Chỉ thanh toán PENDING mới có thể từ chối.`);
      }

      const enrollment = await Enrollment.findById(payment.enrollmentId).session(session);

      // Update Payment
      payment.status = "REJECTED";
      payment.rejectedAt = new Date();
      payment.rejectedBy = adminId;
      payment.rejectionReason = reason;
      await payment.save({ session });

      // Update Enrollment
      if (enrollment && enrollment.status === "PAYMENT_PENDING_CONFIRMATION") {
        enrollment.status = "PENDING_PAYMENT";
        await enrollment.save({ session });
      }

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Student báo đã chuyển khoản
   */
  async submitPayment(paymentId, studentId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) throw new NotFoundError("Không tìm thấy thanh toán.");

      if (payment.studentId.toString() !== studentId.toString()) {
        throw new BusinessRuleError("Bạn không có quyền thực hiện trên thanh toán này.");
      }

      if (payment.status !== "PENDING") {
        throw new BusinessRuleError("Thanh toán không ở trạng thái PENDING.");
      }

      if (payment.expiresAt && payment.expiresAt < new Date()) {
        // Expired
        payment.status = "EXPIRED";
        await payment.save({ session });
        throw new BusinessRuleError("Thanh toán đã quá hạn.");
      }

      const enrollment = await Enrollment.findById(payment.enrollmentId).session(session);
      if (!enrollment) throw new NotFoundError("Ghi danh không tồn tại.");

      payment.studentSubmittedAt = new Date();
      await payment.save({ session });

      if (enrollment.status === "PENDING_PAYMENT") {
        enrollment.status = "PAYMENT_PENDING_CONFIRMATION";
        await enrollment.save({ session });
      }

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancel payment
   * Sinh viên hoặc Admin hủy thanh toán PENDING.
   */
  async cancelPayment(paymentId, userId, isAdmin) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) throw new NotFoundError("Không tìm thấy thông tin thanh toán.");

      if (!isAdmin && payment.studentId.toString() !== userId.toString()) {
        throw new BusinessRuleError("Không có quyền hủy thanh toán này.");
      }

      if (payment.status !== "PENDING") {
        throw new BusinessRuleError(
          `Chỉ thanh toán PENDING mới có thể hủy. Hiện tại: ${payment.status}.`
        );
      }

      const enrollment = await Enrollment.findById(payment.enrollmentId).session(session);
      if (!enrollment) throw new NotFoundError("Ghi danh không tồn tại.");

      // Update Payment
      payment.status = "CANCELLED";
      await payment.save({ session });

      // Cập nhật Enrollment thành CANCELLED (theo spec: PENDING_PAYMENT -> CANCELLED)
      if (enrollment.status === "PENDING_PAYMENT") {
        enrollment.status = "CANCELLED";
        await enrollment.save({ session });
      }

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund payment
   * Admin hoàn tiền cho thanh toán đã PAID. Enrollment không đổi.
   */
  async refundPayment(paymentId, adminId, reason = "") {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError("Không tìm thấy thông tin thanh toán.");

    if (payment.status !== "PAID") {
      throw new BusinessRuleError(
        `Chỉ có thể hoàn tiền cho thanh toán PAID. Hiện tại: ${payment.status}.`
      );
    }

    payment.status = "REFUNDED";
    payment.refundedAt = new Date();
    payment.refundedBy = adminId;
    payment.refundReason = reason;
    await payment.save();

    // Theo spec: "Refund and Enrollment lifecycle must remain separate." -> Không đổi Enrollment.
    return payment;
  }
}

export default new PaymentService();

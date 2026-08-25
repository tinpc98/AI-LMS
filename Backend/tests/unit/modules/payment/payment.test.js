import { describe, it, expect, vi, beforeEach } from "vitest";
import paymentService from "#modules/payment/payment.service.js";
import Payment from "#modules/payment/payment.model.js";
import PaymentConfig from "#modules/payment/paymentConfig.model.js";
import { Enrollment } from "#modules/enrollment/index.js";
import { Course } from "#modules/course/index.js";
import mongoose from "mongoose";

// Mocks
vi.mock("#modules/payment/payment.model.js");
vi.mock("#modules/payment/paymentConfig.model.js");
vi.mock("#modules/enrollment/index.js", () => ({
  Enrollment: {
    findById: vi.fn(),
  },
}));
vi.mock("#modules/course/index.js", () => ({
  Course: {
    findById: vi.fn(),
  },
}));

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: vi.fn().mockResolvedValue({
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      }),
      Types: actual.Types
    },
    startSession: vi.fn().mockResolvedValue({
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    }),
  };
});

describe("Payment Service", () => {
  const STUDENT_ID = new mongoose.Types.ObjectId().toString();
  const ENROLLMENT_ID = new mongoose.Types.ObjectId().toString();
  const COURSE_ID = new mongoose.Types.ObjectId().toString();
  const ADMIN_ID = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPayment", () => {
    it("Tạo payment thành công cho enrollment PENDING_PAYMENT", async () => {
      Enrollment.findById.mockResolvedValue({
        _id: ENROLLMENT_ID,
        studentId: STUDENT_ID,
        courseId: COURSE_ID,
        status: "PENDING_PAYMENT"
      });

      Course.findById.mockResolvedValue({
        _id: COURSE_ID,
        status: "PUBLISHED",
        pricing: { tuitionFee: 2000000, currency: "VND" }
      });

      Payment.findOne.mockResolvedValue(null);
      PaymentConfig.findOne.mockResolvedValue({
        bankName: "VCB",
        accountNumber: "123",
        accountName: "TEST",
        transferPrefix: "EDU",
        isActive: true
      });

      Payment.create.mockResolvedValue({ _id: "pay1", amount: 2000000 });

      const result = await paymentService.createPayment(ENROLLMENT_ID, STUDENT_ID);
      expect(result.amount).toBe(2000000);
      expect(Payment.create).toHaveBeenCalled();
    });

    it("Chặn tạo payment nếu Enrollment đã APPROVED", async () => {
      Enrollment.findById.mockResolvedValue({
        _id: ENROLLMENT_ID,
        studentId: STUDENT_ID,
        status: "APPROVED"
      });
      await expect(paymentService.createPayment(ENROLLMENT_ID, STUDENT_ID)).rejects.toThrow(/Không thể tạo thanh toán/);
    });

    it("Lấy lại payment cũ nếu đã có payment PENDING", async () => {
      Enrollment.findById.mockResolvedValue({
        _id: ENROLLMENT_ID,
        studentId: STUDENT_ID,
        courseId: COURSE_ID,
        status: "PENDING_PAYMENT"
      });
      Course.findById.mockResolvedValue({ status: "PUBLISHED" });
      Payment.findOne.mockResolvedValue({ _id: "pay1", status: "PENDING" });

      const result = await paymentService.createPayment(ENROLLMENT_ID, STUDENT_ID);
      expect(result._id).toBe("pay1");
      expect(Payment.create).not.toHaveBeenCalled();
    });

    it("Chặn tạo payment nếu khóa học bị ARCHIVED", async () => {
      Enrollment.findById.mockResolvedValue({ status: "PENDING_PAYMENT", studentId: STUDENT_ID });
      Course.findById.mockResolvedValue({ status: "ARCHIVED" });
      await expect(paymentService.createPayment(ENROLLMENT_ID, STUDENT_ID)).rejects.toThrow(/bị lưu trữ/);
    });
  });

  describe("confirmPayment", () => {
    it("Xác nhận payment PENDING -> PAID và cập nhật Enrollment", async () => {
      const paymentMock = { _id: "pay1", status: "PENDING", enrollmentId: ENROLLMENT_ID, save: vi.fn() };
      const enrollmentMock = { _id: ENROLLMENT_ID, status: "PAYMENT_PENDING_CONFIRMATION", save: vi.fn() };

      Payment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(paymentMock) });
      Enrollment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(enrollmentMock) });

      await paymentService.confirmPayment("pay1", ADMIN_ID);
      
      expect(paymentMock.status).toBe("PAID");
      expect(paymentMock.confirmedBy).toBe(ADMIN_ID);
      expect(paymentMock.save).toHaveBeenCalled();
      
      expect(enrollmentMock.status).toBe("APPROVED");
      expect(enrollmentMock.save).toHaveBeenCalled();
    });

    it("Chặn confirm nếu payment không PENDING", async () => {
      const paymentMock = { status: "PAID" };
      Payment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(paymentMock) });
      await expect(paymentService.confirmPayment("pay1", ADMIN_ID)).rejects.toThrow(/Không thể xác nhận/);
    });

    it("Chặn confirm nếu Enrollment đang ở PENDING_PAYMENT (chưa submit)", async () => {
      const paymentMock = { _id: "pay1", status: "PENDING", enrollmentId: ENROLLMENT_ID, save: vi.fn() };
      const enrollmentMock = { _id: ENROLLMENT_ID, status: "PENDING_PAYMENT", save: vi.fn() };

      Payment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(paymentMock) });
      Enrollment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(enrollmentMock) });

      await expect(paymentService.confirmPayment("pay1", ADMIN_ID)).rejects.toThrow(/không thể cập nhật thanh toán/);
    });
  });

  describe("cancelPayment", () => {
    it("Hủy thanh toán cập nhật cả Enrollment -> CANCELLED", async () => {
      const paymentMock = { studentId: STUDENT_ID, status: "PENDING", enrollmentId: ENROLLMENT_ID, save: vi.fn() };
      const enrollmentMock = { _id: ENROLLMENT_ID, status: "PENDING_PAYMENT", save: vi.fn() };
      
      Payment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(paymentMock) });
      Enrollment.findById = vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(enrollmentMock) });

      await paymentService.cancelPayment("pay1", STUDENT_ID, false);
      expect(paymentMock.status).toBe("CANCELLED");
      expect(enrollmentMock.status).toBe("CANCELLED");
    });
  });

  describe("refundPayment", () => {
    it("Chỉ Admin mới có quyền gọi từ controller, service chỉ đổi PAYMENT sang REFUNDED", async () => {
      const paymentMock = { status: "PAID", save: vi.fn() };
      Payment.findById.mockResolvedValue(paymentMock);

      await paymentService.refundPayment("pay1");
      expect(paymentMock.status).toBe("REFUNDED");
    });

    it("Chặn refund nếu payment chưa PAID", async () => {
      Payment.findById.mockResolvedValue({ status: "PENDING" });
      await expect(paymentService.refundPayment("pay1")).rejects.toThrow(/Chỉ có thể hoàn tiền cho thanh toán PAID/);
    });
  });
});

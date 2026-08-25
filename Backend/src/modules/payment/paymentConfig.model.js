import { Schema, model } from "mongoose";

/**
 * PaymentConfig — Cấu hình thông tin thanh toán tập trung cho toàn trung tâm.
 * Chỉ có một record (hoặc record đầu tiên) được dùng làm active config.
 */
const paymentConfigSchema = new Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    transferPrefix: {
      type: String,
      required: true,
      trim: true,
      default: "EDU",
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PaymentConfig = model("PaymentConfig", paymentConfigSchema);
export default PaymentConfig;

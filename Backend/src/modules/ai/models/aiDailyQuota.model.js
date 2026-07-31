import mongoose from "mongoose";

const aiDailyQuotaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateString: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index for atomic UPSERT operations
aiDailyQuotaSchema.index({ userId: 1, dateString: 1 }, { unique: true });

/**
 * TTL: MongoDB tự xoá bản ghi sau 7 ngày (§6.x Wave 6).
 *
 * VÌ SAO COLLECTION NÀY CẦN TTL
 *
 * Mỗi người dùng sinh MỘT document MỖI NGÀY có gọi AI. Nó chỉ là một bộ đếm; qua ngày hôm sau
 * thì không ai đọc nữa — checkUserQuota và reserveQuota đều truy vấn theo dateString của HÔM
 * NAY. Không có TTL thì collection này phình tuyến tính theo (số người dùng × số ngày) mãi
 * mãi, để lưu những con số không còn ai hỏi tới.
 *
 * VÌ SAO 7 NGÀY CHỨ KHÔNG PHẢI 1
 *
 * Job aiPendingRecovery hoàn trả lượt cho các request treo, và nó hoàn vào document của NGÀY
 * request được tạo (usage.quotaDateString), không phải ngày hôm nay. Ngưỡng treo là 5 phút và
 * job chạy mỗi 5 phút, nên trong thực tế việc hoàn trả xảy ra trong vòng vài phút — nhưng xoá
 * sau đúng 1 ngày sẽ khiến một request treo qua nửa đêm mất chỗ để hoàn. 7 ngày là biên an
 * toàn lớn mà vẫn chặn được phình vô hạn.
 *
 * ĐÂY LÀ MỘT INDEX XOÁ DỮ LIỆU — chỉ đặt cho collection nào chắc chắn không ai đọc lại. Các
 * collection khác (aiUsage, notification, learningActivity) cũng phình theo thời gian nhưng
 * chứa dữ liệu có thể còn cần cho đối soát và lịch sử; xoá tự động là quyết định nghiệp vụ,
 * không phải kỹ thuật, nên KHÔNG đặt TTL ở đó.
 */
aiDailyQuotaSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model("AIDailyQuota", aiDailyQuotaSchema);

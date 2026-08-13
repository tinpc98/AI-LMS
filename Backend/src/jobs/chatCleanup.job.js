import Message from "#modules/chat/message.model.js";
import storageService from "#shared/services/storage.service.js";

/**
 * runChatCleanup - Dọn dẹp các tin nhắn đã xóa mềm quá 30 ngày.
 *
 * Thực hiện:
 * 1. Tìm các Message có isDeleted = true VÀ updatedAt < 30 ngày trước.
 * 2. Lặp qua từng tin nhắn, xóa cứng các file đính kèm trên Cloudinary.
 * 3. Hard delete (xóa vĩnh viễn) tin nhắn khỏi Database.
 */
export const runChatCleanup = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tìm các tin nhắn thỏa mãn điều kiện xóa cứng
  const expiredMessages = await Message.find({
    isDeleted: true,
    updatedAt: { $lt: thirtyDaysAgo },
  });

  if (expiredMessages.length === 0) {
    return { deleted: 0, failedFiles: 0 };
  }

  let deletedCount = 0;
  let failedFilesCount = 0;

  for (const message of expiredMessages) {
    // 1. Dọn dẹp tệp trên Cloudinary (nếu có)
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        if (attachment.publicId) {
          try {
            await storageService.deleteFile(attachment.publicId, {
              resourceType: attachment.resourceType || "raw",
              storageType: attachment.storageType || "authenticated",
            });
          } catch (err) {
            console.error(`[Chat Cleanup] Lỗi xóa file Cloudinary (publicId: ${attachment.publicId}):`, err);
            failedFilesCount++;
          }
        }
      }
    }

    // 2. Hard delete bản ghi
    await Message.findByIdAndDelete(message._id);
    deletedCount++;
  }

  return { deleted: deletedCount, failedFiles: failedFilesCount };
};

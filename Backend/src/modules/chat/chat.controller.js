import { matchedData } from "express-validator";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import { AppError } from "#shared/utils/appError.js";
import Message from "./message.model.js";
import ChatReceipt from "./chatReceipt.model.js";
import storageService from "#shared/services/storage.service.js";

export const decodeOriginalName = (name) => {
  if (!name || typeof name !== "string") return "";
  const hasHighUnicode = Array.from(name).some((char) => char.charCodeAt(0) > 255);
  if (hasHighUnicode) return name;
  try {
    const decoded = Buffer.from(name, "latin1").toString("utf8");
    return decoded.includes("\uFFFD") ? name : decoded;
  } catch {
    return name;
  }
};

// Lấy danh sách tin nhắn, phân trang bằng cursor _id
export const getMessages = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { cursor, limit = 50 } = req.query;

  const query = { classId };
  if (cursor) {
    query._id = { $lt: cursor };
  }

  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(Number(limit))
    .populate("senderId", "fullName avatar email role")
    .populate("replyTo", "content senderId type isDeleted")
    .lean();

  const userId = req.user.id || req.user._id;

  // Xử lý nhóm reaction cho mỗi tin nhắn
  const formattedMessages = messages.map((msg) => {
    let reactionsSummary = [];
    let userReaction = null;

    if (msg.reactions && msg.reactions.length > 0) {
      const counts = {};
      for (const r of msg.reactions) {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (r.userId.toString() === userId.toString()) {
          userReaction = r.emoji;
        }
      }
      reactionsSummary = Object.keys(counts).map((emoji) => ({ emoji, count: counts[emoji] }));
    }

    return {
      ...msg,
      reactionsSummary,
      userReaction,
      reactions: undefined, // Không trả về mảng gốc
    };
  });

  res.status(200).json({
    success: true,
    data: formattedMessages.reverse(), // Trả về thứ tự cũ trước, mới sau để UI dễ render
    nextCursor: messages.length > 0 ? messages[0]._id : null,
  });
});

// Gửi tin nhắn
export const sendMessage = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id || req.user._id;
  const data = matchedData(req, { locations: ["body"] });

  const newMessage = await Message.create({
    classId,
    senderId: userId,
    type: data.type || "text",
    content: data.content || "",
    attachments: data.attachments || [],
    replyTo: data.replyTo || null,
  });

  const populatedMessage = await Message.findById(newMessage._id)
    .populate("senderId", "fullName avatar email role")
    .populate("replyTo", "content senderId type isDeleted")
    .lean();

  // Phát sự kiện socket báo tin mới
  const io = req.app.get("io");
  if (io) {
    io.to(`chat_class_${classId}`).emit("CHAT_NEW_MESSAGE", populatedMessage);
  }

  res.status(201).json({
    success: true,
    message: "Gửi tin nhắn thành công",
    data: populatedMessage,
  });
});

// Sửa tin nhắn
export const editMessage = asyncHandler(async (req, res) => {
  const { classId, messageId } = req.params;
  const userId = req.user.id || req.user._id;
  const { content } = matchedData(req, { locations: ["body"] });

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Không tìm thấy tin nhắn", "MESSAGE_NOT_FOUND", 404);
  }

  if (message.classId.toString() !== classId) {
    throw new AppError("Tin nhắn không thuộc lớp này", "INVALID_CLASS", 400);
  }

  if (message.senderId.toString() !== userId.toString()) {
    throw new AppError("Bạn chỉ có thể sửa tin nhắn của chính mình", "FORBIDDEN", 403);
  }

  if (message.isDeleted) {
    throw new AppError("Không thể sửa tin nhắn đã xóa", "MESSAGE_DELETED", 400);
  }

  // Kiểm tra giới hạn 15 phút
  const now = new Date();
  const diffMinutes = (now - message.createdAt) / 1000 / 60;
  if (diffMinutes > 15) {
    throw new AppError(
      "Chỉ có thể sửa tin nhắn trong vòng 15 phút sau khi gửi",
      "EDIT_TIMEOUT",
      403
    );
  }

  message.content = content;
  message.editedAt = now;
  await message.save();

  const populatedMessage = await Message.findById(messageId)
    .populate("senderId", "fullName avatar email role")
    .populate("replyTo", "content senderId type isDeleted")
    .lean();

  const io = req.app.get("io");
  if (io) {
    io.to(`chat_class_${classId}`).emit("CHAT_EDIT_MESSAGE", populatedMessage);
  }

  res.status(200).json({
    success: true,
    message: "Sửa tin nhắn thành công",
    data: populatedMessage,
  });
});

// Xóa tin nhắn (Xóa mềm)
export const deleteMessage = asyncHandler(async (req, res) => {
  const { classId, messageId } = req.params;
  const userId = req.user.id || req.user._id;
  const role = req.user.role.toLowerCase();

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Không tìm thấy tin nhắn", "MESSAGE_NOT_FOUND", 404);
  }

  if (message.classId.toString() !== classId) {
    throw new AppError("Tin nhắn không thuộc lớp này", "INVALID_CLASS", 400);
  }

  if (message.isDeleted) {
    throw new AppError("Tin nhắn đã bị xóa trước đó", "ALREADY_DELETED", 400);
  }

  // Quyền xóa: Người gửi, Giáo viên phụ trách (req.classDetail được set ở checkClassAccess), Admin
  const isSender = message.senderId.toString() === userId.toString();
  const isTeacherOfClass =
    role === "teacher" && req.classDetail?.teacherId?.toString() === userId.toString();
  const isAdmin = role === "admin";

  if (!isSender && !isTeacherOfClass && !isAdmin) {
    throw new AppError("Bạn không có quyền xóa tin nhắn này", "FORBIDDEN", 403);
  }

  message.isDeleted = true;
  message.deletedBy = userId;
  await message.save();

  // ĐÃ SỬA: Không xóa file trên storage nữa để giữ tệp lưu trữ cho việc truy vết (soft delete)
  // File rác sẽ được dọn dẹp bởi cron job chatCleanup.job.js sau 30 ngày.

  const io = req.app.get("io");
  if (io) {
    io.to(`chat_class_${classId}`).emit("CHAT_DELETE_MESSAGE", {
      messageId,
      classId,
      isDeleted: true,
      deletedBy: userId,
    });
  }

  res.status(200).json({
    success: true,
    message: "Xóa tin nhắn thành công",
  });
});

// Tải file đính kèm
export const uploadAttachment = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (!req.file) {
    throw new AppError("Chưa có file được tải lên", "FILE_REQUIRED", 400);
  }

  const folder = `eduspace/classes/${classId}/chat`;
  const isImage = req.file.mimetype.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  const decodedName = decodeOriginalName(req.file.originalname);

  const result = await storageService.uploadFile(req.file.buffer, decodedName, {
    folder,
    resourceType,
  });

  res.status(201).json({
    success: true,
    data: {
      publicId: result.publicId,
      fileName: result.originalFilename,
      mimeType: req.file.detectedMime || req.file.mimetype,
      bytes: result.bytes,
      storageType: "authenticated",
      // Ở đây ta tạm lấy null cho width/height, việc lấy w/h thật nếu cần có thể dùng thư viện xử lý ảnh
      width: null,
      height: null,
    },
  });
});

// Lấy Signed URL cho tệp đính kèm
export const getAttachmentSignedUrl = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { resourceType = "raw" } = req.query; // client truyền lên "image" hoặc "raw"

  const urlData = storageService.getSignedUrl(publicId, {
    resourceType,
    storageType: "authenticated",
    durationSeconds: 3600, // 1 giờ
  });

  res.status(200).json({
    success: true,
    data: urlData,
  });
});

// Đánh dấu đã đọc
export const markAsRead = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { lastReadMessageId } = req.body;
  const userId = req.user.id || req.user._id;

  if (!lastReadMessageId) {
    throw new AppError("Cần cung cấp lastReadMessageId", "MISSING_DATA", 400);
  }

  await ChatReceipt.findOneAndUpdate(
    { classId, userId },
    { lastReadMessageId },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    message: "Đã đánh dấu đọc",
  });
});

// Lấy số tin chưa đọc
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id || req.user._id;

  const receipt = await ChatReceipt.findOne({ classId, userId }).lean();
  let query = { classId, isDeleted: false };

  if (receipt && receipt.lastReadMessageId) {
    query._id = { $gt: receipt.lastReadMessageId };
  }

  const unreadCount = await Message.countDocuments(query);

  res.status(200).json({
    success: true,
    data: { unreadCount },
  });
});

// Thả hoặc đổi Reaction
export const addReaction = asyncHandler(async (req, res) => {
  const { classId, messageId } = req.params;
  const userId = req.user.id || req.user._id;
  const { emoji } = req.body;

  const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  if (!emoji || !validEmojis.includes(emoji)) {
    throw new AppError("Emoji không hợp lệ", "INVALID_EMOJI", 400);
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Không tìm thấy tin nhắn", "MESSAGE_NOT_FOUND", 404);
  }
  if (message.isDeleted) {
    throw new AppError("Không thể thả cảm xúc vào tin nhắn đã xóa", "MESSAGE_DELETED", 400);
  }
  if (message.classId.toString() !== classId) {
    throw new AppError("Tin nhắn không thuộc lớp này", "INVALID_CLASS", 400);
  }

  // Toggle nếu giống cũ, Replace nếu khác
  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString()
  );

  if (existingReactionIndex !== -1) {
    if (message.reactions[existingReactionIndex].emoji === emoji) {
      // Toggle (xóa)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Đổi
      message.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Thêm mới
    message.reactions.push({ emoji, userId });
  }

  await message.save();

  // Đếm lại summary để phát socket
  const counts = {};
  let userReaction = null;
  for (const r of message.reactions) {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    if (r.userId.toString() === userId.toString()) {
      userReaction = r.emoji;
    }
  }
  const reactionsSummary = Object.keys(counts).map((e) => ({ emoji: e, count: counts[e] }));

  const io = req.app.get("io");
  if (io) {
    io.to(`chat_class_${classId}`).emit("CHAT_REACTION_UPDATE", {
      messageId,
      reactionsSummary,
      userReaction: { userId, emoji: userReaction },
    });
  }

  res.status(200).json({
    success: true,
    message: "Thao tác thành công",
    data: {
      reactionsSummary,
      userReaction,
    },
  });
});

// Xóa Reaction
export const removeReaction = asyncHandler(async (req, res) => {
  const { classId, messageId } = req.params;
  const userId = req.user.id || req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Không tìm thấy tin nhắn", "MESSAGE_NOT_FOUND", 404);
  }
  if (message.classId.toString() !== classId) {
    throw new AppError("Tin nhắn không thuộc lớp này", "INVALID_CLASS", 400);
  }

  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString()
  );

  if (existingReactionIndex !== -1) {
    message.reactions.splice(existingReactionIndex, 1);
    await message.save();
  }

  // Đếm lại summary
  const counts = {};
  for (const r of message.reactions) {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  }
  const reactionsSummary = Object.keys(counts).map((e) => ({ emoji: e, count: counts[e] }));

  const io = req.app.get("io");
  if (io) {
    io.to(`chat_class_${classId}`).emit("CHAT_REACTION_UPDATE", {
      messageId,
      reactionsSummary,
      userReaction: { userId, emoji: null },
    });
  }

  res.status(200).json({
    success: true,
    message: "Đã gỡ cảm xúc",
    data: {
      reactionsSummary,
      userReaction: null,
    },
  });
});

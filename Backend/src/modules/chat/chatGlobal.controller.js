import mongoose from "mongoose";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { Class } from "#modules/class/index.js";
import Message from "./message.model.js";
import ChatReceipt from "./chatReceipt.model.js";

// GET /api/messages/unread-summary
export const getUnreadSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const role = (req.user.role || "").toLowerCase();

  // Admin có thể có vô số lớp, không cần đếm badge
  if (role === "admin") {
    return res.status(200).json({
      success: true,
      data: {
        totalUnread: 0,
        details: [],
      }
    });
  }

  // 1. Lấy danh sách lớp học của user (1 truy vấn)
  let classQuery = { isDeleted: false };
  if (role === "teacher") {
    classQuery.teacherId = userId;
  } else if (role === "student") {
    classQuery.students = {
      $elemMatch: { studentId: userId, status: "Enrolled" }
    };
  }

  const classes = await Class.find(classQuery).select("_id className").lean();
  
  if (classes.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalUnread: 0,
        details: [],
      }
    });
  }

  const classIds = classes.map(c => c._id);
  const classMap = classes.reduce((map, c) => {
    map[c._id.toString()] = c.className;
    return map;
  }, {});

  // 2. Lấy Chat Receipts (1 truy vấn)
  const receipts = await ChatReceipt.find({
    userId,
    classId: { $in: classIds }
  }).lean();

  const receiptMap = receipts.reduce((map, r) => {
    map[r.classId.toString()] = r.lastReadMessageId;
    return map;
  }, {});

  // 3. Đếm số tin nhắn chưa đọc & Lấy tin nhắn cuối (1 truy vấn Aggregate)
  // Tạo mảng `$facet` hoặc chạy 1 aggregate với `$match` + `$group`
  // Tuy nhiên, mỗi lớp có 1 lastReadMessageId khác nhau, ta không thể $match chung một điều kiện > lastReadMessageId.
  // Thay vào đó, ta sẽ $match tất cả tin nhắn của các classIds (không xóa), 
  // Sau đó dùng $group, trong $group tính sum với điều kiện:
  // if (_id > lastReadMessageId của lớp đó) thì 1 else 0.
  // Mongoose Aggregation có thể gặp khó khi truyền `receiptMap` vào trong pipeline (vì pipeline chạy trên DB server).
  // Cách giải quyết tốt nhất: Dùng `$match` classId trong danh sách, sau đó lấy tin nhắn, việc filter đếm có thể tự thực hiện ở server Node.js nếu số lượng tin nhắn ít, 
  // HOẶC tạo query aggregate động cho từng lớp dùng `$facet` (vì số lớp thường <= 20).
  // Vì người dùng thường có < 20 lớp, dùng $facet là cực kỳ tối ưu và giữ nguyên 1 truy vấn.
  
  const facetPipeline = {};
  for (const cid of classIds) {
    const classIdStr = cid.toString();
    const lastRead = receiptMap[classIdStr];
    
    const matchCond = {
      classId: cid,
      isDeleted: false
    };
    if (lastRead) {
      matchCond._id = { $gt: lastRead };
    }

    facetPipeline[`class_${classIdStr}_unread`] = [
      { $match: matchCond },
      { $count: "count" }
    ];

    facetPipeline[`class_${classIdStr}_lastMsg`] = [
      { $match: { classId: cid, isDeleted: false } },
      { $sort: { _id: -1 } },
      { $limit: 1 }
    ];
  }

  const aggregateResult = await Message.aggregate([{ $facet: facetPipeline }]);
  const resultData = aggregateResult[0];

  let totalUnread = 0;
  const details = [];

  for (const classId of classIds) {
    const classIdStr = classId.toString();
    const classUnread = resultData[`class_${classIdStr}_unread`];
    const classLastMsg = resultData[`class_${classIdStr}_lastMsg`];
    
    const unreadCount = classUnread && classUnread.length > 0 ? classUnread[0].count : 0;
    totalUnread += unreadCount;

    let lastMessage = null;
    if (classLastMsg && classLastMsg.length > 0) {
      const msg = classLastMsg[0];
      lastMessage = {
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        type: msg.type
      };
    }

    details.push({
      classId: classIdStr,
      className: classMap[classIdStr],
      unreadCount,
      lastMessage
    });
  }

  // Tùy chọn: Để lastMessageSender hiện tên, ta có thể query lấy Users của danh sách sender.
  const senderIds = [...new Set(details.filter(d => d.lastMessage && d.lastMessage.senderId).map(d => d.lastMessage.senderId.toString()))];
  if (senderIds.length > 0) {
    const mongoose = (await import("mongoose")).default;
    const User = mongoose.model("User");
    const senders = await User.find({ _id: { $in: senderIds } }).select("fullName").lean();
    const senderMap = senders.reduce((map, s) => {
      map[s._id.toString()] = s.fullName;
      return map;
    }, {});
    
    for (const d of details) {
      if (d.lastMessage && d.lastMessage.senderId) {
        d.lastMessage.senderName = senderMap[d.lastMessage.senderId.toString()] || "Người dùng";
      }
    }
  }

  // Sắp xếp details theo thời gian tin nhắn mới nhất
  details.sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return res.status(200).json({
    success: true,
    data: {
      totalUnread,
      details
    }
  });
});

import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

/**
 * Socket Error Helper
 */
export const createSocketError = (code, message) => {
  const err = new Error(message);
  err.data = { code, message, details: null };
  return err;
};

/**
 * Chuẩn hóa chuỗi Token Bearer
 */
const normalizeBearerToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") return null;
  if (rawToken.startsWith("Bearer ")) {
    return rawToken.slice(7).trim();
  }
  return rawToken.trim();
};

/**
 * Socket.IO Middleware: Xác thực Handshake JWT Token & User Identity
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    const token = normalizeBearerToken(rawToken);

    if (!token) {
      return next(
        createSocketError("SOCKET_AUTH_MISSING_TOKEN", "Thiếu token xác thực kết nối Socket.")
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return next(
        createSocketError("SOCKET_AUTH_INVALID_TOKEN", "Token xác thực không hợp lệ hoặc đã hết hạn.")
      );
    }

    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) {
      return next(
        createSocketError("SOCKET_AUTH_INVALID_TOKEN", "Token không chứa định danh người dùng.")
      );
    }

    const user = await User.findOne({ _id: userId, isDeleted: false }).select(
      "_id role email fullName"
    );

    if (!user) {
      return next(
        createSocketError("SOCKET_AUTH_USER_NOT_FOUND", "Tài khoản không tồn tại hoặc đã bị khóa.")
      );
    }

    // Gán thông tin danh tính đã được kiểm chứng vào Socket object
    socket.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      role: (user.role || "").toLowerCase(),
      email: user.email,
      name: user.fullName,
    };

    return next();
  } catch (error) {
    console.error("[SOCKET_AUTH] Internal Auth Error:", error.message);
    return next(
      createSocketError("SOCKET_INTERNAL_ERROR", "Lỗi hệ thống khi xác thực kết nối WebSockets.")
    );
  }
};

export default socketAuthMiddleware;

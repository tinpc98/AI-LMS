import { registerService, loginService } from "../services/auth.services.js";
import { validationResult } from "express-validator";
import User from "../models/user.models.js";

export const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const user = await registerService({ email, password, fullName, role });

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công!",
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || "Lỗi hệ thống. Vui lòng thử lại sau.",
    });
  }
};

export const login = async (req, res) => {
  try {
    // Kiểm tra xem dữ liệu đầu vào có vi phạm bộ lọc validate ở file validators.js không

    const { email, password } = req.body;

    // Dev-only debug: log incoming login attempt (DO NOT log passwords in production)
    if (process.env.NODE_ENV === "development") {
      console.log("[Auth] Login attempt:", {
        email: String(email).slice(0, 60),
        ip: req.ip,
      });
    }

    // Gọi Service xử lý logic xác thực, băm mật khẩu, check database
    const result = await loginService(email, password);

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Auth] Login successful for:",
        result.user.email || result.user.id,
      );
    }

    // Trả về mã 200 OK kèm Token cho Frontend lưu trữ
    return res.status(200).json({
      message: "Đăng nhập thành công rực rỡ!",
      accessToken: result.accessToken,
      data: result.user,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Auth] Login error:", error.message);
    }
    // Nếu Service ném lỗi (sai pass, sai email), khối catch này sẽ hứng và trả về mã 400
    const status = error.status || 500;
    return res.status(status).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    // req.user.id được lấy từ middleware giải mã token (verifyToken)
    const userId = req.user.id;

    // Tìm user và DÙNG .select('-password') ĐỂ GIẤU MẬT KHẨU KHỎI JSON TRẢ VỀ
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin tài khoản!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin tài khoản thành công",
      data: user,
    });
  } catch (error) {
    console.error("Lỗi getMyProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ: " + error.message,
    });
  }
};
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy các trường mà user muốn cập nhật từ Frontend gửi lên
    const { fullName, phone, address, avatar } = req.body;

    // Không cho phép cập nhật email, password hoặc role thông qua API này để bảo mật
    const updateData = {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(avatar && { avatar }),
    };

    // { new: true } giúp Mongoose trả về object sau khi đã cập nhật xong
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi updateMyProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật tài khoản: " + error.message,
    });
  }
};

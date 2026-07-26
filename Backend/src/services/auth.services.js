import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const loginService = async (email, password) => {
  // Chuẩn hóa email đầu vào để tìm kiếm chính xác tuyệt đối
  const normalizedEmail = String(email).trim().toLowerCase();

  // Bước 1: Tìm xem email này có tồn tại trong hệ thống Cloud Atlas không
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("Tài khoản hoặc email không tồn tại trên hệ thống!");
    error.status(401);
    throw error;
  }

  // Bước 2: Đối chiếu mật khẩu thô người dùng nhập với mật khẩu đã băm (hash) trong DB
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác, vui lòng thử lại!");
    error.status(401);
    throw error;
  }

  // Bước 3: Tạo Access Token (Thẻ thông hành) thời hạn 1 ngày
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "123456", // Chìa khóa bí mật để xác thực lấy từ file .env
    { expiresIn: "1d" },
  );

  // Bước 4: Trả dữ liệu sạch về cho Controller
  return {
    accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};

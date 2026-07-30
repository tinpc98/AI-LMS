import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const loginService = async (email, password) => {
  // Chuẩn hóa email đầu vào để tìm kiếm chính xác tuyệt đối
  const normalizedEmail = String(email).trim().toLowerCase();

  // Bước 1: Tìm xem email này có tồn tại trong hệ thống không (bao gồm tài khoản đã xóa để kiểm tra vô hiệu hóa)
  const user = await User.findOne({ email: normalizedEmail }).withDeleted();
  if (!user) {
    const error = new Error("Tài khoản hoặc email không tồn tại trên hệ thống!");
    error.status = 401;
    throw error;
  }

  // Phân vùng kiểm tra tài khoản đã bị vô hiệu hóa / Soft Delete
  if (user.isDeleted) {
    const error = new Error("Tài khoản đã bị vô hiệu hóa.");
    error.status = 403;
    throw error;
  }

  // Bước 2: Đối chiếu mật khẩu thô người dùng nhập với mật khẩu đã băm (hash) trong DB
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Mật khẩu không chính xác, vui lòng thử lại!");
    error.status = 401;
    throw error;
  }

  // Kiểm tra tài khoản có bị khóa hay không
  if (user.status === "Inactive" || user.status === "Locked") {
    const error = new Error("Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!");
    error.status = 403;
    throw error;
  }

  // Bước 3: Tạo Access Token thời hạn 1 ngày
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "123456",
    { expiresIn: "1d" }
  );

  // Bước 4: Trả dữ liệu sạch về cho Controller
  return {
    accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
    },
  };
};

export const getUserTrashService = async (queryParams) => {
  const { search, role, status, page = 1, limit = 10, sort = "deletedAt", order = "desc" } = queryParams;
  const query = { isDeleted: true };

  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { fullName: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }
  if (role) query.role = role;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = order === "asc" ? 1 : -1;
  const sortQuery = { [sort]: sortDirection };

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .withDeleted()
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query).withDeleted(),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const restoreUserService = async (id) => {
  const mongoose = (await import("mongoose")).default;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID người dùng không hợp lệ!");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ _id: id }).withDeleted();
  if (!user) {
    const error = new Error("Người dùng không tồn tại");
    error.status = 404;
    throw error;
  }

  if (!user.isDeleted) {
    const error = new Error("Người dùng chưa bị xóa, không thể khôi phục!");
    error.status = 400;
    throw error;
  }

  return await user.restore();
};

export const permanentDeleteUserService = async (id) => {
  const mongoose = (await import("mongoose")).default;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID người dùng không hợp lệ!");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ _id: id }).withDeleted();
  if (!user) {
    const error = new Error("Người dùng không tồn tại");
    error.status = 404;
    throw error;
  }

  if (!user.isDeleted) {
    const error = new Error("Không thể xóa vĩnh viễn người dùng đang hoạt động!");
    error.status = 400;
    throw error;
  }

  return await User.findByIdAndDelete(id).withDeleted();
};

import { loginService } from "../services/auth.services.js";
import User from "../models/user.models.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (process.env.NODE_ENV === "development") {
      console.log("[Auth] Login attempt:", {
        email: String(email).slice(0, 60),
        ip: req.ip,
      });
    }

    const result = await loginService(email, password);

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Auth] Login successful for:",
        result.user.email || result.user.id
      );
    }

    return res.status(200).json({
      message: "Đăng nhập thành công rực rỡ!",
      accessToken: result.accessToken,
      data: result.user,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Auth] Login error:", error.message);
    }
    const status = error.status || 500;
    return res.status(status).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
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
    const { fullName, phone, avatar, teachingSubjects, availabilitySchedule } = req.body;

    const updateData = {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(avatar && { avatar }),
      ...(req.user.role === "Teacher" && teachingSubjects && { teachingSubjects }),
      ...(req.user.role === "Teacher" && availabilitySchedule && { availabilitySchedule }),
    };

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

// ==========================================
// CÁC HÀM QUẢN LÝ USER DÀNH CHO ADMIN
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách người dùng" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi khi lấy chi tiết người dùng" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, status, phone, teachingSubjects, availabilitySchedule } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ fullName, email và password" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      role: role || "Student",
      status: status || "Active",
      phone: phone || "",
      teachingSubjects: teachingSubjects || [],
      availabilitySchedule: availabilitySchedule || null,
    });

    await newUser.save();
    const createdUser = newUser.toObject();
    delete createdUser.password;

    return res.status(201).json({
      success: true,
      message: "Tạo người dùng thành công",
      data: createdUser,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Lỗi khi tạo người dùng" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...updateFields } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (password) {
      user.password = password; // Sẽ được băm tự động qua pre-save hook
    }

    Object.assign(user, updateFields);
    await user.save();

    const updated = user.toObject();
    delete updated.password;

    return res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Lỗi khi cập nhật người dùng" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    return res.status(200).json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi khi xóa người dùng" });
  }
};

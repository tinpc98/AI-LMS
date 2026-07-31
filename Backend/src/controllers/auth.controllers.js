import mongoose from "mongoose";
import { loginService, getUserTrashService, restoreUserService, permanentDeleteUserService } from "../services/auth.service.js";
import User from "../models/user.model.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu!" });
    }

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
      message: "Đăng nhập thành công!",
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
    const userId = req.user.id || req.user._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Phiên làm việc không hợp lệ!",
      });
    }

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
    const userId = req.user.id || req.user._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Phiên làm việc không hợp lệ!",
      });
    }

    const { fullName, phone, avatar, teachingSubjects, availabilitySchedule } = req.body;
    const userRole = (req.user.role || "").toLowerCase();

    const updateData = {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(avatar && { avatar }),
      ...(userRole === "teacher" && teachingSubjects && { teachingSubjects }),
      ...(userRole === "teacher" && availabilitySchedule && { availabilitySchedule }),
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
    const validRoles = ["Admin", "Teacher", "Student"];

    if (role) {
      const normalizedRole =
        role.charAt(0).toUpperCase() +
        role.slice(1).toLowerCase();

      if (validRoles.includes(normalizedRole)) {
        query.role = normalizedRole;
      }
    }

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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại!" });
    }

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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ!" });
    }

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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ!" });
    }

    const adminUserId = req.user?.id || req.user?._id;
    const user = await User.softDelete(id, adminUserId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    return res.status(200).json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi khi xóa người dùng" });
  }
};

export const getUserTrash = async (req, res) => {
  try {
    const result = await getUserTrashService(req.query);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thùng rác thành công",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Lỗi khi lấy danh sách thùng rác" });
  }
};

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const restoredUser = await restoreUserService(id);

    // Convert to object and delete password if exists
    const data = restoredUser.toObject ? restoredUser.toObject() : restoredUser;
    delete data.password;

    return res.status(200).json({
      success: true,
      message: "Khôi phục người dùng thành công",
      data,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Lỗi khi khôi phục người dùng" });
  }
};

export const permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await permanentDeleteUserService(id);

    return res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn người dùng thành công",
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Lỗi khi xóa vĩnh viễn người dùng" });
  }
};

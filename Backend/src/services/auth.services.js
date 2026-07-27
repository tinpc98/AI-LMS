// File: src/services/auth.services.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

/**
 * Authentication Service
 * Contains all business logic for authentication
 * - User registration and login
 * - Token management
 * - Password operations
 */

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} User data with token
 */
export const registerService = async (userData) => {
  // Business logic to be implemented
  throw new Error("Register service not implemented");
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User data with access token
 * @throws {Error} User not found, password mismatch, or account inactive
 */
export const loginService = async (email, password) => {
  // Bước 1: Chuẩn hóa email
  const normalizedEmail = String(email).trim().toLowerCase();

  // Bước 2: Tìm user trong DB (bao gồm tài khoản đã xóa để kiểm tra)
  const user = await User.findOne({ email: normalizedEmail }).withDeleted();
  
  if (!user) {
    const error = new Error("Email hoặc mật khẩu không chính xác!");
    error.status = 401;
    throw error;
  }

  // Bước 3: Kiểm tra tài khoản đã bị xóa (soft delete)
  if (user.isDeleted) {
    const error = new Error("Tài khoản đã bị xóa!");
    error.status = 403;
    throw error;
  }

  // Bước 4: Kiểm tra trạng thái tài khoản
  if (user.status === "Inactive" || user.status === "Locked") {
    const error = new Error("Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!");
    error.status = 403;
    throw error;
  }

  // Bước 5: So sánh mật khẩu với bcrypt
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  
  if (!isPasswordMatch) {
    const error = new Error("Email hoặc mật khẩu không chính xác!");
    error.status = 401;
    throw error;
  }

  // Bước 6: Tạo JWT Access Token (lấy role từ DB, không tin client)
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role, // Lấy từ DB, không từ client
    },
    process.env.JWT_SECRET || "your-secret-key-change-in-env",
    { expiresIn: "7d" }
  );

  // Bước 7: Trả về dữ liệu người dùng + token
  return {
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar || "",
      phone: user.phone || "",
      status: user.status,
    },
  };
};

/**
 * Logout user
 * @param {string} userId - User ID
 * @param {string} token - User token
 * @returns {Object} Logout result
 */
export const logoutService = async (userId, token) => {
  // Business logic to be implemented
  throw new Error("Logout service not implemented");
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New access token
 */
export const refreshTokenService = async (refreshToken) => {
  // Business logic to be implemented
  throw new Error("Refresh token service not implemented");
};

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Object} User profile data
 */
export const getUserProfileService = async (userId) => {
  // Business logic to be implemented
  throw new Error("Get user profile service not implemented");
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user data
 */
export const updateUserProfileService = async (userId, updateData) => {
  // Business logic to be implemented
  throw new Error("Update user profile service not implemented");
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Result
 */
export const changePasswordService = async (userId, currentPassword, newPassword) => {
  // Business logic to be implemented
  throw new Error("Change password service not implemented");
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Object} Result
 */
export const forgotPasswordService = async (email) => {
  // Business logic to be implemented
  throw new Error("Forgot password service not implemented");
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Object} Result
 */
export const resetPasswordService = async (token, newPassword) => {
  // Business logic to be implemented
  throw new Error("Reset password service not implemented");
};

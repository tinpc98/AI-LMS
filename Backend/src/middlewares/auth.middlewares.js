// File: src/middlewares/auth.middlewares.js
import jwt from "jsonwebtoken";

/**
 * Authentication Middlewares
 * - verifyUser: Verify JWT token and authenticate user
 * - authorize: Check user roles and permissions
 */

/**
 * Verify User Authentication
 * Middleware to check if user is authenticated
 * Extracts and validates JWT token from Authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Usage: router.get("/protected", verifyUser, handler)
 * 
 * Expected header: Authorization: Bearer <token>
 */
export const verifyUser = (req, res, next) => {
  try {
    // Step 1: Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    // Step 2: Extract token from "Bearer <token>" format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Định dạng token không hợp lệ",
      });
    }

    // JWT_SECRET là BẮT BUỘC – không fallback để tránh rủi ro bảo mật
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[Auth] FATAL: JWT_SECRET chưa được thiết lập trong biến môi trường!");
      return res.status(500).json({ message: "Lỗi cấu hình máy chủ. Vui lòng liên hệ quản trị viên." });
    }

    const decoded = jwt.verify(token, jwtSecret);

    // Step 4: Attach user data to req.user (lấy từ token, không từ body)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Step 5: Continue to next middleware/handler
    next();
  } catch (error) {
    console.error("[Auth Middleware] Verify user error:", error.message);

    // Handle different JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Xác thực thất bại",
    });
  }
};

/**
 * Authorize User Role - Teacher
 * Middleware to check if user has Teacher or Admin role
 * Must be used after verifyUser middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Usage: router.get("/admin", verifyUser, isTeacher, handler)
 */
export const isTeacher = (req, res, next) => {
  try {
    // Check if req.user exists (set by verifyUser middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    // Check if user role is "Teacher" or "Admin"
    const userRole = (req.user.role || "").toLowerCase();
    const allowedRoles = ["teacher", "admin"];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập. Chỉ Giáo viên hoặc Admin mới được phép",
      });
    }

    // User is authorized, continue to next handler
    next();
  } catch (error) {
    console.error("[Auth Middleware] Is teacher error:", error);
    res.status(403).json({
      success: false,
      message: "Lỗi xác thực quyền hạn",
    });
  }
};

/**
 * Authorize User Role - Admin
 * Middleware to check if user has Admin role only
 * Must be used after verifyUser middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Usage: router.get("/admin", verifyUser, isAdmin, handler)
 */
export const isAdmin = (req, res, next) => {
  try {
    // Check if req.user exists (set by verifyUser middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    // Check if user role is "Admin" only
    const userRole = (req.user.role || "").toLowerCase();

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập. Chỉ Admin mới được phép",
      });
    }

    // User is authorized, continue to next handler
    next();
  } catch (error) {
    console.error("[Auth Middleware] Is admin error:", error);
    res.status(403).json({
      success: false,
      message: "Lỗi xác thực quyền hạn",
    });
  }
};

/**
 * Authorize User Role - Student
 * Middleware to check if user has Student role
 * Must be used after verifyUser middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Usage: router.get("/student", verifyUser, isStudent, handler)
 */
export const isStudent = (req, res, next) => {
  try {
    // Check if req.user exists (set by verifyUser middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    // Check if user role is "Student"
    const userRole = (req.user.role || "").toLowerCase();

    if (userRole !== "student") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập. Chỉ Học sinh mới được phép",
      });
    }

    // User is authorized, continue to next handler
    next();
  } catch (error) {
    console.error("[Auth Middleware] Is student error:", error);
    res.status(403).json({
      success: false,
      message: "Lỗi xác thực quyền hạn",
    });
  }
};

/**
 * Optional Authentication
 * Middleware to check authentication but not require it
 * Useful for endpoints that have different behavior for logged-in vs non-logged-in users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Usage: router.get("/data", optionalAuth, handler)
 */
export const optionalAuth = (req, res, next) => {
  try {
    // Business logic to be implemented
    // 1. Try to extract and verify token
    // 2. If valid, attach user data to req.user
    // 3. If invalid or missing, continue without user data
    // 4. Always call next()
    
    next();
  } catch (error) {
    console.error("[Auth Middleware] Optional auth error:", error);
    next();
  }
};

/**
 * Authorize Multiple Roles
 * Higher-order middleware to check if user has one of the allowed roles
 * Must be used after verifyUser middleware
 * 
 * Supported roles: "ADMIN", "TEACHER", "STUDENT", "REVIEWER"
 * 
 * @param {...string} allowedRoles - The roles that are allowed to access the route
 * @returns {Function} Express middleware function
 * 
 * Usage:
 *   router.post("/course", verifyUser, authorizeRoles("TEACHER", "ADMIN"), createCourse)
 *   router.delete("/user/:id", verifyUser, authorizeRoles("ADMIN"), deleteUser)
 *   router.get("/submission/:id", verifyUser, authorizeRoles("REVIEWER", "TEACHER", "ADMIN"), getSubmission)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if req.user exists (set by verifyUser middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Bạn chưa đăng nhập",
        });
      }

      // Normalize user role to uppercase for comparison
      const userRole = (req.user.role || "").toUpperCase();

      // Normalize allowed roles to uppercase
      const normalizedAllowedRoles = allowedRoles.map((role) =>
        role.toUpperCase()
      );

      // Check if user role is in allowed roles
      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền truy cập. Chỉ những người dùng với vai trò: ${normalizedAllowedRoles.join(
            ", "
          )} mới được phép`,
        });
      }

      // User is authorized, continue to next handler
      next();
    } catch (error) {
      console.error("[Auth Middleware] Authorize roles error:", error);
      res.status(403).json({
        success: false,
        message: "Lỗi xác thực quyền hạn",
      });
    }
  };
};

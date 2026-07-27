// File: src/middlewares/auth.middlewares.js
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
 */
export const verifyUser = (req, res, next) => {
  try {
    // Business logic to be implemented
    // 1. Extract token from Authorization header
    // 2. Verify token signature and expiration
    // 3. Attach user data to req.user
    // 4. Call next() if successful
    
    res.status(401).json({
      message: "Verify user middleware - not implemented",
    });
  } catch (error) {
    console.error("[Auth Middleware] Verify user error:", error);
    res.status(401).json({
      message: "Authentication failed",
      error: error.message,
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
    // Business logic to be implemented
    // 1. Check if req.user exists
    // 2. Check if user role is "teacher" or "admin"
    // 3. Call next() if authorized, else return 403
    
    res.status(403).json({
      message: "Is teacher middleware - not implemented",
    });
  } catch (error) {
    console.error("[Auth Middleware] Is teacher error:", error);
    res.status(403).json({
      message: "Authorization failed",
      error: error.message,
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
    // Business logic to be implemented
    // 1. Check if req.user exists
    // 2. Check if user role is "admin"
    // 3. Call next() if authorized, else return 403
    
    res.status(403).json({
      message: "Is admin middleware - not implemented",
    });
  } catch (error) {
    console.error("[Auth Middleware] Is admin error:", error);
    res.status(403).json({
      message: "Authorization failed",
      error: error.message,
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
    // Business logic to be implemented
    // 1. Check if req.user exists
    // 2. Check if user role is "student"
    // 3. Call next() if authorized, else return 403
    
    res.status(403).json({
      message: "Is student middleware - not implemented",
    });
  } catch (error) {
    console.error("[Auth Middleware] Is student error:", error);
    res.status(403).json({
      message: "Authorization failed",
      error: error.message,
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

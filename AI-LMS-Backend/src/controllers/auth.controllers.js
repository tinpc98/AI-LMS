
import { registerService, loginService } from '../services/auth.services.js'; 
import { validationResult } from "express-validator";

export const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const user = await registerService({ email, password, fullName, role });

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
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
      message: error.message || 'Lỗi hệ thống. Vui lòng thử lại sau.',
    });
  }
};

export const login = async (req, res) => {
  try {
    // Kiểm tra xem dữ liệu đầu vào có vi phạm bộ lọc validate ở file validators.js không
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Dev-only debug: log incoming login attempt (DO NOT log passwords in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Login attempt:', { email: String(email).slice(0, 60), ip: req.ip });
    }

    // Gọi Service xử lý logic xác thực, băm mật khẩu, check database
    const result = await loginService(email, password);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Login successful for:', result.user.email || result.user.id);
    }

    // Trả về mã 200 OK kèm Token cho Frontend lưu trữ
    return res.status(200).json({
      message: "Đăng nhập thành công rực rỡ!",
      accessToken: result.accessToken,
      data: result.user
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth] Login error:', error.message);
    }
    // Nếu Service ném lỗi (sai pass, sai email), khối catch này sẽ hứng và trả về mã 400
    return res.status(400).json({ message: error.message });
  }
};
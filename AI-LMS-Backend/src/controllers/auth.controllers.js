import { registerService } from '../services/auth.services.js';

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
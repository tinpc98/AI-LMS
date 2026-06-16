import React, { useState, useEffect } from "react";
import { authApi } from "../api/authApi"; 

const headingStyle = {};
const iconStyle = {};

export default function RegistrationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Thêm state kiểm tra lại pass
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student'); // Mặc định là học sinh
  
  // Khai báo bổ sung các biến UI bị thiếu trong code cũ
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      nextErrors.fullName = 'Họ và tên là bắt buộc.';
    } else if (trimmedFullName.length < 3) {
      nextErrors.fullName = 'Họ và tên tối thiểu 3 ký tự.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email là bắt buộc.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Email không hợp lệ.';
    }

    if (!password) {
      nextErrors.password = 'Mật khẩu là bắt buộc.';
    } else if (password.length < 8) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    return nextErrors;
  };

  // Hiệu ứng chuột chạy theo hiệu ứng Glow (nếu có dùng)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setGlowPosition({ x: e.clientX / 20, y: e.clientY / 20 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await authApi.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
      });

      setServerMessage(response.data.message || 'Đăng ký thành công!');
    } catch (error: any) {
      const serverError = error.response?.data?.message || 'Đăng ký thất bại, thử lại sau!';
      setServerMessage(serverError);
    } finally {
      setIsSubmitting(false);
    }
  }; 

  return (
    <div
      className="bg-surface-container-low min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden p-margin-mobile md:p-margin-desktop"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* AI Glow Effect */}
      <div
        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, rgba(255, 255, 255, 0) 70%)",
          transform: `translate(${glowPosition.x}px, ${glowPosition.y}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />

      {/* Main Registration Card */}
      <main className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm p-8 md:p-10 z-10 transition-all duration-300 hover:border-primary-fixed-dim">
        {/* Header & Logo */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 mb-4 overflow-hidden rounded-xl bg-primary-container/10 flex items-center justify-center">
            <img
              alt="EduSynth AI Logo"
              className="w-12 h-12 object-contain"
              src="https://lh3.googleusercontent.com/aida/AP1WRLvagpzKtenUGkwvil3flrlIoVX_D0iCWi-3VslBm3FkRhANSzVIsUi1Cz99-VHB0rcjFN3qbRILR21PAmzAgTe7Uh4SQbnwzWJmJmNtFxaZM27JkknDwT91s80qhaUAbUGFEPZblkjmK0D-GvCscUXP2Eqt_Bz2L7w_Ww_RrgcvcEz5VGXCtnVL_OXcvU3o0kHJntd54PGRJuaxLXdnR2ejPUqBd6zU44o6yObVmaqPNFfCrz9GD_Ac3VPA"
            />
          </div>
          <h2 className="text-primary font-bold text-headline-md mb-2" style={headingStyle}>
            EduSynth AI
          </h2>
          <h1 className="text-on-surface font-semibold text-headline-md" style={headingStyle}>
            Tạo tài khoản mới
          </h1>
        </div>

        {/* Registration Form */}
        {/* FIX LỖI 2: Thay đổi onSubmit sang hàm handleSubmit chính xác */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-label-md text-on-surface-variant" htmlFor="fullname">
              Họ và tên
            </label>
            {/* FIX LỖI 3: Thêm value và onChange */}
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
              id="fullname"
              name="fullname"
              placeholder="Nguyễn Văn A"
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
            />
            {errors.fullName && (
              <p className="text-danger text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-label-md text-on-surface-variant" htmlFor="email">
              Email
            </label>
            {/* FIX LỖI 3: Thêm value và onChange */}
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
              id="email"
              name="email"
              placeholder="example@edusynth.ai"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
            />
            {errors.email && (
              <p className="text-danger text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-label-md text-on-surface-variant" htmlFor="role">
              Chức vụ
            </label>
            <div className="relative">
              {/* FIX LỖI 3: Thêm value và onChange cho select */}
              <select
                className="w-full appearance-none px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150 cursor-pointer"
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-lg" style={iconStyle}>
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-label-md text-on-surface-variant" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative group">
              {/* FIX LỖI 3: Thêm value và onChange */}
              <input
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
              />
            {errors.password && (
              <p className="text-danger text-sm mt-1">{errors.password}</p>
            )}
              <button
                className="absolute inset-y-0 right-0 flex items-center px-3 text-outline hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                <span className="material-symbols-outlined text-lg" style={iconStyle}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-label-md text-on-surface-variant" htmlFor="confirm-password">
              Xác nhận mật khẩu
            </label>
            {/* FIX LỖI 3: Thêm value và onChange */}
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
              id="confirm-password"
              name="confirm-password"
              placeholder="••••••••"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
            />
            {errors.confirmPassword && (
              <p className="text-danger text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Action */}
          {serverMessage && (
            <div className="rounded-md bg-surface-container-high p-3 text-body-sm text-on-surface-variant">
              {serverMessage}
            </div>
          )}
          <div className="pt-4">
            <button
              className="w-full py-4 bg-primary text-on-primary font-semibold rounded-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform" style={iconStyle}>
                arrow_forward
              </span>
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-outline-variant text-center">
          <p className="text-body-sm text-on-surface-variant">
            Đã có tài khoản?
            <a className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-1 transition-all" href="#">
              Đăng nhập
            </a>
          </p>
        </div>
      </main>

      {/* Page Decoration */}
      <div className="mt-12 text-center opacity-50 z-10 hidden md:block">
        <p className="text-on-surface-variant text-xs flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm" style={iconStyle}>
            verified_user
          </span>
          Môi trường học tập bảo mật bởi trí tuệ nhân tạo
        </p>
      </div>
    </div>
  );
}
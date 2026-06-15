import React, { useState, useEffect } from "react";

export default function RegistrationPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });

  // Hiệu ứng di chuyển mượt mà của khối màu AI theo chuột
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 20;
      const y = (e.clientY / window.innerHeight) * 20;
      setGlowPosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const headingStyle = { fontFamily: "'Hanken Grotesk', sans-serif" };
  const iconStyle = {
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
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
          transition: "transform 0.1s ease-out", // Thêm một chút mượt mà nếu cần
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
          <h2
            className="text-primary font-bold text-headline-md mb-2"
            style={headingStyle}
          >
            EduSynth AI
          </h2>
          <h1
            className="text-on-surface font-semibold text-headline-md"
            style={headingStyle}
          >
            Tạo tài khoản mới
          </h1>
        </div>

        {/* Registration Form */}
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Name */}
          <div className="space-y-1.5">
            <label
              className="block text-label-md text-on-surface-variant"
              htmlFor="fullname"
            >
              Họ và tên
            </label>
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
              id="fullname"
              name="fullname"
              placeholder="Nguyễn Văn A"
              type="text"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              className="block text-label-md text-on-surface-variant"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
              id="email"
              name="email"
              placeholder="example@edusynth.ai"
              type="email"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label
              className="block text-label-md text-on-surface-variant"
              htmlFor="role"
            >
              Chức vụ
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150 cursor-pointer"
                id="role"
                name="role"
                defaultValue=""
              >
                <option disabled value="">
                  Chọn vai trò của bạn
                </option>
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-on-surface-variant">
                <span
                  className="material-symbols-outlined text-lg"
                  style={iconStyle}
                >
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              className="block text-label-md text-on-surface-variant"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <div className="relative group">
              <input
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
              />
              <button
                className="absolute inset-y-0 right-0 flex items-center px-3 text-outline hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={iconStyle}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              className="block text-label-md text-on-surface-variant"
              htmlFor="confirm-password"
            >
              Xác nhận mật khẩu
            </label>
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary outline-none transition-all duration-150"
              id="confirm-password"
              name="confirm-password"
              placeholder="••••••••"
              type="password"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              className="w-full py-4 bg-primary text-on-primary font-semibold rounded-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
              type="submit"
            >
              Đăng ký
              <span
                className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform"
                style={iconStyle}
              >
                arrow_forward
              </span>
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-outline-variant text-center">
          <p className="text-body-sm text-on-surface-variant">
            Đã có tài khoản?
            <a
              className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-1 transition-all"
              href="#"
            >
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

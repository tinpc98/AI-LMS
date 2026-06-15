import React, { useState, useEffect } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState<number>(75);

  // Hiệu ứng thanh tiến trình AI ngẫu nhiên
  useEffect(() => {
    const interval = setInterval(() => {
      const randomWidth = Math.floor(Math.random() * (95 - 65 + 1) + 65);
      setProgressWidth(randomWidth);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionResult(null);

    // Mô phỏng gọi API
    setTimeout(() => {
      setSubmissionResult("success");
      setTimeout(() => {
        setSubmitting(false);
        setSubmissionResult(null);
      }, 1500);
    }, 1000);
  };

  const iconStyle = {
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8">
      <main className="w-full max-w-[1100px] min-h-[640px] bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col md:flex-row custom-shadow border border-outline-variant transition-all duration-300">
        {/* Left Side: Decorative Panel (Desktop Only) */}
        <section className="hidden md:flex md:w-1/2 relative bg-primary-fixed overflow-hidden flex-col justify-between p-12">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-primary rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary-fixed rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <img
                alt="EduSynth AI Logo"
                className="w-10 h-10 object-contain"
                src="https://lh3.googleusercontent.com/aida/AP1WRLvagpzKtenUGkwvil3flrlIoVX_D0iCWi-3VslBm3FkRhANSzVIsUi1Cz99-VHB0rcjFN3qbRILR21PAmzAgTe7Uh4SQbnwzWJmJmNtFxaZM27JkknDwT91s80qhaUAbUGFEPZblkjmK0D-GvCscUXP2Eqt_Bz2L7w_Ww_RrgcvcEz5VGXCtnVL_OXcvU3o0kHJntd54PGRJuaxLXdnR2ejPUqBd6zU44o6yObVmaqPNFfCrz9GD_Ac3VPA"
              />
              <span className="font-headline-md text-headline-md font-bold text-primary">
                EduSynth AI
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg text-primary leading-tight mb-6">
              Khai phá <br /> tri thức cùng AI.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">
              Trải nghiệm hệ thống quản lý học tập thế hệ mới, tối ưu hóa lộ
              trình cá nhân bằng trí tuệ nhân tạo.
            </p>
          </div>

          <div className="relative z-10">
            <div className="p-6 glass-panel rounded-xl border border-white/40 custom-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={iconStyle}
                  >
                    auto_awesome
                  </span>
                </div>
                <div className="font-label-md text-label-md text-on-surface">
                  AI Trợ lý học tập
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
              <div className="mt-2 text-right font-body-sm text-body-sm text-on-surface-variant italic">
                Đang phân tích lộ trình học tập...
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <img
              alt="EduSynth AI Logo"
              className="w-12 h-12"
              src="https://lh3.googleusercontent.com/aida/AP1WRLvagpzKtenUGkwvil3flrlIoVX_D0iCWi-3VslBm3FkRhANSzVIsUi1Cz99-VHB0rcjFN3qbRILR21PAmzAgTe7Uh4SQbnwzWJmJmNtFxaZM27JkknDwT91s80qhaUAbUGFEPZblkjmK0D-GvCscUXP2Eqt_Bz2L7w_Ww_RrgcvcEz5VGXCtnVL_OXcvU3o0kHJntd54PGRJuaxLXdnR2ejPUqBd6zU44o6yObVmaqPNFfCrz9GD_Ac3VPA"
            />
            <span className="font-headline-md text-headline-md font-bold text-primary">
              EduSynth AI
            </span>
          </div>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-10">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
                Chào mừng trở lại
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Vui lòng đăng nhập để tiếp tục việc học của bạn.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="font-label-md text-label-md text-on-surface-variant block"
                  htmlFor="email"
                >
                  Địa chỉ Email
                </label>
                <div className="relative group">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                    style={iconStyle}
                  >
                    mail
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-body-md"
                    id="email"
                    placeholder="name@company.com"
                    required
                    type="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  className="font-label-md text-label-md text-on-surface-variant block"
                  htmlFor="password"
                >
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                    style={iconStyle}
                  >
                    lock
                  </span>
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-body-md"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1"
                    onClick={togglePasswordVisibility}
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={iconStyle}
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      className="peer appearance-none w-5 h-5 border border-outline-variant rounded focus:ring-2 focus:ring-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                      type="checkbox"
                    />
                    <span
                      className="material-symbols-outlined absolute text-white text-[16px] hidden peer-checked:block pointer-events-none"
                      style={iconStyle}
                    >
                      check
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <a
                  className="font-label-md text-label-md text-primary hover:underline transition-all"
                  href="#"
                >
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-label-md text-label-md text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2
                                    ${submissionResult === "success" ? "bg-[#34A853] hover:bg-[#34A853]/90" : "bg-primary hover:bg-primary-container"}
                                `}
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="material-symbols-outlined animate-spin text-[20px]"
                      style={iconStyle}
                    >
                      sync
                    </span>
                    Đang kết nối...
                  </>
                ) : submissionResult === "success" ? (
                  "Thành công!"
                ) : (
                  <>
                    Đăng nhập
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={iconStyle}
                    >
                      login
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-body-sm">
                <span className="px-4 bg-surface-container-lowest text-on-surface-variant uppercase tracking-wider">
                  Hoặc đăng nhập bằng
                </span>
              </div>
            </div>

            {/* Social Login */}
            <button
              className="w-full flex items-center justify-center gap-3 py-3 px-6 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-all active:scale-[0.98]"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Google
            </button>

            {/* Footer Link */}
            <div className="mt-10 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Chưa có tài khoản?
                <a
                  className="text-primary font-bold hover:underline ml-1"
                  href="#"
                >
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import type User from "../interface/userInterface";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }, // Dùng trực tiếp isSubmitting xịn của useForm
  } = useForm<User>();

  const passwordValue = watch("password");
  // Hàm xử lý khi dữ liệu form hợp lệ
  const onValid = async (data: User) => {
    try {
      // Tiến hành gửi request lên Backend thông qua tầng API tập trung
      const res = await authApi.register({
        name: data.fullName.split(" ").pop() || "User", // Lấy tên cuối làm name tạm thời
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: "student",
      });

      alert(res.data.message || "Đăng ký tài khoản thành công rực rỡ!");
      navigate("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.log("Lỗi đăng ký:", error);
        const serverMessage =
          error.response?.data?.message ||
          "Đăng ký thất bại, vui lòng thử lại!";
        alert(serverMessage);
      }
    }
  };

  const onError = (err: unknown) => {
    console.log("Lớp Validate FE phát hiện lỗi nhập liệu:", err);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col justify-between antialiased text-gray-800 font-sans">
      <main className="flex-grow flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          {/* Brand Identity / Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">
              EduSynth AI
            </h1>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              Tạo tài khoản mới
            </h2>
            <p className="text-xs text-gray-500 mt-1.5">
              Bắt đầu trải nghiệm môi trường học tập đẳng cấp công nghệ AI
            </p>
          </div>

          {/* Registration Form Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <form
              className="space-y-4"
              onSubmit={handleSubmit(onValid, onError)}
            >
              {/* Name Field */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider"
                  htmlFor="fullName"
                >
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50/50 ${
                    errors.fullName
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                  {...register("fullName", {
                    required: "Bạn chưa nhập Họ và tên",
                  })}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="example@edusynth.ai"
                  className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50/50 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                  {...register("email", {
                    required: "Bạn chưa nhập Email",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message:
                        "Email không đúng định dạng (Ví dụ: vidu@gmail.com)",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider"
                  htmlFor="phone"
                >
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="text" // Chuyển thành text để bắt pattern chuẩn hơn
                  placeholder="0912345678"
                  className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50/50 ${
                    errors.phone
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                  {...register("phone", {
                    required: "Bạn chưa nhập số điện thoại",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Số điện thoại phải chứa chính xác 10 chữ số",
                    },
                  })}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider"
                  htmlFor="password"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50/50 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                  {...register("password", {
                    required: "Bạn chưa nhập mật khẩu",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu phải nhập tối thiểu 6 ký tự",
                    },
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider"
                  htmlFor="confirmPassword"
                >
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50/50 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                  {...register("confirmPassword", {
                    required: "Bạn chưa xác nhận mật khẩu",
                    validate: (value) =>
                      value === passwordValue ||
                      "Mật khẩu xác nhận không trùng khớp",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start pt-1">
                <div className="flex items-center h-4">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                    {...register("name", { required: true })}
                  />
                </div>
                <div className="ml-2">
                  <label
                    className="text-xs text-gray-500 leading-tight block cursor-pointer"
                    htmlFor="terms"
                  >
                    Tôi đồng ý với các{" "}
                    <a
                      className="text-indigo-600 font-semibold hover:underline"
                      href="#terms-link"
                    >
                      Điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a
                      className="text-indigo-600 font-semibold hover:underline"
                      href="#privacy-link"
                    >
                      Chính sách bảo mật
                    </a>
                    .
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting} // Sử dụng trực tiếp cờ tự động của thư viện
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:bg-indigo-400 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
                </button>
              </div>
            </form>

            {/* Social Registration */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200/70 rounded-xl py-2 hover:bg-gray-100 transition-colors active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-700">
                  Google
                </span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200/70 rounded-xl py-2 hover:bg-gray-100 transition-colors active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">
                  Facebook
                </span>
              </button>
            </div>

            {/* Navigation to Login */}
            <div className="mt-5 text-center border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                Đã có tài khoản?
                <Link
                  to="/login"
                  className="text-indigo-600 font-semibold hover:underline ml-1"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Micro-interactions Indicators */}
          <div className="mt-5 grid grid-cols-3 gap-2 opacity-30 px-4">
            <div className="h-0.5 bg-indigo-600 rounded-full" />
            <div className="h-0.5 bg-gray-200 rounded-full" />
            <div className="h-0.5 bg-gray-200 rounded-full" />
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-gray-400 border-t border-gray-100/50">
        © 2026 EDUSYNTH AI. Bảo lưu mọi quyền.
      </footer>
    </div>
  );
};

export default Register;

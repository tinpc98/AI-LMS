import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import type User from "../../interface/userInterface";
import axios from "axios";
import { toast } from "../../utils/toast";

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting }, // Dùng trực tiếp isSubmitting xịn của useForm
  } = useForm<User>();

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

      toast.success(res.data.message || "Đăng ký tài khoản thành công.");
      navigate("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.log("Lỗi đăng ký:", error);
        const serverMessage = error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại!";
        toast.error(serverMessage);
      }
    }
  };

  const onError = (err: unknown) => {
    console.log("Lớp Validate FE phát hiện lỗi nhập liệu:", err);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-start overflow-hidden bg-slate-50 antialiased text-gray-800">
      {/* 1. ẢNH NỀN BAO PHỦ TOÀN BỘ MÀN HÌNH (Đồng bộ LoginPage) */}
      <img
        src="../../../public/images/backgroundAuth.png"
        alt="LMS Background"
        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none z-0"
      />

      {/* Lớp phủ chuyển sắc mượt từ Trắng sáng sang Trong suốt để bảo vệ mắt và tôn nổi Form */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-900/30 z-0 pointer-events-none" />

      {/* Các khối màu gradient trang trí phát sáng dịu chìm phía sau nền */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-indigo-200/40 opacity-50 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-purple-200/30 opacity-50 blur-[120px] rounded-full pointer-events-none z-0" />

      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n .material-symbols-outlined {\n font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;\n }\n ",
        }}
      />

      {/* 2. KHU VỰC CHỨA FORM ĐĂNG KÝ (Căn lề trái mượt mà, đồng bộ LoginPage) */}
      <main className="relative z-10 w-full max-w-[440px] ml-4 sm:ml-12 lg:ml-28 px-4 my-auto py-10">
        {/* Form Card (Hiệu ứng kính mờ trắng bg-white/80 mịn màng) */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-100">
          {/* Header Form */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tạo tài khoản mới</h1>
            <p className="text-xs text-gray-500 mt-1.5">Bắt đầu trải nghiệm môi trường học tập đẳng cấp công nghệ AI</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onValid, onError)}>
            {/* Name Field */}
            <div className="space-y-1">
              <label
                className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider px-0.5"
                htmlFor="fullName"
              >
                Họ và tên
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  {...register("fullName", {
                    required: "Bạn chưa nhập Họ và tên",
                  })}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1.5 px-0.5">{errors.fullName.message}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label
                className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider px-0.5"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="example@edusynth.ai"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  {...register("email", {
                    required: "Bạn chưa nhập Email",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Email không đúng định dạng (Ví dụ: vidu@gmail.com)",
                    },
                  })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5 px-0.5">{errors.email.message}</p>}
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <label
                className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider px-0.5"
                htmlFor="phone"
              >
                Số điện thoại
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="text"
                  placeholder="0912345678"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  {...register("phone", {
                    required: "Bạn chưa nhập số điện thoại",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Số điện thoại phải chứa chính xác 10 chữ số",
                    },
                  })}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1.5 px-0.5">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label
                className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider px-0.5"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  {...register("password", {
                    required: "Bạn chưa nhập mật khẩu",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu phải nhập tối thiểu 6 ký tự",
                    },
                  })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1.5 px-0.5">{errors.password.message}</p>}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label
                className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider px-0.5"
                htmlFor="confirmPassword"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  {...register("confirmPassword", {
                    required: "Bạn chưa xác nhận mật khẩu",
                    validate: (value) => value === getValues("password") || "Mật khẩu xác nhận không trùng khớp",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 px-0.5">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start pt-1">
              <div className="flex items-center h-4">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  {...register("terms", { required: "Bạn phải đồng ý điều khoản" })}
                />
              </div>
              <div className="ml-2">
                <label className="text-xs text-gray-500 leading-tight block cursor-pointer" htmlFor="terms">
                  Tôi đồng ý với các{" "}
                  <a className="text-indigo-600 font-semibold hover:underline" href="#terms-link">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a className="text-indigo-600 font-semibold hover:underline" href="#privacy-link">
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
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-indigo-400 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
              </button>
            </div>
          </form>

          {/* Thanh chia */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-100" />
            <span className="px-3 text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Hoặc tiếp tục với
            </span>
            <div className="flex-grow border-t border-gray-100" />
          </div>

          {/* Google & Facebook Registration */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200/70 rounded-xl py-2 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer"
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
              <span className="text-xs font-semibold text-gray-700">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200/70 rounded-xl py-2 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">Facebook</span>
            </button>
          </div>

          {/* Điều hướng chuyển sang Đăng nhập */}
          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              Đã có tài khoản?
              <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline ml-1">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Các link phụ dưới form */}
        <div className="mt-5 flex justify-center gap-6">
          <a className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors" href="#">
            Điều khoản
          </a>
          <a className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors" href="#">
            Chính sách
          </a>
          <a className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors" href="#">
            Hỗ trợ
          </a>
        </div>
      </main>
      <section className="hidden lg:flex lg:flex-1 relative items-center justify-center p-12">
        {/* Content giới thiệu bay bổng bên trong Background */}
        <div className="relative z-10 max-w-lg text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Đang cập nhật phiên bản v2.0
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Hệ thống LMS thông minh tích hợp AI thế hệ mới
          </h2>
          <p className="text-base text-slate-300 mt-4 leading-relaxed font-light">
            Hỗ trợ bài giảng sinh động, quản lý lớp học toàn diện và công cụ học tập tương tác cá nhân hóa.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Register;

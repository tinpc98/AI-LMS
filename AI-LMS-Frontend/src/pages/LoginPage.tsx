import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import type User from "../interface/userInterface.tsx";

const Login = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<User>();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/");
    }
  }, []);

  const onValid = async (data: User) => {
    try {
      const res = await fetch(`http://localhost:3000/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.mesage || "Đăng nhập thất bại");
      }

      localStorage.setItem("accessToken", result.accessToken);
      alert("Đăng nhập thành công");
      navigate("/");
    } catch (error) {
      console.log(error);
      alert("Có lỗi xảy ra");
    }
  };
  const onError = (err: unknown) => {
    console.log(err);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col justify-between antialiased text-gray-800 relative overflow-hidden">
      {/* Các khối màu gradient trang trí chìm phía sau nền */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-indigo-200/40 opacity-50 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-purple-200/30 opacity-50 blur-[120px] rounded-full pointer-events-none" />

      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n .material-symbols-outlined {\n font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;\n }\n ",
        }}
      />

      {/* Main Content Form */}
      <main className="flex-grow flex items-center justify-center px-4 py-10 z-10">
        <div className="w-full max-w-[400px]">
          {/* Form Card (Sử dụng hiệu ứng kính mờ của Tailwind) */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100">
            {/* Header Form */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Chào mừng trở lại</h1>
              <p className="text-xs text-gray-500 mt-1">Vui lòng đăng nhập vào tài khoản của bạn</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onValid, onError)}>
              {/* Email Field */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider px-0.5"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  {/* <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span> */}
                  <input
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Bạn chưa nhập Email",
                      minLength: {
                        value: 6,
                        message: "Nhập tối thiểu 6 ký tự",
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Email không đúng định dạng (Ví dụ: ví_dụ@gmail.com)",
                      },
                    })}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
              </div>
              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="password">
                    Mật khẩu
                  </label>
                  <a className="text-[11px] font-medium text-indigo-600 hover:underline" href="#">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  {/* <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span> */}
                  <input
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    id="password"
                    type="password"
                  {...register("password", {
                      required: "Bạn chưa nhập mật khẩu",
                      minLength: {
                        value: 6,
                        message: "Nhập tối thiểu 6 ký tự",
                      },
                    })}
                  />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 rounded-xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  type="submit"
                >
                  Đăng nhập
                  <span className="material-symbols-outlined text-base"></span>
                </button>
              </div>
            </form>

            {/* Thanh chia đường kẻ Hoặc */}
            <div className="flex items-center my-5">
              <div className="flex-grow border-t border-gray-100" />
              <span className="px-3 text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                Hoặc tiếp tục với
              </span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            {/* Nút đăng nhập bên thứ 3 (Google & Facebook làm nhỏ gọn lại) */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200/70 rounded-xl py-2 hover:bg-gray-100 transition-colors active:scale-[0.98] cursor-pointer">
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
                <span className="text-xs font-medium text-gray-700">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200/70 rounded-xl py-2 hover:bg-gray-100 transition-colors active:scale-[0.98] cursor-pointer">
                <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">Facebook</span>
              </button>
            </div>

            {/* Điều hướng chuyển sang Đăng ký */}
            <div className="mt-5 text-center border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                Bạn chưa có tài khoản?
                <Link to="/register">
                  <a className="text-indigo-600 font-semibold hover:underline ml-1" href="#">
                    Đăng ký ngay
                  </a>
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
        </div>
      </main>

      {/* Footer bản auth mỏng gọn */}
      <footer className="w-full py-4 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-gray-400">© 2024 LUXE RETAIL. Bảo lưu mọi quyền.</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-gray-400 text-base cursor-pointer hover:text-indigo-600 transition-colors">
              language
            </span>
            <span className="material-symbols-outlined text-gray-400 text-base cursor-pointer hover:text-indigo-600 transition-colors">
              dark_mode
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;

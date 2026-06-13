import React from "react";

const SidebarTeacher = () => {
  return (
    <>
      <aside className="hidden md:flex flex-col h-full py-unit w-[280px] z-50 overflow-y-auto fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant">
        <div className="px-6 py-8 flex items-center gap-3">
          <img
            alt="EduPortal AI Logo"
            className="w-10 h-10 rounded-lg object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkHipXsG3Jdqn_T1kn-iQLl2Rgp0xI8NBtwkLr3AVXSNtxKGcQtd_vjkQf3Nqy4bvn2cdUDnYhl8CrLatmVuOJEc5Thz15ltoUa3CDz-PJd-0j8e0eg2tskVHGYfd6MxAJBXUBxYSLxZY2TMqb-zZRzRpW7jDDO6GFnwr5QE5Ic2nWHSb7TS-VEM406cwmWV4b0vXD2nI0KEFO8c4sBMI-D2I-NJIt6KIo6522qWXOGZGyfHdA9l2oEGClirojk5JPXdilCbLLyPXS"
          />
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">
              EduPortal AI
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Teacher Dashboard
            </p>
          </div>
        </div>
        <div className="mt-4 px-4 space-y-1 flex-grow">
          {/* <!-- Active State Navigation Logic --> */}
          <a
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-transform duration-100 scale-98"
            href="#"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">groups</span>
            <span className="font-label-md text-label-md">Quản lý lớp học</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-label-md text-label-md">
              Quản lý bài giảng
            </span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">quiz</span>
            <span className="font-label-md text-label-md">
              Ngân hàng câu hỏi
            </span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">assignment</span>
            <span className="font-label-md text-label-md">Quản lý thi</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">chat</span>
            <span className="font-label-md text-label-md">Nhắn tin</span>
          </a>
        </div>
        <div className="px-6 mt-auto py-6">
          <button className="w-full py-3 px-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors duration-150 shadow-md">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-label-md text-label-md">
              Tạo bài giảng mới
            </span>
          </button>
        </div>
        <div className="px-4 py-6 border-t border-outline-variant space-y-1">
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Cài đặt</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Đăng xuất</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default SidebarTeacher;

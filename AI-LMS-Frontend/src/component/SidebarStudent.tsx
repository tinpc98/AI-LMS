import React from "react";

const SidebarStudent = () => {
  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col h-full py-6 px-4 z-50 transition-transform md:translate-x-0 -translate-x-full"
        id="sidebar"
      >
        <div className="flex items-center gap-3 mb-10 px-2">
          <img
            alt="Logo"
            className="w-10 h-10 object-contain"
            src="https://lh3.googleusercontent.com/aida/AP1WRLvagpzKtenUGkwvil3flrlIoVX_D0iCWi-3VslBm3FkRhANSzVIsUi1Cz99-VHB0rcjFN3qbRILR21PAmzAgTe7Uh4SQbnwzWJmJmNtFxaZM27JkknDwT91s80qhaUAbUGFEPZblkjmK0D-GvCscUXP2Eqt_Bz2L7w_Ww_RrgcvcEz5VGXCtnVL_OXcvU3o0kHJntd54PGRJuaxLXdnR2ejPUqBd6zU44o6yObVmaqPNFfCrz9GD_Ac3VPA"
          />
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">
              LMS Scholar
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-none">
              AI-Powered Learning
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {/* <!-- Active State: Dashboard --> */}
          <a
            className="flex items-center gap-3 px-4 py-3 text-primary bg-secondary-container rounded-xl font-bold transition-all duration-150 ease-in-out active:scale-95"
            href="#"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: '"FILL" 1',
              }}
            >
              dashboard
            </span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl transition-all duration-150 ease-in-out active:scale-95"
            href="#"
          >
            <span className="material-symbols-outlined">school</span>
            <span className="font-body-md text-body-md">Lớp học của tôi</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl transition-all duration-150 ease-in-out active:scale-95"
            href="#"
          >
            <span className="material-symbols-outlined">edit_note</span>
            <span className="font-body-md text-body-md">Làm bài tập</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl transition-all duration-150 ease-in-out active:scale-95"
            href="#"
          >
            <span className="material-symbols-outlined">quiz</span>
            <span className="font-body-md text-body-md">Thi trực tuyến</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl transition-all duration-150 ease-in-out active:scale-95"
            href="#"
          >
            <span className="material-symbols-outlined">forum</span>
            <span className="font-body-md text-body-md">Nhắn tin</span>
          </a>
        </nav>
        <div className="mt-auto pt-6 border-t border-outline-variant space-y-4">
          <div className="bg-primary-container p-4 rounded-xl text-white">
            <p className="font-label-md text-label-md font-bold mb-2">
              Upgrade to Pro
            </p>
            <p className="text-xs opacity-90 mb-3">
              Mở khóa tính năng AI nâng cao và gia sư 1:1.
            </p>
            <button className="w-full py-2 bg-white text-primary font-bold rounded-lg text-sm hover:bg-opacity-90 transition-all">
              Nâng cấp ngay
            </button>
          </div>
          <div className="space-y-1">
            <a
              className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-lg"
              href="#"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="font-body-sm text-body-sm">Cài đặt</span>
            </a>
            <a
              className="flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 transition-colors rounded-lg"
              href="#"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-body-sm text-body-sm">Đăng xuất</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarStudent;

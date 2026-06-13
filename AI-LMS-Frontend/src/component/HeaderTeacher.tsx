import React from "react";

const HeaderTeacher = () => {
  return (
    <>
      <header className="md:ml-[280px] h-16 flex justify-between items-center px-margin-desktop bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant">
        <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full w-96 border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 w-full text-body-sm font-body-sm"
            placeholder="Tìm kiếm lớp học, học sinh..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="text-right">
              <p className="font-label-md text-label-md text-on-surface font-bold">
                Nguyễn Văn A
              </p>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Giảng viên Cao cấp
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden group-hover:border-primary transition-all">
              <img
                className="w-full h-full object-cover"
                data-alt="Close-up professional portrait of a male teacher in his 40s wearing glasses and a crisp white shirt. The background is a blurred academic library setting with soft warm lighting. The aesthetic is clean and high-end, matching a professional corporate LMS platform with a primary blue and white color scheme."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAalV8JFNshL3DITQPPExnv-djNnbYj5TzkTZ00D79AZgU16rQRTsSBsl4Ey7Ra94FACXIY0mY_l8wpa9UeBQKqI6voBzeEX7tce0ZQ-caZnfR8Tmpcf3pe7vrmm_q9vVEJPU1VDWgv3rCfIeYTxKvY95mXb2k2oXbrG8WDrRcoRw4LebxDyJBThQi11PM-yQBV0dRrEacAU5-p7bRRlIydTdsU3B9x5MwqOX8_othKU17FZ-05BRsFCXPgU07Iaw0LbV0rhRRchTCm"
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderTeacher;

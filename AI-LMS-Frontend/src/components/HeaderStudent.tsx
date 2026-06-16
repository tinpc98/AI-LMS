import React from "react";

const HeaderStudent = () => {
  return (
    <>
      {" "}
      <header className="fixed top-0 right-0 left-0 md:left-[280px] h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant z-40 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 flex-1">
          <button
            className="md:hidden p-2 text-on-surface-variant"
            onclick="
              document
                .getElementById('sidebar')
                .classNameList.toggle('-translate-x-full')
            "
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative w-full max-w-md hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary text-sm"
              placeholder="Tìm kiếm khóa học, tài liệu..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button className="hover:bg-surface-container-highest/20 rounded-full p-2 relative">
              <span className="material-symbols-outlined text-on-surface-variant">
                notifications
              </span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
            </button>
            <button className="hover:bg-surface-container-highest/20 rounded-full p-2">
              <span className="material-symbols-outlined text-on-surface-variant">
                help
              </span>
            </button>
          </div>
          <div className="h-8 w-px bg-outline-variant mx-1"></div>
          <button className="hidden lg:block bg-primary text-white font-label-md px-4 py-2 rounded-full hover:bg-opacity-90 transition-all">
            Bắt đầu học
          </button>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="font-label-md text-label-md font-bold text-on-surface">
                Minh Anh
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Sinh viên
              </p>
            </div>
            <img
              alt="User Profile Avatar"
              className="w-9 h-9 rounded-full border border-outline-variant"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPh-g4wyPEIVNjZGou0Q-TDYpjOgeDmEoj5a236jl-ltNU3tcg_xi-vs4uE8jNJ7Dji8JmfDXQCaqva-c5sG0wtjPloxE0ix6_Sr3esa1jkY7Gxj3N8LWQ-wSusqy0wtKJYCfiEBVUyFAjnJzuSOxySJAgoMIQHmaD__yvE9RR4DkTNhtMUedtJsqmLhOs8b26pDnq40H49FJHrvV2w3H45Bk-JPwPf3YomCsUgKn9ZwiqwbW2-aWhnJxdh7UWH91hRGNr7BDkVxe5"
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderStudent;

import React from "react";

export function AITutorSidebar() {
  return (
    <aside className="w-[320px] bg-white border-l border-outline-variant flex flex-col">
      <div className="p-6 border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h5 className="font-bold text-on-surface">AI Scholar Tutor</h5>
        </div>
        <button className="text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined">
            settings
          </span>
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl mb-4 text-outline">
          construction
        </span>
        <h4 className="text-body-lg font-semibold mb-2">Tính năng sắp ra mắt</h4>
        <p className="text-body-sm leading-relaxed">
          AI Scholar Tutor đang được phát triển và sẽ chính thức hỗ trợ bạn giải đáp bài tập ở <strong>Sprint 4</strong>.
        </p>
      </div>
      <div className="p-4 border-t border-outline-variant opacity-50 pointer-events-none">
        <div className="relative flex items-center">
          <input
            className="w-full pr-12 pl-4 py-3 bg-surface-container-low border-none rounded-xl text-body-md"
            placeholder="Hỏi AI về bài tập..."
            type="text"
            disabled
          />
          <button className="absolute right-3 text-primary" disabled>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

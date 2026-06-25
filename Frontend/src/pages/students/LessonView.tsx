import React, { useState, useEffect } from "react";

const LessonPage: React.FC = () => {
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsToastVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen">
      {/* Main Content - No Header/Sidebar */}
      <main className="w-full h-screen overflow-hidden flex flex-col md:flex-row">
        {/* Left Section: Video Player */}
        <section className="w-full md:w-[70%] h-full overflow-y-auto custom-scrollbar bg-surface-container-lowest border-r border-outline-variant p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-on-background shadow-lg group">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  className="w-full h-full object-cover opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2Vv_wQM1TOy__jI8VCnUcozPiRh-CYJLutgXlIGJfSieOCfurY4Kt3XXnRKIaSIcCwWJs5aJF38FoqWloMY0aBPedQvKK4meQ3V6tM_nK5O8zRIUwSI4XVZK2XfDMkBJmlVmg2Czm6LfoF9O8kchtpdqce39BfF0tLOw-NXbNWOoKQRQ8jdiauoercJKhu7IMwJaVISQGKmsY_MkJvJ8aD0v5-IcJBM7fIoDEpQ6ESX3gt7AZ0BqzdlePC6F9awWM2qxHxgiRapf0"
                  alt="Video thumbnail"
                />
                <button className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur hover:scale-110 transition-transform">
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </button>
              </div>
            </div>

            {/* Lesson Info */}
            <div className="space-y-4">
              <span className="bg-primary-fixed-dim text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Module 4 • Lesson 4
              </span>
              <h2 className="font-headline-lg text-headline-lg mt-2">
                Introduction to Retrieval-Augmented Generation (RAG)
              </h2>
              <p className="text-on-surface-variant font-body-md mt-2">
                Giới thiệu về cách kết hợp các mô hình ngôn ngữ lớn với cơ sở dữ
                liệu tri thức riêng tư.
              </p>
            </div>
          </div>
        </section>

        {/* Right Section: AI Chatbot Panel */}
        <aside className="w-full md:w-[30%] h-full flex flex-col bg-surface border-l border-outline-variant">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
            <h3 className="font-label-md text-label-md font-bold">
              AI Study Assistant
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface/50">
            {/* Chat Messages Placeholder */}
            <div className="bg-surface-container text-on-surface p-4 rounded-2xl rounded-tl-none border border-outline-variant text-sm">
              Chào bạn! Tôi là trợ lý AI của khóa học.
            </div>
          </div>

          <div className="p-6 border-t border-outline-variant bg-surface">
            <textarea
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="Hỏi AI về bài học này..."
              rows={1}
            />
          </div>
        </aside>
      </main>

      {/* Floating AI Toast */}
      {isToastVisible && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-500">
          <div className="bg-white/90 backdrop-blur-lg border border-primary/20 p-4 rounded-xl shadow-2xl flex items-center gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase">
                AI Insight
              </p>
              <p className="text-sm text-on-surface">
                Bạn đã xem hết 25% bài học.
              </p>
            </div>
            <button onClick={() => setIsToastVisible(false)}>
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPage;

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Spin } from "antd";
import aiApi from "../../../api/aiApi";
import { useAIChat } from "../../ai/hooks/useAIChat";
import { toast } from "../../../utils/toast";

const LessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [inputText, setInputText] = useState("");

  const {
    session,
    messages,
    isLoading: isChatLoading,
    isTyping,
    error: chatError,
    initSession,
    sendMessage,
  } = useAIChat(lessonId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lessonId) {
      initSession();
    }
  }, [lessonId, initSession]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsToastVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateSummary = async () => {
    if (!lessonId) return;
    setIsLoadingSummary(true);
    try {
      const data = await aiApi.generateLessonSummary(lessonId);
      setSummary(data.content || data.summary || "Đã tạo tóm tắt nhưng không có nội dung.");
      toast.success("Đã tạo tóm tắt bài học bằng AI!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tạo tóm tắt bài học");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleFetchSummary = async () => {
    if (!lessonId) return;
    setIsLoadingSummary(true);
    try {
      const data = await aiApi.getLessonSummary(lessonId);
      setSummary(data.content || data.summary || null);
    } catch (err: any) {
      // 404 is fine, means no summary exists yet
      if (err.response?.status !== 404) {
        console.error("Lỗi khi tải tóm tắt:", err);
      }
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    handleFetchSummary();
  }, [lessonId]);

  const handleSendChat = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen">
      <main className="w-full h-screen flex flex-col md:flex-row">
        {/* Left Section: Video Player & Summary */}
        <section className="w-full md:w-[70%] h-full overflow-y-auto custom-scrollbar bg-surface-container-lowest border-r border-outline-variant p-8 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-on-background shadow-lg group">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  className="w-full h-full object-cover opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2Vv_wQM1TOy__jI8VCnUcozPiRh-CYJLutgXlIGJfSieOCfurY4Kt3XXnRKIaSIcCwWJs5aJF38FoqWloMY0aBPedQvKK4meQ3V6tM_nK5O8zRIUwSI4XVZK2XfDMkBJmlVmg2Czm6LfoF9O8kchtpdqce39BfF0tLOw-NXbNWOoKQRQ8jdiauoercJKhu7IMwJaVISQGKmsY_MkJvJ8aD0v5-IcJBM7fIoDEpQ6ESX3gt7AZ0BqzdlePC6F9awWM2qxHxgiRapf0"
                  alt="Video thumbnail"
                />
                <button className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur hover:scale-110 transition-transform shadow-lg">
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <span className="bg-primary-fixed-dim text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Module 4 • Lesson 4
              </span>
              <div className="flex justify-between items-start">
                <h2 className="font-headline-lg text-headline-lg mt-2 font-bold">
                  Introduction to Retrieval-Augmented Generation (RAG)
                </h2>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isLoadingSummary}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoadingSummary ? (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  )}
                  Tóm tắt AI
                </button>
              </div>
              <p className="text-on-surface-variant font-body-md mt-2">
                Giới thiệu về cách kết hợp các mô hình ngôn ngữ lớn với cơ sở dữ liệu tri thức riêng
                tư.
              </p>
            </div>

            {/* Hiển thị AI Summary nếu có */}
            {(summary || isLoadingSummary) && (
              <div className="mt-8 bg-indigo-50/30 border border-indigo-100 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-8xl">auto_awesome</span>
                </div>
                <h3 className="font-bold text-indigo-800 text-lg flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined">psychology</span>
                  AI Scholar Tóm Tắt
                </h3>
                {isLoadingSummary && !summary ? (
                  <div className="flex items-center gap-3 text-indigo-600">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span className="text-sm">Đang phân tích bài học...</span>
                  </div>
                ) : (
                  <div className="prose prose-indigo max-w-none text-sm text-gray-700 whitespace-pre-wrap">
                    {summary}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Section: AI Chatbot Panel */}
        <aside className="w-full md:w-[30%] h-full flex flex-col bg-surface border-l border-outline-variant">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h3 className="font-label-md text-label-md font-bold">AI Scholar Tutor</h3>
            </div>
            <button
              onClick={initSession}
              title="Làm mới cuộc trò chuyện"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar bg-slate-50">
            {isChatLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spin tip="Đang kết nối AI..." />
              </div>
            ) : chatError ? (
              <div className="text-center text-error mt-4">
                <p className="text-sm">{chatError}</p>
                <button onClick={initSession} className="mt-2 text-primary text-xs underline">
                  Thử lại
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                <p className="text-sm">
                  Hãy đặt câu hỏi về nội dung bài học để AI Scholar giải đáp.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-white border border-outline-variant text-on-surface rounded-tl-sm shadow-sm whitespace-pre-wrap"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                    {msg.role === "user" ? "Bạn" : "AI Scholar"}
                  </span>
                </div>
              ))
            )}

            {isTyping && (
              <div className="self-start flex flex-col max-w-[85%]">
                <div className="px-4 py-3 bg-white border border-outline-variant rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                  AI Scholar đang trả lời...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-outline-variant bg-white">
            <div className="relative flex items-center">
              <input
                className="w-full pr-12 pl-4 py-3 bg-surface-container-low border border-transparent rounded-xl text-body-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Hỏi AI về bài học này..."
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={isChatLoading || isTyping}
              />
              <button
                className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleSendChat}
                disabled={!inputText.trim() || isChatLoading || isTyping}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  send
                </span>
              </button>
            </div>
            <p className="text-[10px] text-center mt-2 text-on-surface-variant">
              AI có thể trả lời không chính xác, hãy kiểm chứng.
            </p>
          </div>
        </aside>
      </main>

      {/* Floating AI Toast */}
      {isToastVisible && (
        <div className="fixed bottom-6 left-6 md:left-[70%] md:-ml-[320px] z-50 transition-all duration-500">
          <div className="bg-white/90 backdrop-blur-lg border border-primary/20 p-4 rounded-xl shadow-2xl flex items-center gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase">AI Insight</p>
              <p className="text-sm text-on-surface">
                Bài học này có tỷ lệ hoàn thành cao. Hãy theo dõi kỹ phần Demo nhé!
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

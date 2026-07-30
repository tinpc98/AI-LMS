import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAIChat } from "../../hooks/useAIChat";
import ReactMarkdown from "react-markdown";

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Extract lessonId from URL if we are in a lesson view
  const match = location.pathname.match(/\/lessonview\/([a-f0-9]{24})/i);
  const lessonIdFromUrl = match ? match[1] : undefined;
  
  // Disable in exam attempts to prevent cheating
  const isExamAttempt = location.pathname.includes("/student/exam-attempt/") || location.pathname.includes("/student/exam/");
  
  const { session, messages, isLoading, isTyping, error, initStatus, initSession, sendMessage } = useAIChat(lessonIdFromUrl);

  useEffect(() => {
    if (isOpen && initStatus === "idle") {
      initSession();
    }
  }, [isOpen, initStatus, initSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt: string; context?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        setInputText(customEvent.detail.prompt);
      }
    };
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, []);

  if (isExamAttempt) return null;

  const handleSend = () => {
    if (inputText.trim() && !isTyping && initStatus === "ready") {
      sendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-[380px] h-[600px] max-h-[80vh] shadow-2xl rounded-2xl mb-4 border border-outline-variant flex flex-col overflow-hidden transition-all">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="font-bold text-lg">AI Study Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50 custom-scrollbar">
            {initStatus === "error" ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <span className="material-symbols-outlined text-5xl mb-3 text-red-400">error</span>
                <p className="text-sm font-medium text-center px-4 mb-4 text-red-500">{error || "Không thể khởi tạo trợ lý AI."}</p>
                <button 
                  onClick={initSession}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                >
                  Thử lại
                </button>
              </div>
            ) : initStatus === "initializing" ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-60 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>robot_2</span>
                <p className="text-sm font-medium text-center px-4 animate-pulse">Đang khởi tạo trợ lý AI...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-60" style={{ fontVariationSettings: "'FILL' 1" }}>robot_2</span>
                <p className="text-sm font-medium text-center px-4">AI Assistant đã sẵn sàng hỗ trợ bạn.</p>
                
                <div className="mt-6 flex flex-col gap-2 w-full">
                  <button onClick={() => setInputText("Giải thích tiến độ học tập của tôi")} className="text-xs bg-white border border-gray-200 p-2 rounded-lg hover:border-primary hover:text-primary transition-colors text-left text-gray-600">
                    💡 Giải thích tiến độ học tập của tôi
                  </button>
                  <button onClick={() => setInputText("Tôi nên học gì hôm nay?")} className="text-xs bg-white border border-gray-200 p-2 rounded-lg hover:border-primary hover:text-primary transition-colors text-left text-gray-600">
                    💡 Tôi nên học gì hôm nay?
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-[14px] shadow-sm ${msg.role === "user" ? "bg-primary text-white rounded-br-sm" : "bg-white border border-outline-variant text-gray-800 rounded-bl-sm"}`}>
                    <div className="prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white prose-pre:p-2 prose-pre:rounded-md max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.role === "user" ? "Bạn" : "AI Assistant"}</span>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="self-start flex flex-col max-w-[85%]">
                <div className="px-4 py-3 bg-white border border-outline-variant rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">AI đang xử lý...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-outline-variant">
            <div className="relative flex items-center">
              <input
                className="w-full pr-12 pl-4 py-3 bg-gray-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Nhập câu hỏi của bạn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={initStatus !== "ready" || isTyping}
              />
              <button
                className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || isTyping}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400">Trợ lý AI có thể trả lời sai, vui lòng kiểm chứng.</span>
            </div>
          </div>
        </div>
      )}

      {/* Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:shadow-primary/40 transition-transform focus:outline-none focus:ring-4 focus:ring-primary/30 group"
          aria-label="Mở Trợ lý học tập AI"
          title="Trợ lý học tập AI"
        >
          <span className="material-symbols-outlined text-3xl group-hover:animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
        </button>
      )}
    </div>
  );
};

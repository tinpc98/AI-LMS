import React, { useEffect, useState, useRef } from "react";
import { Spin } from "antd";
import { useAIChat } from "../../../hooks/useAIChat";

interface AITutorSidebarProps {
  lessonId?: string; // Tùy chọn, nếu chat gắn liền với bài học cụ thể
}

export function AITutorSidebar({ lessonId }: AITutorSidebarProps) {
  const {
    session,
    messages,
    isLoading,
    isTyping,
    error,
    initSession,
    sendMessage,
  } = useAIChat(lessonId);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputText.trim()) {
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
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spin tip="Đang kết nối AI..." />
          </div>
        ) : error ? (
          <div className="text-center text-error mt-4">
            <p className="text-sm">{error}</p>
            <button
              onClick={initSession}
              className="mt-2 text-primary text-xs underline"
            >
              Thử lại
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-4xl mb-2">forum</span>
            <p className="text-sm">Hãy đặt câu hỏi cho AI Scholar để được hỗ trợ giải đáp thắc mắc.</p>
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
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
            <span className="text-[10px] text-on-surface-variant mt-1 px-1">AI Scholar đang trả lời...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-outline-variant bg-white">
        <div className="relative flex items-center">
          <input
            className="w-full pr-12 pl-4 py-3 bg-surface-container-low border border-transparent rounded-xl text-body-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            placeholder="Hỏi AI về bài tập..."
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isTyping}
          />
          <button
            className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading || isTyping}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              send
            </span>
          </button>
        </div>
        <p className="text-[10px] text-center mt-2 text-on-surface-variant">
          AI có thể trả lời không chính xác, hãy luôn kiểm tra lại.
        </p>
      </div>
    </aside>
  );
}

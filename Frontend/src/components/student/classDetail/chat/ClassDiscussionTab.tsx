import React, { useState } from "react";

export interface IChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isTeacher?: boolean;
  isAi?: boolean;
  isUser?: boolean;
}

export const ClassDiscussionTab: React.FC = React.memo(() => {
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([
    {
      id: "1",
      sender: "Thanh Thảo",
      avatar: "TT",
      text: "Mọi người ơi, tài liệu chương mới thầy cập nhật nằm ở mục nào vậy ạ?",
      time: "09:12 AM",
    },
    {
      id: "2",
      sender: "AI Assistant",
      avatar: "AI",
      text: "AI khuyên dùng: Bạn có thể xem các slide PDF tải về trực tiếp tại Tab Bài giảng.",
      time: "09:15 AM",
      isAi: true,
    },
  ]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg: IChatMessage = {
      id: Date.now().toString(),
      sender: "Bạn (Minh Quân)",
      avatar: "MQ",
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isUser: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatMessage("");
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-col space-y-4 min-h-[350px] max-h-[500px] overflow-y-auto">
        {chatMessages.map((msg) => {
          if (msg.isAi) {
            return (
              <div key={msg.id} className="flex items-center justify-center my-2">
                <div className="bg-surface-container-highest border border-primary/20 px-4 py-1.5 rounded-full text-xs flex items-center space-x-2 text-primary">
                  <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                  <span>{msg.text}</span>
                </div>
              </div>
            );
          }

          const isUser = msg.isUser;

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.isTeacher
                    ? "bg-primary text-on-primary"
                    : isUser
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {msg.avatar}
              </div>
              <div>
                <div className={`flex items-center space-x-2 mb-1 ${isUser ? "justify-end" : ""}`}>
                  <span
                    className={`text-xs font-bold ${
                      msg.isTeacher ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-secondary">{msg.time}</span>
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm ${
                    isUser
                      ? "bg-primary text-on-primary rounded-tr-none shadow-sm"
                      : msg.isTeacher
                      ? "bg-primary-container/10 border border-primary/10 rounded-tl-none"
                      : "bg-white rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input box */}
      <div className="flex items-center space-x-2">
        <input
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
          placeholder="Nhập nội dung thảo luận cùng lớp học..."
          type="text"
        />
        <button
          onClick={handleSendMessage}
          className="p-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-xl">send</span>
        </button>
      </div>
    </div>
  );
});

ClassDiscussionTab.displayName = "ClassDiscussionTab";

export default ClassDiscussionTab;

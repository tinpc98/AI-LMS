import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Input, Badge, Avatar, Typography, Skeleton } from "antd";
import { SearchOutlined, MessageOutlined } from "@ant-design/icons";
import { useMessagesStore } from "../store/useMessagesStore";
import { ClassDiscussionTab } from "../../class/components/classDetail/chat/ClassDiscussionTab";
import { useAuth } from "../../../shared/hooks/useAuth";

const { Text, Title } = Typography;

export const MessagesPage: React.FC = () => {
  const { classId } = useParams<{ classId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isTeacher: authIsTeacher, isAdmin } = useAuth();
  
  const isTeacher = authIsTeacher || isAdmin;
  const basePath = isTeacher ? "/teacher/messages" : "/student/messages";

  const { classes, loading, initialized, fetchSummary, initializeSocketListeners, cleanupSocketListeners } = useMessagesStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!initialized) {
      fetchSummary();
    }
    initializeSocketListeners();
    return () => {
      // Typically we don't clean up socket listeners here because we want global badge updates,
      // but if we want the badge to continue updating when navigating away, we should keep it alive.
      // So we don't call cleanupSocketListeners here. It's better initialized in a layout wrapper.
    };
  }, [initialized, fetchSummary, initializeSocketListeners]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => c.className.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [classes, searchTerm]);

  // Color hash for avatar
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const getAvatarText = (className: string) => {
    const match = className.match(/(?:Lớp\s+)?([a-zA-Z]+)/i);
    return match ? match[1].substring(0, 2).toUpperCase() : className.charAt(0).toUpperCase();
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    }
    return d.toLocaleDateString();
  };

  return (
    <div className="flex w-full h-[calc(100vh-80px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Left Column: Class List */}
      <div className="w-[320px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <Title level={5} className="!mb-4 !mt-0 flex items-center gap-2">
            <MessageOutlined className="text-primary" /> Tin nhắn
          </Title>
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Tìm kiếm lớp học..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="rounded-lg"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loading && !initialized ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton.Avatar active size="large" />
                  <div className="flex-1">
                    <Skeleton.Button active size="small" block className="!w-24 !h-4 mb-2" />
                    <Skeleton.Button active size="small" block className="!w-full !h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
              <MessageOutlined className="text-4xl mb-2 opacity-50" />
              <p>Bạn chưa tham gia lớp học nào.</p>
            </div>
          ) : filteredClasses.length === 0 ? (
             <div className="text-center text-gray-400 p-4 mt-4">
              Không tìm thấy lớp học.
            </div>
          ) : (
            filteredClasses.map(c => {
              const isSelected = c.classId === classId;
              const hasUnread = c.unreadCount > 0;
              
              return (
                <div 
                  key={c.classId}
                  onClick={() => navigate(`${basePath}/${c.classId}`)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1
                    ${isSelected ? "bg-primary-50 border border-primary-100" : "hover:bg-gray-100 border border-transparent"}
                  `}
                >
                  <Badge count={c.unreadCount} size="small" offset={[-2, 2]}>
                    <Avatar 
                      style={{ backgroundColor: stringToColor(c.className) }}
                      className={hasUnread ? "ring-2 ring-primary ring-offset-1" : ""}
                    >
                      {getAvatarText(c.className)}
                    </Avatar>
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <Text 
                        strong={hasUnread || isSelected} 
                        className={`truncate text-sm ${hasUnread ? "text-gray-900" : "text-gray-700"}`}
                        title={c.className}
                      >
                        {c.className}
                      </Text>
                      {c.lastMessage && (
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${hasUnread ? "text-primary font-bold" : "text-gray-400"}`}>
                          {formatTime(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    {c.lastMessage ? (
                      <p className={`text-xs truncate ${hasUnread ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                        <span className="opacity-80">
                          {c.lastMessage.senderId === user?._id || c.lastMessage.senderId === user?.id 
                            ? "Bạn: " 
                            : `${c.lastMessage.senderName}: `}
                        </span>
                        {c.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Chưa có tin nhắn</p>
                    )}
                  </div>
                  
                  {hasUnread && !isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 ml-1" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {classId ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                 <Avatar 
                    style={{ backgroundColor: stringToColor(classes.find(c => c.classId === classId)?.className || "") }}
                  >
                    {getAvatarText(classes.find(c => c.classId === classId)?.className || "C")}
                  </Avatar>
                 <div>
                   <Title level={5} className="!m-0 text-gray-800">
                     {classes.find(c => c.classId === classId)?.className || "Lớp học"}
                   </Title>
                   {/* We could add member count if we have it, currently we don't in the summary */}
                 </div>
              </div>
            </div>
            <div className="flex-1 p-0 overflow-hidden bg-gray-50/50">
              {/* Reuse core chat component */}
              <ClassDiscussionTab key={classId} classId={classId} isTeacher={isTeacher} fullHeight />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageOutlined className="text-6xl mb-4 text-gray-300" />
            <Title level={4} className="!text-gray-400">Bắt đầu trò chuyện</Title>
            <p className="max-w-xs text-center">Chọn một lớp học ở danh sách bên trái để bắt đầu hoặc tiếp tục cuộc trò chuyện.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;

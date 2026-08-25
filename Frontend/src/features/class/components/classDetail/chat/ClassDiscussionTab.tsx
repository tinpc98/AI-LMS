import React, { useState, useEffect, useRef, useMemo } from "react";
import envConfig from "../../../../../config/env";
import { Avatar, Tooltip, Input, Button, Upload, Popover, Spin, Progress } from "antd";
import {
  SendOutlined,
  PictureOutlined,
  PaperClipOutlined,
  SmileOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { useChatMessages } from "./useChatMessages";
import { useChatSocket } from "./useChatSocket";
import type { ChatMessage, ChatAttachment, ChatReaction } from "../../../types/chat.types";
import { toast } from "../../../../../utils/toast";
import api from "../../../../../api/axiosClient";
import { AttachmentViewerModal, isViewableFile, getFileExtension } from "../../../../../shared/components/AttachmentViewerModal";
import { useMessagesStore } from "../../../../chat/store/useMessagesStore";

interface ClassDiscussionTabProps {
  classId: string;
  isTeacher?: boolean;
  fullHeight?: boolean;
}

const EMOJI_WHITELIST = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const MAX_FILE_SIZE_MB = 25;
const MAX_IMG_SIZE_MB = 10;

// Thành phần ảnh đính kèm có fetch signedUrl
const AttachmentImage = ({ file, classId }: { file: ChatAttachment; classId: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fetchSignedUrl = async () => {
    try {
      setLoading(true);
      setError(false);
      const encodedId = encodeURIComponent(file.publicId);
      const res = await api.get(`/classes/${classId}/messages/attachments/${encodedId}/signed-url?resourceType=image`);
      if (res.data.success) {
        setUrl(res.data.data.signedUrl);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to load signed URL", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedUrl();
  }, [file.publicId, classId]);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (!url) {
          setLoading(false);
          setError(true);
        }
      }, 10000); // 10s timeout
      return () => clearTimeout(timer);
    }
  }, [loading, url]);

  if (loading && !url) return <div className="w-48 h-32 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Đang tải ảnh...</div>;
  if (error && !url) return (
    <div className="w-48 h-32 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 items-center justify-center text-red-500 mt-2">
      <span className="text-xs">Lỗi tải ảnh</span>
      <Button size="small" onClick={fetchSignedUrl}>Thử lại</Button>
    </div>
  );

  return (
    <>
      <img
        src={url!}
        alt={file.fileName}
        className="max-w-full max-h-64 object-contain rounded-lg mt-2 cursor-pointer border border-gray-200"
        onClick={() => setViewerOpen(true)}
      />
      <AttachmentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        file={{
          name: file.fileName,
          url: url!,
          publicId: file.publicId,
          format: file.mimeType?.split("/")[1] || getFileExtension(file.fileName)
        }}
      />
    </>
  );
};

const AttachmentFile = ({ file, classId }: { file: ChatAttachment; classId: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  const format = file.mimeType?.split("/")[1] || getFileExtension(file.fileName);
  const viewable = isViewableFile(file.fileName, format);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const encodedId = encodeURIComponent(file.publicId);
        const res = await api.get(`/classes/${classId}/messages/attachments/${encodedId}/signed-url?resourceType=raw`);
        if (res.data.success) setUrl(res.data.data.signedUrl);
      } catch (err) {
        console.error("Failed to load signed URL", err);
      }
    };
    fetchSignedUrl();
  }, [file.publicId, classId]);

  return (
    <>
      <div 
        className={`flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200 mt-2 transition-colors ${viewable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => {
          if (viewable && url) setViewerOpen(true);
        }}
      >
        <PaperClipOutlined className="text-2xl text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" title={file.fileName}>{file.fileName}</p>
          <p className="text-xs text-gray-500">{(file.bytes / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        {url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-primary hover:text-primary-focus z-10 px-2 py-1"
            onClick={(e) => {
              e.stopPropagation(); // Ngăn không mở viewer khi ấn tải về
            }}
          >
            Tải xuống
          </a>
        ) : (
          <Spin size="small" />
        )}
      </div>
      <AttachmentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        file={url ? {
          name: file.fileName,
          url: url,
          publicId: file.publicId,
          format: format
        } : null}
      />
    </>
  );
};


export const ClassDiscussionTab: React.FC<ClassDiscussionTabProps> = ({ classId, isTeacher, fullHeight = false }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id || "";

  const {
    messages,
    setMessages,
    loading,
    loadingMore,
    nextCursor,
    fetchMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    markAsRead
  } = useChatMessages(classId);

  const { isOnline, isSocketConnected, emitTyping } = useChatSocket({
    classId,
    onMessageReceived: (msg) => {
      setMessages(prev => {
        // Chống trùng với tin đã gửi (do optimistic UI đã tạo 1 bản sao, nhưng clientTempId ko từ server trả về,
        // Ta cần phân biệt dựa vào thời gian tạo gần đây và nội dung giống, hoặc senderId trùng để tìm rồi thay thế... 
        // Tuy nhiên tốt nhất: nếu msg.senderId._id === currentUserId thì có thể ta đã thêm vào thông qua `api.post` trả về!
        // Vậy nên ta cần lọc trùng theo ID thật:
        if (prev.some(p => p._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Nếu user đang ở bottom thì cuộn xuống (sẽ xử lý sau)
      setNewMessageBadge(true);
    },
    onMessageEdited: (msg) => {
      setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
    },
    onMessageDeleted: ({ messageId, isDeleted }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted } : m));
    },
    onReactionUpdated: ({ messageId, reactionsSummary, userReaction }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === messageId) {
          // Chỉ lấy userReaction nếu đây là người thao tác, nhưng userReaction socket trả về là của người kia.
          // Do đó ta cần cẩn thận: nếu reaction kia của chính ta thì update userReaction.
          let newUserReaction = m.userReaction;
          if (userReaction.userId === currentUserId) {
            newUserReaction = userReaction.emoji;
          }
          return { ...m, reactionsSummary, userReaction: newUserReaction };
        }
        return m;
      }));
    },
    onUserTyping: ({ userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => {
          if (!prev.includes(userName)) return [...prev, userName];
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(n => n !== userName));
      }
    }
  });

  const [inputContent, setInputContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ uid: string, percent: number, name: string }[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newMessageBadge, setNewMessageBadge] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  useEffect(() => {
    fetchMessages();
    markAsRead(); // Call when tab opens
    useMessagesStore.getState().markClassAsRead(classId);
  }, [classId, fetchMessages, markAsRead]);

  // Cuộn xuống cùng lần đầu tải xong
  useEffect(() => {
    if (!loading && messages.length > 0 && isAtBottom) {
      scrollToBottom();
      setNewMessageBadge(false);
    }
  }, [loading, messages.length]); // chỉ scroll lần tải đầu

  // Tải thêm khi cuộn lên đỉnh
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    // isAtBottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setIsAtBottom(true);
      setNewMessageBadge(false);
      markAsRead();
      useMessagesStore.getState().markClassAsRead(classId);
    } else {
      setIsAtBottom(false);
    }

    // load more
    if (el.scrollTop === 0 && nextCursor && !loadingMore) {
      const oldScrollHeight = el.scrollHeight;
      loadMore().then(() => {
        // Chống nhảy layout
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - oldScrollHeight;
          }
        }, 0);
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Gom nhóm tin nhắn:
  const groupedMessages = useMemo(() => {
    const result: ChatMessage[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = { ...messages[i], isGrouped: false };
      
      if (i > 0) {
        const prevMsg = result[i - 1];
        const isSameSender = msg.senderId?._id === prevMsg.senderId?._id;
        const timeDiff = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
        
        // Cùng người gửi và cách nhau dưới 5 phút (300.000 ms)
        if (isSameSender && timeDiff < 300000 && !prevMsg.status /* ko gom nhóm các tin đang loading */) {
          msg.isGrouped = true;
        }
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  const handleSend = async () => {
    if ((!inputContent.trim() && attachments.length === 0) || uploadingFiles.length > 0) return;
    
    if (editingMessageId) {
      await editMessage(editingMessageId, inputContent);
      setEditingMessageId(null);
    } else {
      // Tạm thời replyTo không truyền cho Backend được (vì API sendMessage chỉ nhận type, content, attachments),
      // Nhưng nếu backend hỗ trợ replyTo thì ta cần add vào API, ta sẽ ko gửi replyTo để tương thích.
      await sendMessage(inputContent, attachments, isOnline);
      if (isAtBottom) setTimeout(scrollToBottom, 50);
    }

    setInputContent("");
    setAttachments([]);
    setReplyTo(null);
    emitTyping(false);
  };

  // Xử lý Typing debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleInput = (val: string) => {
    setInputContent(val);
    if (!typingTimeoutRef.current) emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Tải file
  const uploadProps: UploadProps = {
    name: "file",
    action: `${envConfig.apiUrl}/classes/${classId}/messages/attachments`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "X-Requested-With": null as any,
    },
    beforeUpload: (file) => {
      const isImg = file.type.startsWith("image/");
      const limit = isImg ? MAX_IMG_SIZE_MB : MAX_FILE_SIZE_MB;
      if (file.size / 1024 / 1024 > limit) {
        toast.error(`Kích thước file vượt quá ${limit}MB!`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onChange(info) {
      if (info.file.status === "uploading") {
        setUploadingFiles(prev => {
          const exists = prev.find(p => p.uid === info.file.uid);
          if (exists) return prev.map(p => p.uid === info.file.uid ? { ...p, percent: info.file.percent || 0 } : p);
          return [...prev, { uid: info.file.uid, percent: info.file.percent || 0, name: info.file.name }];
        });
      }
      if (info.file.status === "done") {
        const { data } = info.file.response;
        setAttachments(prev => [...prev, data]);
        setUploadingFiles(prev => prev.filter(p => p.uid !== info.file.uid));
        toast.success(`${info.file.name} tải lên thành công.`);
      } else if (info.file.status === "error") {
        setUploadingFiles(prev => prev.filter(p => p.uid !== info.file.uid));
        toast.error(`Tải lên ${info.file.name} thất bại.`);
      }
    },
    showUploadList: false,
  };

  const checkEditExpired = (createdAt: string) => {
    const diff = (new Date().getTime() - new Date(createdAt).getTime()) / 1000 / 60;
    return diff > 15;
  };

  return (
    <div className={`flex flex-col ${fullHeight ? 'h-full border-0 rounded-none' : 'h-[calc(100vh-250px)] max-h-[700px] border rounded-xl'} border-gray-200 bg-gray-50 relative`}>
      
      {/* HEADER / INDICATORS */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white flex justify-between items-center rounded-t-xl shrink-0">
        <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
          {!isOnline && <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>}
          {isOnline ? (isSocketConnected ? null : "Đang kết nối lại...") : "Mất kết nối mạng"}
        </span>
        {typingUsers.length > 0 && (
          <span className="text-xs text-primary italic">
            {typingUsers.join(", ")} đang nhập...
          </span>
        )}
      </div>

      {/* MESSAGES AREA */}
      <div 
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 relative" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {loadingMore && <div className="text-center py-2"><Spin size="small" /></div>}
        
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex justify-center items-center"><Spin size="large" /></div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
            <SmileOutlined className="text-4xl mb-2" />
            <p>Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          groupedMessages.map((msg) => {
            const isMine = msg.senderId._id === currentUserId;
            const isTeacherMsg = msg.senderId.role.toLowerCase() === "teacher" || msg.senderId.role.toLowerCase() === "admin";
            
            return (
              <div key={msg._id || msg.clientTempId} className={`flex ${isMine ? "justify-end" : "justify-start"} ${msg.isGrouped ? "mt-1" : "mt-4"}`}>
                
                {/* AVATAR (Chỉ hiện cho người khác và không bị gom) */}
                {!isMine && (
                  <div className="w-8 shrink-0 mr-2 flex justify-center">
                    {!msg.isGrouped && (
                      <Avatar src={msg.senderId.avatar} className={isTeacherMsg ? "border-2 border-primary" : ""}>
                        {msg.senderId.fullName[0].toUpperCase()}
                      </Avatar>
                    )}
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] min-w-0 ${isMine ? "items-end" : "items-start"}`}>
                  {/* Tên và giờ (Chỉ hiện nếu không bị gom) */}
                  {!msg.isGrouped && (
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className={`text-xs font-semibold ${isTeacherMsg ? "text-primary" : "text-gray-700"} truncate`}>
                        {isMine ? "Bạn" : msg.senderId.fullName}
                      </span>
                      {isTeacherMsg && <span className="text-[10px] bg-primary-100 text-primary px-1.5 py-0.5 rounded-sm font-bold">Giảng viên</span>}
                      <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {/* BONG BÓNG TIN NHẮN */}
                  <div className="group relative flex items-center gap-2 w-full min-w-0">
                    
                    {/* Menu thao tác cho người gửi hoặc giáo viên (Chỉ hiện khi hover) */}
                    {isMine && !msg.isDeleted && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2">
                        <Popover 
                          content={
                            <div className="flex flex-col gap-1">
                              {!checkEditExpired(msg.createdAt) && (
                                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingMessageId(msg._id); setInputContent(msg.content); }}>Sửa</Button>
                              )}
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteMessage(msg._id)}>Xóa</Button>
                            </div>
                          } 
                          trigger="click" 
                          placement="left"
                        >
                          <Button size="small" type="text" shape="circle" icon={<MoreOutlined />} />
                        </Popover>
                      </div>
                    )}

                    {/* Lõi bong bóng */}
                    <div 
                      className={`
                        relative px-3 py-2 rounded-2xl break-words text-sm min-w-0 max-w-full
                        ${isMine ? "bg-primary text-white rounded-tr-sm" : (isTeacherMsg ? "bg-primary-50 border border-primary-100 rounded-tl-sm text-gray-800" : "bg-white border border-gray-200 rounded-tl-sm text-gray-800")}
                        ${msg.isDeleted ? "opacity-60 italic bg-gray-100 text-gray-500 border-dashed" : ""}
                        ${msg.status === "sending" ? "opacity-70" : ""}
                        ${msg.status === "error" ? "border-red-400 border-2" : ""}
                      `}
                      style={{ overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
                    >
                      {msg.isDeleted ? (
                        "🚫 Tin nhắn đã được xóa"
                      ) : (
                        <>
                          {msg.content}
                          
                          {/* Đính kèm */}
                          {msg.attachments?.map((file: ChatAttachment, idx: number) => (
                            file.mimeType.startsWith("image/") 
                              ? <AttachmentImage key={idx} file={file} classId={classId} />
                              : <AttachmentFile key={idx} file={file} classId={classId} />
                          ))}

                          {msg.editedAt && <span className="text-[10px] opacity-70 ml-2 block text-right mt-1">(đã chỉnh sửa)</span>}
                        </>
                      )}
                    </div>

                    {/* Trạng thái lỗi */}
                    {msg.status === "error" && (
                      <Button size="small" danger onClick={() => deleteMessage(msg.clientTempId || msg._id)}>Xóa tin lỗi</Button>
                    )}

                    {/* Reacion Picker (Cạnh ngoài cùng) */}
                    {!isMine && !msg.isDeleted && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-2">
                        <Popover 
                          content={
                            <div className="flex gap-2">
                              {EMOJI_WHITELIST.map(emo => (
                                <span 
                                  key={emo} 
                                  className={`cursor-pointer text-xl hover:scale-125 transition-transform ${msg.userReaction === emo ? "bg-gray-200 rounded p-1" : "p-1"}`}
                                  onClick={() => reactToMessage(msg._id, emo)}
                                >
                                  {emo}
                                </span>
                              ))}
                            </div>
                          } 
                          trigger="click" 
                          placement="right"
                        >
                          <Button size="small" type="text" shape="circle" icon={<SmileOutlined />} />
                        </Popover>
                      </div>
                    )}
                    {/* Menu cho giáo viên có thể xóa tin của người khác */}
                    {isTeacher && !isMine && !msg.isDeleted && (
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-10">
                        <Popover content={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteMessage(msg._id)}>Xóa (Quyền GV)</Button>} trigger="click">
                          <Button size="small" type="text" shape="circle" icon={<MoreOutlined />} />
                        </Popover>
                       </div>
                    )}
                  </div>

                  {/* REACTION SUMMARY ROW */}
                  {msg.reactionsSummary && msg.reactionsSummary.length > 0 && !msg.isDeleted && (
                    <div className="flex gap-1 mt-1 z-10">
                      {msg.reactionsSummary.map((r: ChatReaction) => (
                        <div key={r.emoji} className="flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full px-2 py-0.5 text-xs text-gray-700 cursor-default">
                          <span>{r.emoji}</span>
                          <span className="font-semibold">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}

        {/* Cục chặn Scroll To Bottom */}
        <div className="h-2" />
      </div>

      {/* FLOAT BUTTON NEW MESSAGE */}
      {newMessageBadge && !isAtBottom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <Button type="primary" shape="round" onClick={scrollToBottom} className="shadow-lg animate-bounce">
            ↓ Có tin nhắn mới
          </Button>
        </div>
      )}

      {/* INPUT AREA */}
      <div className="p-3 bg-white border-t border-gray-200 rounded-b-xl shrink-0">
        
        {/* Vùng đang Sửa hoặc Reply (Preview) */}
        {editingMessageId && (
          <div className="flex justify-between items-center bg-yellow-50 px-3 py-1.5 rounded mb-2 border border-yellow-200 text-sm">
            <span className="text-yellow-700">Đang chỉnh sửa tin nhắn...</span>
            <CloseOutlined className="cursor-pointer hover:text-red-500" onClick={() => {setEditingMessageId(null); setInputContent("");}} />
          </div>
        )}

        {/* Upload Preview & Progress */}
        <div className="flex flex-col gap-2 mb-2">
          {uploadingFiles.map(f => (
            <div key={f.uid} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded border">
              <span className="truncate w-32">{f.name}</span>
              <Progress percent={Math.round(f.percent)} size="small" className="flex-1" />
            </div>
          ))}
          {attachments.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded border border-blue-100 text-blue-700 w-max">
              <PaperClipOutlined /> <span>{f.fileName}</span>
              <CloseOutlined className="cursor-pointer ml-2 hover:text-red-500" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} />
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <Upload {...uploadProps} accept="image/*" showUploadList={false}>
            <Button type="text" shape="circle" icon={<PictureOutlined />} title="Gửi ảnh" />
          </Upload>
          <Upload {...uploadProps} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" showUploadList={false}>
            <Button type="text" shape="circle" icon={<PaperClipOutlined />} title="Đính kèm tệp" />
          </Upload>
          
          <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden relative">
            <Input.TextArea
              value={inputContent}
              onChange={(e) => handleInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isOnline ? "Nhập tin nhắn..." : "Không có mạng. Đang ghi nhận offline..."}
              autoSize={{ minRows: 1, maxRows: 5 }}
              variant="borderless"
              maxLength={5000}
              className="px-3 py-2 text-sm resize-none custom-scrollbar"
            />
            {inputContent.length > 4000 && (
              <span className="absolute bottom-1 right-2 text-[10px] text-orange-500">{inputContent.length}/5000</span>
            )}
          </div>
          
          <Button 
            type="primary" 
            shape="circle" 
            icon={<SendOutlined />} 
            disabled={(!inputContent.trim() && attachments.length === 0) || uploadingFiles.length > 0} 
            onClick={handleSend}
            size="large"
            className="flex items-center justify-center shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

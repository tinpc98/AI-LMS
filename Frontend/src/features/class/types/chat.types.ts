export interface ChatReaction {
  emoji: string;
  count: number;
}

export interface UserReaction {
  userId: string;
  emoji: string | null;
}

export interface ChatAttachment {
  publicId: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  storageType?: string;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  _id: string;
  classId: string;
  senderId: {
    _id: string;
    fullName: string;
    avatar: string;
    email: string;
    role: string;
  };
  type: "text" | "image" | "file";
  content: string;
  attachments: ChatAttachment[];
  replyTo?: ChatMessage | null;
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reactionsSummary: ChatReaction[];
  userReaction: string | null;
  // Các field frontend dùng nội bộ:
  isGrouped?: boolean;
  status?: "sending" | "sent" | "error";
  clientTempId?: string; // Để optimistic UI
}

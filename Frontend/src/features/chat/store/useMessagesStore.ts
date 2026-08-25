import { create } from 'zustand';
import api from '../../../api/axiosClient';
import { connectSocket } from '../../../shared/lib/socketClient';
import type { ChatMessage } from '../../class/types/chat.types';

export interface ClassSummary {
  classId: string;
  className: string;
  unreadCount: number;
  lastMessage: {
    content: string;
    senderId: string;
    senderName?: string;
    createdAt: string;
    type: string;
  } | null;
}

interface MessagesState {
  totalUnread: number;
  classes: ClassSummary[];
  loading: boolean;
  initialized: boolean;
  fetchSummary: () => Promise<void>;
  markClassAsRead: (classId: string) => void;
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
}

// Global variable to store the listener reference to avoid removing other listeners
let globalHandleNewMessage: ((msg: ChatMessage) => void) | null = null;

export const useMessagesStore = create<MessagesState>((set, get) => {
  return {
    totalUnread: 0,
    classes: [],
    loading: false,
    initialized: false,

    fetchSummary: async () => {
      try {
        set({ loading: true });
        const res = await api.get('/messages/unread-summary');
        if (res.data.success) {
          const { totalUnread, details } = res.data.data;
          set({
            totalUnread,
            classes: details,
            loading: false,
            initialized: true
          });
          // Join socket rooms for all classes
          const socket = connectSocket();
          details.forEach((c: ClassSummary) => {
            socket.emit("JOIN_CHAT_ROOM", { classId: c.classId }, () => {});
          });
        }
      } catch (error) {
        console.error("Failed to fetch messages summary", error);
        set({ loading: false, initialized: true });
      }
    },

    markClassAsRead: (classId: string) => {
      set((state) => {
        const classIndex = state.classes.findIndex(c => c.classId === classId);
        if (classIndex === -1) return state;

        const targetClass = state.classes[classIndex];
        const unreadDiff = targetClass.unreadCount;

        if (unreadDiff === 0) return state; // Already read

        const newClasses = [...state.classes];
        newClasses[classIndex] = { ...targetClass, unreadCount: 0 };

        return {
          totalUnread: Math.max(0, state.totalUnread - unreadDiff),
          classes: newClasses
        };
      });
    },

    initializeSocketListeners: () => {
      const socket = connectSocket();

      if (!globalHandleNewMessage) {
        globalHandleNewMessage = (msg: ChatMessage) => {
          set((state) => {
            const classIndex = state.classes.findIndex(c => c.classId === msg.classId);
            if (classIndex === -1) return state; // Class not found

            const oldClass = state.classes[classIndex];
            
            const newClass = {
              ...oldClass,
              unreadCount: oldClass.unreadCount + 1,
              lastMessage: {
                content: msg.content || (msg.attachments?.length > 0 ? "[Đính kèm]" : ""),
                senderId: msg.senderId._id || msg.senderId.toString(),
                senderName: msg.senderId.fullName || "Người dùng",
                createdAt: msg.createdAt || new Date().toISOString(),
                type: msg.type || "text"
              }
            };

            const newClasses = [...state.classes];
            newClasses.splice(classIndex, 1);
            newClasses.unshift(newClass); // Move to top

            return {
              classes: newClasses,
              totalUnread: state.totalUnread + 1
            };
          });
        };
        socket.on("CHAT_NEW_MESSAGE", globalHandleNewMessage);
      }
    },

    cleanupSocketListeners: () => {
      const socket = connectSocket();
      if (globalHandleNewMessage) {
        socket.off("CHAT_NEW_MESSAGE", globalHandleNewMessage);
        globalHandleNewMessage = null;
      }
    }
  };
});

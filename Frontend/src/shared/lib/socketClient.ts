import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

const getSocketUrl = (): string => {
  return import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
};

const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

/**
 * Lấy hoặc khởi tạo Singleton Socket.IO Client với JWT Auth Handshake
 */
export const getSocket = (): Socket => {
  if (!socketInstance) {
    const socketUrl = getSocketUrl();
    const token = getAccessToken();

    socketInstance = io(socketUrl, {
      auth: {
        token: token ? `Bearer ${token}` : "",
      },
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log(`🔌 [socketClient] Socket connected: ${socketInstance?.id}`);
    });

    socketInstance.on("connect_error", (err: unknown) => {
      console.warn("⚠️ [socketClient] Connection Error:", err);
    });

    socketInstance.on("disconnect", (reason: string) => {
      console.log(`🚪 [socketClient] Socket disconnected: ${reason}`);
    });
  }

  return socketInstance;
};

/**
 * Kết nối Socket với Token xác thực mới nhất
 */
export const connectSocket = (): Socket => {
  const socket = getSocket();
  const token = getAccessToken();

  if (token) {
    socket.auth = { token: `Bearer ${token}` };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

/**
 * Ngắt kết nối Socket và dọn dẹp khi Logout
 */
export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("🔒 [socketClient] Socket instance destroyed on logout.");
  }
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
};

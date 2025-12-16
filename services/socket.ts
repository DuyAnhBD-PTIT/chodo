import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;

class SocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;

  async connect() {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      try {
        const token = await AsyncStorage.getItem("@marketplace_token");
        if (!token) return;
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
        });

        this.setupEventListeners();
      } catch (error) {
        console.error("Socket connection error:", error);
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  private setupEventListeners() {
    if (!this.socket) return;
    this.socket.on("connect", () =>
      console.log("✅ Socket connected:", this.socket?.id)
    );
    this.socket.onAny((eventName, ...args) =>
      console.log("📡 Event:", eventName)
    );
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      this.connect().then(() => {
        this.socket?.off(event);
        this.socket?.on(event, callback);
      });
    } else {
      this.socket.off(event);
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    this.socket?.off(event);
  }

  // THÊM LẠI HÀM NÀY ĐỂ HẾT LỖI
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      console.log("✅ Socket disconnected manually");
    }
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

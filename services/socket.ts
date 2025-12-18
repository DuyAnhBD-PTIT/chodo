import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;

class SocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  /**
   * Connect socket, đảm bảo token sẵn sàng trước khi connect
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    if (!this.connectionPromise) {
      this.connectionPromise = (async () => {
        try {
          // Chờ token sẵn sàng
          let token: string | null = null;
          while (!token) {
            token = await AsyncStorage.getItem("@marketplace_token");
            if (!token) await new Promise((r) => setTimeout(r, 200));
          }

          // Khởi tạo socket
          this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket"],
            reconnection: true,
          });

          this.setupEventListeners();

          // Await connect xong
          await new Promise<void>((resolve) => {
            this.socket?.once("connect", () => resolve());
          });
          console.log("✅ SocketService connected");
        } catch (error) {
          console.error("Socket connection error:", error);
          this.connectionPromise = null;
        }
      })();
    }

    return this.connectionPromise;
  }

  /**
   * Thiết lập listener mặc định
   */
  private setupEventListeners() {
    if (!this.socket) return;
    this.socket.on("connect", () =>
      console.log("✅ Socket connected:", this.socket?.id)
    );
    this.socket.onAny((eventName, ...args) =>
      console.log("📡 Event:", eventName)
    );
  }

  /**
   * Attach event, hỗ trợ nhiều listeners cho cùng 1 event
   */
  on(event: string, callback: (...args: any[]) => void) {
    this.connect().then(() => {
      // Lấy hoặc tạo Set callbacks cho event này
      let callbacks = this.listeners.get(event);
      if (!callbacks) {
        callbacks = new Set();
        this.listeners.set(event, callbacks);
      }

      // Thêm callback mới vào Set
      callbacks.add(callback);

      // Register với socket (socket.io tự động handle multiple listeners)
      this.socket?.on(event, callback);
    });
  }

  /**
   * Remove một listener cụ thể cho event
   */
  off(event: string, callback: (...args: any[]) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      this.socket?.off(event, callback);

      // Nếu không còn callback nào, xóa entry
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Disconnect manual
   */
  disconnect() {
    if (this.socket) {
      // Remove tất cả listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.off(event, callback);
        });
      });

      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      this.listeners.clear();
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

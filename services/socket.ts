import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;

class SocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private listeners = new Map<string, (...args: any[]) => void>();

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
   * Attach event, tránh detach listener liên tục
   */
  on(event: string, callback: (...args: any[]) => void) {
    this.connect().then(() => {
      const oldCallback = this.listeners.get(event);
      if (oldCallback) this.socket?.off(event, oldCallback);

      this.socket?.on(event, callback);
      this.listeners.set(event, callback);
    });
  }

  /**
   * Remove event listener
   */
  off(event: string) {
    const cb = this.listeners.get(event);
    if (cb) {
      this.socket?.off(event, cb);
      this.listeners.delete(event);
    }
  }

  /**
   * Disconnect manual
   */
  disconnect() {
    if (this.socket) {
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

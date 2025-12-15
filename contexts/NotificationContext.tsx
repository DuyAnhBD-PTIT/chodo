import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Alert } from "react-native";
import { useAuth } from "./AuthContext";
import { socketService } from "@/services/socket";
import * as notificationsService from "@/services/api/notifications";
import type { Notification } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const [notificationsData, count] = await Promise.all([
        notificationsService.getNotifications(),
        notificationsService.getUnreadCount(),
      ]);
      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (error: any) {
      console.error("Load notifications error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Mark as read error:", error);
      Alert.alert("Lỗi", "Không thể đánh dấu đã đọc");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      Alert.alert("Lỗi", "Không thể đánh dấu tất cả đã đọc");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);

      // Update local state
      const deletedNotif = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));

      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error("Delete notification error:", error);
      Alert.alert("Lỗi", "Không thể xóa thông báo");
    }
  };

  // Setup socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect socket
    socketService.connect();

    // Handle new notification
    const handleNewNotification = (notification: Notification) => {
      console.log("New notification received:", notification);

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    // Handle unread count update
    const handleUnreadCountUpdate = (data: { count: number }) => {
      console.log("Unread count update:", data);
      setUnreadCount(data.count);
    };

    socketService.on("new_notification", handleNewNotification);
    socketService.on("unread_count_update", handleUnreadCountUpdate);

    // Load initial notifications
    loadNotifications();

    return () => {
      socketService.off("new_notification", handleNewNotification);
      socketService.off("unread_count_update", handleUnreadCountUpdate);
    };
  }, [isAuthenticated, loadNotifications]);

  // Disconnect socket on logout
  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

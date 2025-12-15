import type { Notification } from "@/types";
import api from "./index";

export const getNotifications = async (params?: {
  page?: number;
  limit?: number;
}): Promise<Notification[]> => {
  try {
    const response = await api.get("/api/notifications", { params });
    console.log("Get notifications response:", response.data);
    return response.data.data.notifications;
  } catch (error: any) {
    console.error("Get notifications error:", error);
    throw error.response?.data || error;
  }
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get("/api/notifications/unread-count");
    console.log("Get unread count response:", response.data);
    return response.data.unreadCount;
  } catch (error: any) {
    console.error("Get unread count error:", error);
    throw error.response?.data || error;
  }
};

export const markAsRead = async (id: string): Promise<void> => {
  try {
    const response = await api.put(`/api/notifications/${id}/read`);
    console.log("Mark as read response:", response.data);
  } catch (error: any) {
    console.error("Mark as read error:", error);
    throw error.response?.data || error;
  }
};

export const markAllAsRead = async (): Promise<void> => {
  try {
    const response = await api.put("/api/notifications/mark-all-read");
    console.log("Mark all as read response:", response.data);
  } catch (error: any) {
    console.error("Mark all as read error:", error);
    throw error.response?.data || error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const response = await api.delete(`/api/notifications/${id}`);
    console.log("Delete notification response:", response.data);
  } catch (error: any) {
    console.error("Delete notification error:", error);
    throw error.response?.data || error;
  }
};

import { API_CONFIG } from "@/constants/api";
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

// Tạo axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - tự động gán token vào header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Lấy token từ secure store
      const token = await SecureStore.getItemAsync("authToken");

      if (token && config.headers) {
        // Gán token vào Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token from secure store:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi token hết hạn
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      // Xóa token và chuyển về màn đăng nhập
      try {
        await SecureStore.deleteItemAsync("authToken");
      } catch (e) {
        console.error("Error deleting token:", e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("@marketplace_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      AsyncStorage.removeItem("@marketplace_token");
      AsyncStorage.removeItem("@marketplace_user");
    }
    return Promise.reject(error);
  }
);

export default api;

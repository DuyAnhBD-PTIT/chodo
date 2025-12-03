import type {
  AuthResponse,
  LoginData,
  RegisterData,
  UpdateProfileData,
  User,
  VerifyData,
} from "@/types";
import * as SecureStore from "expo-secure-store";
import api from "./api";

// Lưu token vào secure store
export const saveToken = async (token: string): Promise<void> => {
  try {
    if (!token || typeof token !== "string") {
      throw new Error("Token must be a non-empty string");
    }
    await SecureStore.setItemAsync("authToken", token);
  } catch (error) {
    console.error("Error saving token:", error);
    throw error;
  }
};

// Lấy token từ secure store
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("authToken");
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Xóa token khỏi secure store
export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync("authToken");
  } catch (error) {
    console.error("Error removing token:", error);
    throw error;
  }
};

// API đăng ký
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/api/users/register", data);

    return response.data;
  } catch (error: any) {
    console.error("Register API error:", error);
    throw error.response?.data || error;
  }
};

// API xác thực email
export const verify = async (data: VerifyData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/api/users/verify", data);

    return response.data;
  } catch (error: any) {
    console.error("Verify API error:", error);
    throw error.response?.data || error;
  }
};

// API đăng nhập
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/api/users/login", data);

    return response.data;
  } catch (error: any) {
    console.error("Login API error:", error);
    throw error.response?.data || error;
  }
};

// API cập nhật profile
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  try {
    const response = await api.put<User>("/api/users/profile", data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Đăng xuất
export const logout = async (): Promise<void> => {
  await removeToken();
};

// Giải mã JWT token để lấy thông tin user (client-side parsing)
export const parseToken = (token: string): User | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
};

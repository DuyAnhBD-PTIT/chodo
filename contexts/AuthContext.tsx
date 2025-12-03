import * as authService from "@/services/auth";
import type { AuthContextType, AuthProviderProps, User } from "@/types";
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    loadUser();
  }, []);

  // Protected routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Chưa đăng nhập và không ở màn auth -> chuyển về login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Đã đăng nhập và đang ở màn auth -> chuyển về app
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoading, router]);

  const loadUser = async () => {
    try {
      const token = await authService.getToken();
      if (token) {
        const userData = authService.parseToken(token);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      await authService.saveToken(response.data.token);
      const userData = authService.parseToken(response.data.token);
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await authService.register({ email, password, name });
      // Không tự động đăng nhập sau khi đăng ký, cần verify trước
      // Chuyển sang màn verify
      return response;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const verify = async (email: string, code: string) => {
    try {
      const response = await authService.verify({ email, code });
      await authService.saveToken(response.data.token);
      const userData = authService.parseToken(response.data.token);
      setUser(userData);
    } catch (error) {
      console.error("Verify error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verify,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import type { ApiConfig, ApiEndpoints } from "@/types";

export const API_CONFIG: ApiConfig = {
  // Đọc từ .env file (EXPO_PUBLIC_API_URL)
  BASE_URL: process.env.EXPO_PUBLIC_API_URL,
  TIMEOUT: 10000,
};

// API prefix
const API_PREFIX = "/api";

// Helper function to create endpoint with prefix
const endpoint = (path: string) => `${API_PREFIX}${path}`;

// Endpoints
export const API_ENDPOINTS: ApiEndpoints = {
  REGISTER: endpoint("/users/register"),
  VERIFY: endpoint("/users/verify"),
  LOGIN: endpoint("/users/login"),
  PROFILE: endpoint("/users/profile"),
  POSTS: endpoint("/posts"),
  MY_POSTS: endpoint("/posts/my"),
  CATEGORIES: endpoint("/categories"),
};

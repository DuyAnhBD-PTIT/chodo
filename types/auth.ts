export interface User {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  role?: string;
  status?: string;
  verified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  address?: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

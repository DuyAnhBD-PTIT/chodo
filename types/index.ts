// ============================================
// USER TYPES
// ============================================

export interface User {
  userId: string;
  email: string;
  role: "user" | "admin";
  name?: string;
  fullName?: string;
  [key: string]: any;
}

// ============================================
// AUTH REQUEST TYPES
// ============================================

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface VerifyData {
  email: string;
  code: string;
}

// Type alias for update profile
export type UpdateProfileData = Partial<User>;

// ============================================
// AUTH RESPONSE TYPES
// ============================================

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user?: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// AUTH CONTEXT TYPES
// ============================================

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<AuthResponse>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: UpdateProfileData) => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================
// API CONFIG TYPES
// ============================================

export interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
}

export interface ApiEndpoints {
  REGISTER: string;
  VERIFY: string;
  LOGIN: string;
  PROFILE: string;
  POSTS: string;
  MY_POSTS: string;
  CATEGORIES: string;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

// ============================================
// POST TYPES
// ============================================

export interface PostUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface PostCategory {
  id: string;
  name: string;
}

export interface PostImage {
  imageUrl: string;
}

export type PostCondition = "new" | "used";
export type PostStatus = "pending" | "approved" | "rejected" | "sold";

export interface Post {
  _id: string;
  user: PostUser;
  category: PostCategory;
  title: string;
  description?: string;
  price: number;
  condition: PostCondition;
  address?: string;
  status: PostStatus;
  views: number;
  images: PostImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  description?: string;
  price: number;
  condition: PostCondition;
  categoryId: string;
  categoryName?: string;
  address?: string;
  images?: string[]; // Array of image URLs
}

export interface UpdatePostData extends Partial<CreatePostData> {
  status?: PostStatus;
}

export interface PostsListResponse {
  success: boolean;
  message: string;
  data: {
    posts: Post[];
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PostDetailResponse {
  success: boolean;
  message: string;
  data: Post;
}

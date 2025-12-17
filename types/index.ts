// Post types
export type PostCondition = "new" | "used";
export type PostStatus = "pending" | "approved" | "rejected" | "sold";

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
  publicId?: string;
}

export interface Post {
  _id: string;
  user: PostUser;
  category: PostCategory;
  title: string;
  description?: string;
  price: number;
  quantity: number;
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
  quantity: number;
}

export interface UpdatePostData {
  title?: string;
  description?: string;
  price?: number;
  condition?: PostCondition;
  categoryId?: string;
  categoryName?: string;
  address?: string;
  status?: PostStatus;
}

export interface PostDetailResponse {
  success: boolean;
  message: string;
  data: Post;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Notification types
export type NotificationType =
  | "report"
  | "post_approved"
  | "post_rejected"
  | "comment"
  | "message";

export interface NotificationUser {
  id: string;
  fullName: string;
}

export interface Notification {
  _id: string;
  recipient: NotificationUser;
  sender?: NotificationUser;
  type: NotificationType;
  postId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: { count: number };
}

// Conversation types
export interface ConversationMember {
  id: string;
  fullName: string;
  avatarUrl: string;
}

export interface Conversation {
  _id: string;
  postId: string;
  otherUser: ConversationMember;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface MessageUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: MessageUser;
  receiver: MessageUser;
  content: string;
  isRead: boolean;
  createdAt: string;
  __v?: number;
}

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as conversationsService from "@/services/api/conversations";
import * as postsService from "@/services/api/posts";
import * as messagesService from "@/services/api/messages";
import { socketService } from "@/services/socket";
import type { Conversation, Post, Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { user } = useAuth();
  const { setTotalUnreadCount } = useChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [posts, setPosts] = useState<{ [key: string]: Post }>({});
  const [lastMessages, setLastMessages] = useState<{ [key: string]: any }>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  // Reload conversations khi screen được focus lại (quay lại từ conversation detail)
  useFocusEffect(
    useCallback(() => {
      console.log("[Explore] Screen focused - reloading conversations");
      loadConversations();
    }, [])
  );

  // Socket listener for real-time message updates
  useEffect(() => {
    const handleNewMessage = (messageData: Message) => {
      console.log("[Chat List] Received new message:", messageData);

      // Update last message for this conversation
      setLastMessages((prev) => ({
        ...prev,
        [messageData.conversationId]: messageData,
      }));

      // Update unread count if message is from other user
      if (messageData.sender.id !== user?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [messageData.conversationId]:
            (prev[messageData.conversationId] || 0) + 1,
        }));
      }

      // Move conversation to top by updating its order
      setConversations((prev) => {
        const convIndex = prev.findIndex(
          (c) => c._id === messageData.conversationId
        );
        if (convIndex > -1) {
          const updatedConv = {
            ...prev[convIndex],
            updatedAt: messageData.createdAt,
          };
          const newConversations = [...prev];
          newConversations.splice(convIndex, 1);
          return [updatedConv, ...newConversations];
        }
        return prev;
      });
    };

    const handleMessagesRead = (data: {
      conversationId: string;
      messageIds: string[];
    }) => {
      console.log("[Chat List] Messages marked as read:", data);
      console.log("[Chat List] Current unread counts before:", unreadCounts);

      // Reset unread count cho conversation này
      setUnreadCounts((prev) => {
        const updated = {
          ...prev,
          [data.conversationId]: 0,
        };
        console.log("[Chat List] Updated unread counts:", updated);
        return updated;
      });
    };

    socketService.on("new_message", handleNewMessage);
    socketService.on("messages_read", handleMessagesRead);

    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("messages_read", handleMessagesRead);
    };
  }, [user?._id]);

  // Update total unread count for tab badge
  useEffect(() => {
    // Only count unread for conversations where last message is from other user
    const total = Object.entries(unreadCounts).reduce(
      (sum, [convId, count]) => {
        const lastMessage = lastMessages[convId];
        if (count > 0 && lastMessage?.sender.id !== user?._id) {
          return sum + count;
        }
        return sum;
      },
      0
    );
    setTotalUnreadCount(total);
  }, [unreadCounts, lastMessages, user?._id, setTotalUnreadCount]);

  const loadConversations = async () => {
    try {
      const data = await conversationsService.getConversations();
      setConversations(data);

      // Load post details and last message for each conversation
      const postPromises = data.map((conv) =>
        postsService.getPostById(conv.postId).catch(() => null)
      );

      const messagePromises = data.map((conv) =>
        messagesService.getMessages(conv._id).catch(() => [])
      );

      const [postResults, messageResults] = await Promise.all([
        Promise.all(postPromises),
        Promise.all(messagePromises),
      ]);

      const postsMap: { [key: string]: Post } = {};
      const lastMessagesMap: { [key: string]: any } = {};
      const unreadCountsMap: { [key: string]: number } = {};

      postResults.forEach((post, index) => {
        if (post) {
          postsMap[data[index].postId] = post;
        }
      });

      messageResults.forEach((messages, index) => {
        if (messages && messages.length > 0) {
          const convId = data[index]._id;
          // Get last message
          lastMessagesMap[convId] = messages[messages.length - 1];

          // Count unread messages (messages from other user that are not read)
          const unreadCount = messages.filter(
            (msg: any) => msg.sender.id !== user?._id && !msg.isRead
          ).length;
          unreadCountsMap[convId] = unreadCount;
        }
      });

      setPosts(postsMap);
      setLastMessages(lastMessagesMap);
      setUnreadCounts(unreadCountsMap);
    } catch (error: any) {
      console.error("Load conversations error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Hôm nay";
    if (diffInDays === 1) return "Hôm qua";
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const post = posts[item.postId];
    const otherUser = item.otherUser;
    const lastMessage = lastMessages[item._id];
    const unreadCount = unreadCounts[item._id] || 0;
    // Only show unread if last message is from other user
    const hasUnread = unreadCount > 0 && lastMessage?.sender.id !== user?._id;

    // Determine message display text
    const getMessageDisplay = () => {
      if (!lastMessage) return "Bắt đầu cuộc hội thoại";

      const isMyMessage = lastMessage.sender.id === user?._id;
      const senderName = isMyMessage
        ? "Bạn"
        : otherUser?.fullName || "Người dùng";

      return `${senderName}: ${lastMessage.content}`;
    };

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: hasUnread ? colors.primary + "08" : colors.card,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => {
          // Navigate to conversation - marking as read will be handled in conversation detail screen
          router.push(`/conversation/${item._id}`);
        }}
        activeOpacity={0.7}
      >
        {/* Overlapping Avatars Container */}
        <View style={styles.avatarsWrapper}>
          {/* Product Image - Bottom Left */}
          {post?.images && post.images.length > 0 ? (
            <Image
              source={{ uri: post.images[0].imageUrl }}
              style={[styles.productAvatar, { borderColor: colors.background }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.productAvatarPlaceholder,
                {
                  backgroundColor: colors.border,
                  borderColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={colors.tertiary}
              />
            </View>
          )}

          {/* User Avatar - Top Right (overlapping) */}
          <View style={styles.userAvatarWrapper}>
            {otherUser?.avatarUrl ? (
              <Image
                source={{ uri: otherUser?.avatarUrl }}
                style={[styles.userAvatar, { borderColor: colors.background }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.userAvatarPlaceholder,
                  {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.background,
                  },
                ]}
              >
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
            )}
            {hasUnread && (
              <View
                style={[styles.unreadBadge, { backgroundColor: colors.error }]}
              >
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Conversation Info */}
        <View style={styles.conversationContent}>
          {/* Post Title - Title 1 */}
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.postTitleMain,
                { color: colors.text },
                hasUnread && styles.postTitleMainUnread,
              ]}
              numberOfLines={1}
            >
              {post?.title || "Bài đăng"}
            </Text>
            <Text style={[styles.conversationDate, { color: colors.tertiary }]}>
              {lastMessage
                ? formatDate(lastMessage.createdAt)
                : formatDate(item.updatedAt)}
            </Text>
          </View>

          {/* User Name - Title 2 */}
          <Text
            style={[
              styles.userName,
              { color: colors.secondary },
              hasUnread && styles.userNameUnread,
            ]}
            numberOfLines={1}
          >
            {otherUser?.fullName || "Người dùng"}
          </Text>

          {/* Last Message with Sender Name */}
          <Text
            style={[
              styles.lastMessage,
              { color: hasUnread ? colors.text : colors.secondary },
              hasUnread && styles.lastMessageUnread,
            ]}
            numberOfLines={2}
          >
            {getMessageDisplay()}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color={colors.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Chưa có tin nhắn
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.tertiary }]}>
        Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Tin nhắn
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Tin nhắn
        </Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          conversations.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  avatarsWrapper: {
    width: 60,
    height: 60,
    position: "relative",
  },
  productAvatar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: "hidden",
  },
  productAvatarPlaceholder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarWrapper: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: "hidden",
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  unreadBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
    gap: 2,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  postTitleMain: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  postTitleMainUnread: {
    fontWeight: "700",
  },
  conversationDate: {
    fontSize: 11,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  userNameUnread: {
    fontWeight: "600",
  },
  conversationSubtitle: {
    fontSize: 13,
  },
  lastMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  lastMessageUnread: {
    fontWeight: "600",
  },
});

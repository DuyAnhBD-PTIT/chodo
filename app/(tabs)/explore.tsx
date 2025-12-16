import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

    socketService.on("new_message", handleNewMessage);

    return () => {
      socketService.off("new_message");
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

  const getOtherMember = (conversation: Conversation) => {
    if (!conversation.members || conversation.members.length === 0) {
      return null;
    }
    return conversation.members.find((member) => member.id !== user?._id);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const post = posts[item.postId];
    const otherMember = getOtherMember(item);
    const lastMessage = lastMessages[item._id];
    const unreadCount = unreadCounts[item._id] || 0;
    // Only show unread if last message is from other user
    const hasUnread = unreadCount > 0 && lastMessage?.sender.id !== user?._id;

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
          // Clear unread count when entering conversation
          if (hasUnread) {
            setUnreadCounts((prev) => ({
              ...prev,
              [item._id]: 0,
            }));
          }
          router.push(`/conversation/${item._id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}
          >
            <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          </View>
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

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationTitle,
                { color: colors.text },
                hasUnread && styles.conversationTitleUnread,
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

          {lastMessage ? (
            <Text
              style={[
                styles.lastMessage,
                { color: hasUnread ? colors.text : colors.secondary },
                hasUnread && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {lastMessage.sender.id === user?._id && "Bạn: "}
              {lastMessage.content}
            </Text>
          ) : (
            <Text
              style={[styles.conversationSubtitle, { color: colors.secondary }]}
              numberOfLines={1}
            >
              {post ? `${post.price.toLocaleString("vi-VN")} đ` : "Đang tải..."}
            </Text>
          )}
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
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  unreadBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  conversationTitleUnread: {
    fontWeight: "700",
  },
  conversationDate: {
    fontSize: 12,
  },
  conversationSubtitle: {
    fontSize: 14,
  },
  lastMessage: {
    fontSize: 14,
  },
  lastMessageUnread: {
    fontWeight: "600",
  },
});

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
import type { Conversation, Post } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [posts, setPosts] = useState<{ [key: string]: Post }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await conversationsService.getConversations();
      setConversations(data);

      // Load post details for each conversation
      const postPromises = data.map((conv) =>
        postsService.getPostById(conv.postId).catch(() => null)
      );
      const postResults = await Promise.all(postPromises);

      const postsMap: { [key: string]: Post } = {};
      postResults.forEach((post, index) => {
        if (post) {
          postsMap[data[index].postId] = post;
        }
      });
      setPosts(postsMap);
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

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => {
          router.push(`/conversation/${item._id}`);
        }}
        activeOpacity={0.7}
      >
        <View
          style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}
        >
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {post?.title || "Bài đăng"}
            </Text>
            <Text style={[styles.conversationDate, { color: colors.tertiary }]}>
              {formatDate(item.updatedAt)}
            </Text>
          </View>

          <Text
            style={[styles.conversationSubtitle, { color: colors.secondary }]}
            numberOfLines={1}
          >
            {post ? `${post.price.toLocaleString("vi-VN")} đ` : "Đang tải..."}
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
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
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
  conversationDate: {
    fontSize: 12,
  },
  conversationSubtitle: {
    fontSize: 14,
  },
});

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as postsService from "@/services/api/posts";
import * as usersService from "@/services/api/users";
import type { Post } from "@/types";
import type { User } from "@/types/auth";
import PostCard from "@/components/PostCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      const userData = await usersService.getUserById(id as string);
      setUser(userData);
      await loadPosts(true);
    } catch (error: any) {
      console.error("Load user error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin người dùng");
      router.back();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadPosts = async (reset: boolean = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const data = await postsService.getPosts({
        page: currentPage,
        limit: 10,
        status: "approved",
        author: id as string,
      });

      if (reset) {
        setPosts(data);
        setPage(2);
      } else {
        setPosts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
      }

      setHasMore(data.length === 10);
    } catch (error: any) {
      console.error("Load posts error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách bài đăng");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserData();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadPosts(false);
    }
  };

  const renderHeader = () => (
    <>
      {/* Avatar + User Info Section */}
      <View style={styles.userSection}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.fullName || "User"}
        </Text>

        <View style={styles.emailContainer}>
          <Text style={[styles.userEmail, { color: colors.secondary }]}>
            {user?.email || "user@example.com"}
          </Text>
          {user?.status === "active" && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#4CAF50"
              style={styles.verifiedIcon}
            />
          )}
        </View>
      </View>

      {/* Posts Header */}
      <View style={styles.postsHeader}>
        <Text style={[styles.postsTitle, { color: colors.text }]}>
          Bài đăng
        </Text>
        <Text style={[styles.postsCount, { color: colors.secondary }]}>
          {posts.length} bài
        </Text>
      </View>
    </>
  );

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard post={item} from="home" hideStatus />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color={colors.tertiary} />
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        Người dùng chưa có bài đăng nào
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hồ sơ</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Posts List with Header */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            Đang tải...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
  },
  userSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 6,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userEmail: {
    fontSize: 15,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  postsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  postsCount: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

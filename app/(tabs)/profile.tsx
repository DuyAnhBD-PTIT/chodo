import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as postsService from "@/services/api/posts";
import type { Post } from "@/types";
import PostCard from "@/components/PostCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await postsService.getMyPosts();
      setPosts(data);
    } catch (error: any) {
      console.error("Load posts error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách bài đăng");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const handleSettings = () => {
    router.push("/settings");
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
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </Text>
          </View>
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
          Bài đăng của tôi
        </Text>
        <Text style={[styles.postsCount, { color: colors.secondary }]}>
          {posts.length} bài
        </Text>
      </View>
    </>
  );

  const renderItem = ({ item }: { item: Post }) => <PostCard post={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color={colors.tertiary} />
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        Bạn chưa có bài đăng nào
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hồ sơ</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettings}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  settingsButton: {
    padding: 4,
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
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#667eea",
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
});

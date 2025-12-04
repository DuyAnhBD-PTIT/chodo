import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as postsService from "@/services/posts";
import type { Post } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PostCard from "@/components/PostCard";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
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

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể đăng xuất");
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert("Chức năng đang phát triển", "Tính năng này sẽ sớm ra mắt");
  };

  const handlePostPress = (post: Post) => {
    Alert.alert(
      post.title,
      `Giá: ${post.price.toLocaleString("vi-VN")} đ\nTrạng thái: ${
        post.status
      }`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Xem chi tiết",
          onPress: () => {
            console.log("Navigate to post:", post._id);
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <>
      {/* Avatar + User Info Section */}
      <View style={styles.userSection}>
        {/* Avatar Illustration */}
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.fullName?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </Text>
          </View>
        </View>

        {/* User Name */}
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.name || user?.fullName || "Albert Flores"}
        </Text>

        {/* Email with verified icon */}
        <View style={styles.emailContainer}>
          <Text style={[styles.userEmail, { color: colors.secondary }]}>
            {user?.email || "albertflores@mail.com"}
          </Text>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color="#4CAF50"
            style={styles.verifiedIcon}
          />
        </View>
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={[styles.editButton, { borderColor: colors.border }]}
        onPress={handleEditProfile}
      >
        <Text style={[styles.editButtonText, { color: colors.text }]}>
          Edit Profile
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.secondary} />
      </TouchableOpacity>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <View style={styles.tabButton}>
          <Text style={[styles.tabText, { color: colors.secondary }]}>
            Services
          </Text>
        </View>
        <View
          style={[
            styles.tabButton,
            styles.activeTab,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.activeTabText}>Products</Text>
        </View>
        <View style={styles.tabButton}>
          <Text style={[styles.tabText, { color: colors.secondary }]}>
            Reviews
          </Text>
        </View>
      </View>
    </>
  );

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={handlePostPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        Bạn chưa có bài đăng nào
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Profile
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleLogout}
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
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#333",
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1.5,
    marginHorizontal: 60,
    marginBottom: 24,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
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
  },
});

import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PostsList from "@/components/PostsList";
import * as categoriesService from "@/services/api/categories";
import * as usersService from "@/services/api/users";
import type { Category } from "@/types";
import type { TopSeller } from "@/services/api/users";
import { useNotifications } from "@/contexts/NotificationContext";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isTopSellersLoading, setIsTopSellersLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadTopSellers();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      const activeCategories = data.filter((cat) => cat.isActive);
      setCategories(activeCategories);
    } catch (error: any) {
      console.error("Load categories error:", error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadTopSellers = async () => {
    try {
      const data = await usersService.getTopSellers(3);
      setTopSellers(data);
    } catch (error: any) {
      console.error("Load top sellers error:", error);
    } finally {
      setIsTopSellersLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Chợ đó!
        </Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >

      {/* Top Sellers Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bảng xếp hạng
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/top-sellers")}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              Xem tất cả
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isTopSellersLoading ? (
          <View style={styles.topSellersLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View
            style={[
              styles.podiumWrapper,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.podiumContainer}>
              {/* Arrange as: 2nd, 1st, 3rd */}
              <View style={styles.podiumRow}>
                {/* 2nd Place */}
                {topSellers[1] && (
                  <View style={styles.podiumItem}>
                    <View style={styles.podiumAvatarContainer}>
                      {topSellers[1].avatarUrl ? (
                        <Image
                          source={{ uri: topSellers[1].avatarUrl }}
                          style={styles.podiumAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.podiumAvatarPlaceholder,
                            { backgroundColor: colors.border },
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={28}
                            color={colors.tertiary}
                          />
                        </View>
                      )}
                      <View style={[styles.podiumBadge, styles.secondBadge]}>
                        <Text style={styles.podiumBadgeText}>2</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.podiumName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {topSellers[1].fullName}
                    </Text>
                    <Text
                      style={[styles.podiumStats, { color: colors.secondary }]}
                    >
                      {topSellers[1].productCount} SP -{" "}
                      {topSellers[1].totalViews} Lượt xem
                    </Text>
                    <View
                      style={[
                        styles.podiumBase,
                        styles.secondPlace,
                        {
                          backgroundColor: colors.card,
                          borderColor: "#C0C0C0",
                        },
                      ]}
                    >
                      <Text style={styles.podiumMedal}>🥈</Text>
                    </View>
                  </View>
                )}

                {/* 1st Place */}
                {topSellers[0] && (
                  <View style={styles.podiumItem}>
                    <View style={styles.crownContainer}>
                      <Text style={styles.crown}>👑</Text>
                    </View>
                    <View style={styles.podiumAvatarContainer}>
                      {topSellers[0].avatarUrl ? (
                        <Image
                          source={{ uri: topSellers[0].avatarUrl }}
                          style={[styles.podiumAvatar, styles.firstAvatar]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.podiumAvatarPlaceholder,
                            styles.firstAvatar,
                            { backgroundColor: colors.border },
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={32}
                            color={colors.tertiary}
                          />
                        </View>
                      )}
                      <View style={[styles.podiumBadge, styles.firstBadge]}>
                        <Text style={styles.podiumBadgeText}>1</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.podiumName,
                        styles.firstPlaceName,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {topSellers[0].fullName}
                    </Text>
                    <Text
                      style={[styles.podiumStats, { color: colors.secondary }]}
                    >
                      {topSellers[0].productCount} SP -{" "}
                      {topSellers[0].totalViews} Lượt xem
                    </Text>
                    <View
                      style={[
                        styles.podiumBase,
                        styles.firstPlace,
                        {
                          backgroundColor: colors.card,
                          borderColor: "#FFD700",
                        },
                      ]}
                    >
                      <Text style={styles.podiumMedal}>🥇</Text>
                    </View>
                  </View>
                )}

                {/* 3rd Place */}
                {topSellers[2] && (
                  <View style={styles.podiumItem}>
                    <View style={styles.podiumAvatarContainer}>
                      {topSellers[2].avatarUrl ? (
                        <Image
                          source={{ uri: topSellers[2].avatarUrl }}
                          style={styles.podiumAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.podiumAvatarPlaceholder,
                            { backgroundColor: colors.border },
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={28}
                            color={colors.tertiary}
                          />
                        </View>
                      )}
                      <View style={[styles.podiumBadge, styles.thirdBadge]}>
                        <Text style={styles.podiumBadgeText}>3</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.podiumName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {topSellers[2].fullName}
                    </Text>
                    <Text
                      style={[styles.podiumStats, { color: colors.secondary }]}
                    >
                      {topSellers[2].productCount} SP -{" "}
                      {topSellers[2].totalViews} Lượt xem
                    </Text>
                    <View
                      style={[
                        styles.podiumBase,
                        styles.thirdPlace,
                        {
                          backgroundColor: colors.card,
                          borderColor: "#CD7F32",
                        },
                      ]}
                    >
                      <Text style={styles.podiumMedal}>🥉</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Categories Filter - Sticky */}
      <View
        style={[
          styles.categoriesWrapper,
          { backgroundColor: colors.screenBackground },
        ]}
      >
        <View style={styles.categoriesContainer}>
        {isCategoriesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {/* Tag "Tất cả" */}
            <TouchableOpacity
              style={[
                styles.categoryTag,
                {
                  backgroundColor:
                    selectedCategory === null ? colors.primary : colors.card,
                  borderColor:
                    selectedCategory === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  {
                    color:
                      selectedCategory === null ? "#fff" : colors.secondary,
                  },
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>

            {/* Categories từ API */}
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryTag,
                  {
                    backgroundColor:
                      selectedCategory === category._id
                        ? colors.primary
                        : colors.card,
                    borderColor:
                      selectedCategory === category._id
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category._id)}
              >
                <Ionicons
                  name="pricetag"
                  size={14}
                  color={
                    selectedCategory === category._id ? "#fff" : colors.tertiary
                  }
                />
                <Text
                  style={[
                    styles.categoryTagText,
                    {
                      color:
                        selectedCategory === category._id
                          ? "#fff"
                          : colors.secondary,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        </View>
      </View>

      <PostsList myPostsOnly={false} categoryId={selectedCategory} scrollEnabled={false} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/create-post")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  section: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  topSellersLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  podiumWrapper: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  podiumContainer: {
    paddingVertical: 10,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: "center",
    maxWidth: 110,
  },
  crownContainer: {
    marginBottom: 4,
  },
  crown: {
    fontSize: 24,
  },
  podiumAvatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#E0E0E0",
  },
  firstAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  podiumAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#E0E0E0",
  },
  podiumBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  firstBadge: {
    backgroundColor: "#FFD700",
  },
  secondBadge: {
    backgroundColor: "#C0C0C0",
  },
  thirdBadge: {
    backgroundColor: "#CD7F32",
  },
  podiumBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  firstPlaceName: {
    fontSize: 15,
    fontWeight: "700",
  },
  podiumStats: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: "center",
  },
  podiumBase: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    alignItems: "center",
    paddingTop: 8,
  },
  firstPlace: {
    height: 100,
  },
  secondPlace: {
    height: 80,
  },
  thirdPlace: {
    height: 60,
  },
  podiumMedal: {
    fontSize: 20,
  },
  topSellersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  medal: {
    fontSize: 24,
  },
  sellerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sellerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  sellerStats: {
    fontSize: 12,
  },
  categoriesWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoriesContainer: {
    paddingVertical: 0,
  },
  loadingContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import PostsList from "@/components/PostsList";
import * as categoriesService from "@/services/api/categories";
import * as usersService from "@/services/api/users";
import type { Category } from "@/types";
import type { TopSeller } from "@/services/api/users";
import { useNotifications } from "@/contexts/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const params = useLocalSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isTopSellersLoading, setIsTopSellersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsKey, setPostsKey] = useState(0);

  useEffect(() => {
    loadCategories();
    loadTopSellers();
  }, []);

  useEffect(() => {
    if (
      params.postDeleted === "true" ||
      params.postCreated === "true" ||
      params.postUpdated === "true"
    ) {
      setPostsKey((prev) => prev + 1);
      router.setParams({
        postDeleted: undefined,
        postCreated: undefined,
        postUpdated: undefined,
      });
    }
  }, [params.postDeleted, params.postCreated, params.postUpdated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadTopSellers()]);
    setRefreshing(false);
  };

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
      const data = await usersService.getTopSellers(5);
      setTopSellers(data);
    } catch (error: any) {
      console.error("Load top sellers error:", error);
    } finally {
      setIsTopSellersLoading(false);
    }
  };

  const renderTopCard = (seller: TopSeller, rank: number) => {
    const isFirst = rank === 1;
    const badgeColors: { [key: number]: [string, string] } = {
      1: ["#FFD700", "#FFA500"],
      2: ["#C0C0C0", "#A0A0A0"],
      3: ["#CD7F32", "#8B4513"],
    };
    const borderColors = {
      1: "#FFD700",
      2: "#C0C0C0",
      3: "#CD7F32",
    };

    return (
      <View
        style={[
          styles.topCard,
          isFirst && styles.topCardFirst,
          {
            borderColor: borderColors[rank as 1 | 2 | 3],
            backgroundColor: colors.card,
          },
        ]}
      >
        <LinearGradient
          colors={badgeColors[rank as 1 | 2 | 3]}
          style={styles.rankBadge}
        >
          {rank === 1 && (
            <Ionicons
              name="trophy"
              size={12}
              color="#fff"
              style={{ marginRight: 2 }}
            />
          )}
          <Text style={styles.rankText}>#{rank}</Text>
        </LinearGradient>

        <View
          style={[
            styles.avatarContainer,
            isFirst && styles.avatarContainerFirst,
          ]}
        >
          {seller.avatarUrl ? (
            <Image
              source={{ uri: seller.avatarUrl }}
              style={[styles.avatar, isFirst && styles.avatarFirst]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                isFirst && styles.avatarFirst,
                { backgroundColor: colors.border },
              ]}
            >
              <Ionicons
                name="person"
                size={isFirst ? 36 : 24}
                color={colors.tertiary}
              />
            </View>
          )}
        </View>

        <Text
          style={[
            styles.topCardName,
            isFirst && styles.topCardNameFirst,
            { color: colors.text },
          ]}
          numberOfLines={1}
        >
          {seller.fullName}
        </Text>

        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: colors.secondary }]}>
            {seller.productCount} SP
          </Text>
          <View
            style={[styles.statsDot, { backgroundColor: colors.tertiary }]}
          />
          <Text style={[styles.statsText, { color: colors.secondary }]}>
            {seller.totalViews} lượt xem
          </Text>
        </View>
      </View>
    );
  };

  const renderRunnerUpRow = (seller: TopSeller, rank: number) => {
    return (
      <View
        style={[
          styles.runnerUpRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.runnerUpRank, { backgroundColor: colors.border }]}>
          <Text style={[styles.runnerUpRankText, { color: colors.text }]}>
            #{rank}
          </Text>
        </View>

        {seller.avatarUrl ? (
          <Image
            source={{ uri: seller.avatarUrl }}
            style={styles.runnerUpAvatar}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.runnerUpAvatarPlaceholder,
              { backgroundColor: colors.border },
            ]}
          >
            <Ionicons name="person" size={20} color={colors.tertiary} />
          </View>
        )}

        <View style={styles.runnerUpInfo}>
          <Text
            style={[styles.runnerUpName, { color: colors.text }]}
            numberOfLines={1}
          >
            {seller.fullName}
          </Text>
          <Text style={[styles.runnerUpStats, { color: colors.secondary }]}>
            {seller.productCount} SP - {seller.totalViews} lượt xem
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Trang chủ
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
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
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {isTopSellersLoading ? (
            <View style={styles.topSellersLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View
              style={[
                styles.leaderboardWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Top 3 Podium Cards */}
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {topSellers[1] && renderTopCard(topSellers[1], 2)}
                {/* 1st Place */}
                {topSellers[0] && renderTopCard(topSellers[0], 1)}
                {/* 3rd Place */}
                {topSellers[2] && renderTopCard(topSellers[2], 3)}
              </View>

              {/* Runner-ups (4th & 5th) */}
              {topSellers.length > 3 && (
                <View style={styles.runnerUpsContainer}>
                  {topSellers[3] && renderRunnerUpRow(topSellers[3], 4)}
                  {topSellers[4] && renderRunnerUpRow(topSellers[4], 5)}
                </View>
              )}
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
                <TouchableOpacity
                  style={[
                    styles.categoryTag,
                    {
                      backgroundColor:
                        selectedCategory === null
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        selectedCategory === null
                          ? colors.primary
                          : colors.border,
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
                        selectedCategory === category._id
                          ? "#fff"
                          : colors.tertiary
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

        <PostsList
          key={postsKey}
          myPostsOnly={false}
          categoryId={selectedCategory}
          scrollEnabled={false}
        />
      </ScrollView>
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
    paddingVertical: 40,
    alignItems: "center",
  },

  leaderboardWrapper: {
    marginHorizontal: 20,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 8,
  },
  topCard: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    maxWidth: 110,
  },
  topCardFirst: {
    marginTop: -20,
    paddingVertical: 18,
    maxWidth: 150,
    padding: 14,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatarContainerFirst: {
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  avatarFirst: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  topCardName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  topCardNameFirst: {
    fontSize: 15,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statsText: {
    fontSize: 9,
  },
  statsDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },

  // Runner-up styles
  runnerUpsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  runnerUpRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  runnerUpRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  runnerUpRankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  runnerUpAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  runnerUpAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  runnerUpInfo: {
    flex: 1,
  },
  runnerUpName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  runnerUpStats: {
    fontSize: 12,
  },

  // Categories styles
  categoriesWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoriesContainer: {
    paddingVertical: 0,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginRight: 8,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

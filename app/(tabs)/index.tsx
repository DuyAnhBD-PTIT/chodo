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
  useWindowDimensions,
  Dimensions,
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
  const { width: screenWidth } = useWindowDimensions();

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
    setPostsKey((prev) => prev + 1);
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
    const scale = Math.min(screenWidth / 375, 1);
    const avatarSize = isFirst
      ? Math.floor(64 * scale)
      : Math.floor(48 * scale);
    const cardWidth = isFirst
      ? Math.floor(100 * scale)
      : Math.floor(80 * scale);
    const cardPadding = Math.floor(14 * scale);

    return (
      <View
        style={[
          styles.topCard,
          {
            width: cardWidth,
            paddingVertical: isFirst ? Math.floor(20 * scale) : cardPadding,
            backgroundColor: isFirst ? colors.primary + "15" : colors.card,
            borderColor: isFirst ? colors.primary : colors.border,
          },
        ]}
      >
        {isFirst && (
          <View style={styles.crown}>
            <Ionicons name="trophy" size={22} color="#FACC15" />
          </View>
        )}

        <Text style={[styles.rank, { color: colors.primary }]}>#{rank}</Text>

        {seller.avatarUrl ? (
          <Image
            source={{ uri: seller.avatarUrl }}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              marginBottom: 6,
            }}
          />
        ) : (
          <View
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Ionicons
              name="person"
              size={isFirst ? 36 : 24}
              color={colors.secondary}
            />
          </View>
        )}

        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {seller.fullName}
        </Text>

        <Text style={[styles.score, { color: colors.secondary }]}>
          {seller.totalViews} lượt xem
        </Text>
      </View>
    );
  };

  const renderRunnerUp = (seller: TopSeller, rank: number) => (
    <View
      style={[
        styles.runnerRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.runnerRank, { color: colors.text }]}>#{rank}</Text>

      {seller.avatarUrl ? (
        <Image
          source={{ uri: seller.avatarUrl }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 8,
          }}
        />
      ) : (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8,
          }}
        >
          <Ionicons name="person" size={20} color={colors.secondary} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          style={[styles.runnerName, { color: colors.text }]}
          numberOfLines={1}
        >
          {seller.fullName}
        </Text>
        <Text style={[styles.runnerStats, { color: colors.secondary }]}>
          {seller.productCount} SP • {seller.totalViews} lượt xem
        </Text>
      </View>
    </View>
  );

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

      {/* Main ScrollView */}
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
        {/* Leaderboard Section */}
        <View style={styles.leaderboardSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bảng xếp hạng
            </Text>
          </View>

          {isTopSellersLoading ? (
            <ActivityIndicator style={{ marginVertical: 40 }} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/top-sellers")}
            >
              <View
                style={[
                  styles.leaderboardWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.podium}>
                  {topSellers[1] && renderTopCard(topSellers[1], 2)}
                  {topSellers[0] && renderTopCard(topSellers[0], 1)}
                  {topSellers[2] && renderTopCard(topSellers[2], 3)}
                </View>

                <View style={styles.runnerList}>
                  {topSellers[3] && renderRunnerUp(topSellers[3], 4)}
                </View>
              </View>
            </TouchableOpacity>
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
  leaderboardSection: {
    paddingBottom: 16,
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
    marginHorizontal: 16,
    padding: 16,
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
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 4,
  },

  crown: {
    position: "absolute",
    top: -18,
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FACC15",
  },

  topCard: {
    flex: 1,
    maxWidth: 110,
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderWidth: 1,
  },

  rank: { fontWeight: "700", marginBottom: 6 },
  name: { fontWeight: "600", fontSize: 13 },
  score: { fontSize: 12 },

  runnerList: { marginTop: 12 },

  runnerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },

  runnerRank: { width: 32, fontWeight: "700", textAlign: "center" },
  runnerName: { fontWeight: "600" },
  runnerStats: { fontSize: 12 },
});

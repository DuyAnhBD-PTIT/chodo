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
import * as usersService from "@/services/api/users";
import type { TopSeller } from "@/services/api/users";

export default function TopSellersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopSellers();
  }, []);

  const loadTopSellers = async () => {
    try {
      const data = await usersService.getTopSellers(10);
      setTopSellers(data);
    } catch (error: any) {
      console.error("Load top sellers error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `${rank}`;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Bảng xếp hạng
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {topSellers.map((seller, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;

            return (
              <View
                key={seller.userId}
                style={[
                  styles.sellerCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  isTopThree && styles.topThreeCard,
                ]}
              >
                <View style={styles.rankContainer}>
                  {isTopThree ? (
                    <Text style={styles.medalText}>{getMedalIcon(rank)}</Text>
                  ) : (
                    <Text style={[styles.rankNumber, { color: colors.text }]}>
                      {rank}
                    </Text>
                  )}
                </View>

                <View style={styles.avatarContainer}>
                  {seller.avatarUrl ? (
                    <Image
                      source={{ uri: seller.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={24}
                        color={colors.tertiary}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.sellerInfo}>
                  <Text
                    style={[styles.sellerName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {seller.fullName}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="cube-outline"
                        size={14}
                        color={colors.secondary}
                      />
                      <Text
                        style={[styles.statText, { color: colors.secondary }]}
                      >
                        {seller.productCount} sản phẩm
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="eye-outline"
                        size={14}
                        color={colors.secondary}
                      />
                      <Text
                        style={[styles.statText, { color: colors.secondary }]}
                      >
                        {seller.totalViews} lượt xem
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  topThreeCard: {
    borderWidth: 2,
  },
  rankContainer: {
    width: 32,
    alignItems: "center",
  },
  medalText: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
});

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as postsService from "@/services/api/posts";
import * as conversationsService from "@/services/api/conversations";
import * as usersService from "@/services/api/users";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types";

const { width } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id, from } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [ratingSummary, setRatingSummary] =
    useState<usersService.PostRatingSummary | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const modalFlatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    try {
      // First, load post to check status
      const data = await postsService.getPostById(id as string, true);

      // Only increment view if status is approved
      if (data.status === "approved") {
        // Call the PATCH /api/posts/{id}/view endpoint BEFORE getting final data
        await postsService.incrementPostView(id as string);
      }

      // Load post data again to get updated view count
      const updatedData = await postsService.getPostById(id as string, true);
      setPost(updatedData);

      // Load post rating summary
      loadRatingSummary(updatedData._id);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tải bài đăng");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadRatingSummary = async (postId: string) => {
    try {
      setIsRatingLoading(true);
      // Fake data for UI testing
      const fakeData: usersService.PostRatingSummary = {
        ratings: [
          {
            stars: 5,
            comment:
              "Sản phẩm rất tốt, giống mô tả. Người bán nhiệt tình và giao hàng nhanh!",
            rater: {
              id: "user1",
              fullName: "Nguyễn Văn A",
              avatarUrl: null,
            },
            postId: id as string,
            createdAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            stars: 4,
            comment: "Tốt, nhưng giao hàng hơi chậm.",
            rater: {
              id: "user2",
              fullName: "Trần Thị B",
              avatarUrl: null,
            },
            postId: id as string,
            createdAt: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            stars: 5,
            comment: "Xuất sắc! Chất lượng vượt mong đợi. Sẽ mua lại.",
            rater: {
              id: "user3",
              fullName: "Lê Văn C",
              avatarUrl: null,
            },
            postId: id as string,
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      };
      setRatingSummary(fakeData);
      // Uncomment below to use real API
      // const data = await usersService.getPostRatingSummary(postId);
      // setRatingSummary(data);
    } catch (error: any) {
      console.error("Load rating summary error:", error);
      // Don't show error to user, just log it
    } finally {
      setIsRatingLoading(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        // Full star
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#FFB800" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Half star
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#FFB800" />
        );
      } else {
        // Empty star
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color="#FFB800" />
        );
      }
    }
    return stars;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentImageIndex(index);
  };

  const navigateImage = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev" ? currentImageIndex - 1 : currentImageIndex + 1;
    flatListRef.current?.scrollToOffset({
      offset: newIndex * width,
      animated: true,
    });
    setCurrentImageIndex(newIndex);
  };

  const openImageModal = () => {
    setIsImageModalVisible(true);
    // Scroll to current image in modal after a short delay
    setTimeout(() => {
      modalFlatListRef.current?.scrollToOffset({
        offset: currentImageIndex * width,
        animated: false,
      });
    }, 100);
  };

  const navigateModalImage = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev" ? currentImageIndex - 1 : currentImageIndex + 1;
    modalFlatListRef.current?.scrollToOffset({
      offset: newIndex * width,
      animated: true,
    });
    setCurrentImageIndex(newIndex);
  };

  const handleContactSeller = async () => {
    if (!post || !user) return;

    try {
      setIsCreatingConversation(true);

      const conversation = await conversationsService.createConversation({
        receiverId: post.user.id,
        postId: post._id,
      });

      // Navigate to conversation detail
      router.push(`/conversation/${conversation._id}`);
    } catch (error: any) {
      console.error("Create conversation error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo cuộc trò chuyện");
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleEditPost = () => {
    router.push(`/edit-post/${id}?from=${from || "home"}`);
  };

  const handleDeletePost = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await postsService.deletePost(id as string);
              Alert.alert("Thành công", "Đã xóa bài đăng thành công", [
                {
                  text: "OK",
                  onPress: () => {
                    // Navigate back with postDeleted flag
                    if (from === "profile") {
                      router.replace("/(tabs)/profile?postDeleted=true");
                    } else {
                      router.replace("/(tabs)?postDeleted=true");
                    }
                  },
                },
              ]);
            } catch (error: any) {
              console.error("Delete post error:", error);
              Alert.alert("Lỗi", error.message || "Không thể xóa bài đăng");
            }
          },
        },
      ]
    );
  };

  const isOwner = user && post && post.user.id === user._id;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return null;
  }

  const images = post.images || [];
  const hasImages = images.length > 0;
  const isFirstImage = currentImageIndex === 0;
  const isLastImage = currentImageIndex === images.length - 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Floating Back Button */}
      <View style={styles.floatingBackContainer}>
        <TouchableOpacity
          style={[styles.floatingBackButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.floatingBackText, { color: colors.text }]}>
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {hasImages ? (
            <>
              <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={openImageModal}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.mainImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              />
              {/* Image Counter */}
              <View
                style={[
                  styles.imageCounter,
                  { backgroundColor: "rgba(0,0,0,0.6)" },
                ]}
              >
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{images.length}
                </Text>
              </View>

              {/* Image Navigation Arrows */}
              {images.length > 1 && (
                <View style={styles.imageNav}>
                  {!isFirstImage && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.navButtonLeft]}
                      onPress={() => navigateImage("prev")}
                    >
                      <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {!isLastImage && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.navButtonRight]}
                      onPress={() => navigateImage("next")}
                    >
                      <Ionicons name="chevron-forward" size={28} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : (
            <Image
              source={{ uri: "https://via.placeholder.com/400x300" }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Content Section */}
        <View style={[styles.contentSection, { backgroundColor: colors.card }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {post.title}
          </Text>

          {/* Price */}
          <Text style={[styles.price, { color: colors.error }]}>
            {formatPrice(post.price)}
          </Text>

          {/* Info Row - Quantity, Category, Condition */}
          <View style={styles.infoRow}>
            {/* Quantity */}
            {post.quantity !== undefined && (
              <>
                {post.quantity === 0 ? (
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: colors.error + "15" },
                    ]}
                  >
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text
                      style={[styles.infoBadgeText, { color: colors.error }]}
                    >
                      Bán hết
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.infoBadge,
                      { backgroundColor: colors.secondary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={14}
                      color={colors.secondary}
                    />
                    <Text
                      style={[
                        styles.infoBadgeText,
                        { color: colors.secondary },
                      ]}
                    >
                      SL: {post.quantity}
                    </Text>
                  </View>
                )}
              </>
            )}
            {/* Category */}
            {post.category && (
              <View
                style={[
                  styles.infoBadge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="pricetag" size={14} color={colors.primary} />
                <Text style={[styles.infoBadgeText, { color: colors.primary }]}>
                  {post.category.name}
                </Text>
              </View>
            )}
            {/* Condition - Different styles for new vs used */}
            {post.condition === "new" ? (
              <View
                style={[
                  styles.infoBadge,
                  styles.conditionBadgeNew,
                  { backgroundColor: colors.success + "20" },
                ]}
              >
                <Ionicons name="sparkles" size={14} color={colors.success} />
                <Text
                  style={[
                    styles.infoBadgeText,
                    styles.conditionTextNew,
                    { color: colors.success },
                  ]}
                >
                  MỚI
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.infoBadge,
                  styles.conditionBadgeUsed,
                  {
                    backgroundColor: colors.tertiary + "15",
                    borderColor: colors.tertiary + "40",
                  },
                ]}
              >
                <Ionicons
                  name="refresh-outline"
                  size={14}
                  color={colors.tertiary}
                />
                <Text
                  style={[styles.infoBadgeText, { color: colors.tertiary }]}
                >
                  Đã qua sử dụng
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {post.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Mô tả
              </Text>
              <Text style={[styles.description, { color: colors.secondary }]}>
                {post.description}
              </Text>
            </View>
          )}

          {/* Seller Info */}
          {post.user && (
            <View
              style={[
                styles.section,
                styles.sellerSection,
                { backgroundColor: colors.screenBackground },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Người đăng
              </Text>
              <View style={styles.sellerInfo}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  {post.user.avatarUrl ? (
                    <Image
                      source={{ uri: post.user.avatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text
                      style={[styles.avatarText, { color: colors.primary }]}
                    >
                      {post.user.fullName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={[styles.sellerName, { color: colors.text }]}>
                    {post.user.fullName}
                  </Text>
                  <Text
                    style={[styles.sellerLabel, { color: colors.tertiary }]}
                  >
                    Thành viên
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <View style={styles.additionalInfo}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.secondary}
                />
                <Text
                  style={[styles.infoItemText, { color: colors.secondary }]}
                >
                  {formatDate(post.createdAt)}
                </Text>
              </View>
              {post.views !== undefined && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={colors.secondary}
                  />
                  <Text
                    style={[styles.infoItemText, { color: colors.secondary }]}
                  >
                    {post.views} lượt xem
                  </Text>
                </View>
              )}
              {(post.address || post.TinhThanh || post.XaPhuong) && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.secondary}
                  />
                  <Text
                    style={[styles.infoItemText, { color: colors.secondary }]}
                  >
                    {[post.address, post.XaPhuong, post.TinhThanh]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Rating Section */}
          {!isRatingLoading &&
            ratingSummary &&
            (() => {
              const totalRatings = ratingSummary.ratings.length;
              const averageRating =
                totalRatings > 0
                  ? ratingSummary.ratings.reduce((sum, r) => sum + r.stars, 0) /
                    totalRatings
                  : 0;

              return (
                <View style={[styles.section, styles.ratingSection]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Đánh giá & Nhận xét
                  </Text>

                  {/* Rating Summary */}
                  <View
                    style={[
                      styles.ratingSummary,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    {totalRatings === 0 ? (
                      <View style={styles.noRatingContainer}>
                        <Ionicons
                          name="star-outline"
                          size={48}
                          color={colors.tertiary}
                        />
                        <Text
                          style={[
                            styles.noRatingText,
                            { color: colors.secondary },
                          ]}
                        >
                          Hãy là người đánh giá đầu tiên
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.ratingNumberContainer}>
                          <Text
                            style={[
                              styles.ratingNumber,
                              { color: colors.text },
                            ]}
                          >
                            {averageRating.toFixed(1)}
                          </Text>
                          <View style={styles.starsRow}>
                            {renderStars(averageRating, 20)}
                          </View>
                          <Text
                            style={[
                              styles.totalRatingsText,
                              { color: colors.secondary },
                            ]}
                          >
                            {totalRatings} đánh giá
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Rating List */}
                  {ratingSummary.ratings.length > 0 && (
                    <View style={styles.ratingsListContainer}>
                      {ratingSummary.ratings.map((rating, index) => (
                        <View
                          key={index}
                          style={[
                            styles.ratingItem,
                            {
                              backgroundColor: colors.card,
                              borderBottomColor: colors.border,
                            },
                          ]}
                        >
                          <View style={styles.ratingHeader}>
                            <View style={styles.ratingHeaderInfo}>
                              <View style={styles.ratingNameStarsRow}>
                                <Text
                                  style={[
                                    styles.raterName,
                                    { color: colors.text },
                                  ]}
                                >
                                  {rating.rater.fullName}
                                </Text>
                                <View style={styles.starsRow}>
                                  {renderStars(rating.stars, 14)}
                                </View>
                              </View>
                              <Text
                                style={[
                                  styles.ratingDate,
                                  { color: colors.tertiary },
                                ]}
                              >
                                {new Date(rating.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </Text>
                            </View>
                          </View>
                          {rating.comment && (
                            <Text
                              style={[
                                styles.ratingComment,
                                { color: colors.secondary },
                              ]}
                            >
                              {rating.comment}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={handleDeletePost}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleEditPost}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.contactButton,
              { backgroundColor: colors.primary },
              isCreatingConversation && { opacity: 0.6 },
            ]}
            onPress={handleContactSeller}
            disabled={isCreatingConversation}
          >
            {isCreatingConversation ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.contactButtonText}>Liên hệ người bán</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar hidden />
          {/* Close Button */}
          <SafeAreaView style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsImageModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalCounter}>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </SafeAreaView>

          {/* Full Screen Images */}
          <FlatList
            ref={modalFlatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {/* Navigation Arrows in Modal */}
          {images.length > 1 && (
            <View style={styles.modalImageNav}>
              {!isFirstImage && (
                <TouchableOpacity
                  style={[styles.modalNavButton, styles.navButtonLeft]}
                  onPress={() => navigateModalImage("prev")}
                >
                  <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
              )}
              {!isLastImage && (
                <TouchableOpacity
                  style={[styles.modalNavButton, styles.navButtonRight]}
                  onPress={() => navigateModalImage("next")}
                >
                  <Ionicons name="chevron-forward" size={32} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBackContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
  },
  floatingBackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingBackText: {
    fontSize: 15,
    fontWeight: "600",
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
  imageSection: {
    position: "relative",
  },
  mainImage: {
    width: width,
    height: width * 0.75,
    backgroundColor: "#f0f0f0",
  },
  imageCounter: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  imageNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  navButtonLeft: {
    position: "absolute",
    left: 16,
  },
  navButtonRight: {
    position: "absolute",
    right: 16,
  },
  contentSection: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 30,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  conditionBadgeNew: {
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  conditionTextNew: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  conditionBadgeUsed: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  sellerSection: {
    padding: 16,
    borderRadius: 12,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
  },
  sellerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  sellerLabel: {
    fontSize: 13,
  },
  ratingSection: {
    marginTop: 8,
  },
  ratingSummary: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  noRatingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noRatingText: {
    fontSize: 15,
    marginTop: 12,
    fontWeight: "500",
  },
  ratingNumberContainer: {
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  totalRatingsText: {
    fontSize: 14,
  },
  ratingsListContainer: {
    gap: 12,
  },
  ratingItem: {
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  ratingHeader: {
    marginBottom: 12,
  },
  ratingHeaderInfo: {
    flex: 1,
  },
  ratingNameStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  raterName: {
    fontSize: 15,
    fontWeight: "600",
  },
  ratingDate: {
    fontSize: 12,
  },
  ratingComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  additionalInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoItemText: {
    fontSize: 14,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
  },
  ownerActions: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCounter: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalImageContainer: {
    width: width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: "100%",
  },
  modalImageNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    pointerEvents: "box-none",
  },
  modalNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});

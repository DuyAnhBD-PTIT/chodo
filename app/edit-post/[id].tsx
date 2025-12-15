import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as postsService from "@/services/api/posts";
import * as categoriesService from "@/services/api/categories";
import type { PostCondition, Category, Post } from "@/types";

export default function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rawPrice, setRawPrice] = useState("");
  const [condition, setCondition] = useState<PostCondition>("new");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [address, setAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isPostLoading, setIsPostLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const data = await postsService.getPostById(id as string);

      setTitle(data.title);
      setDescription(data.description || "");
      setRawPrice(data.price.toString());
      setPrice(formatPrice(data.price.toString()));
      setCondition(data.condition);
      setAddress(data.address || "");

      // Set images from post
      const imageUrls = data.images.map((img) => img.imageUrl);
      setImages(imageUrls);
      setOriginalImages(imageUrls);
      setNewImages([]);

      // Find and set category
      const categories = await categoriesService.getCategories();
      const category = categories.find((cat) => cat._id === data.category.id);
      if (category) {
        setSelectedCategory(category);
      }
    } catch (error: any) {
      console.error("Load post error:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin bài đăng");
      router.back();
    } finally {
      setIsPostLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      const activeCategories = data.filter((cat) => cat.isActive);
      setCategories(activeCategories);
    } catch (error: any) {
      console.error("Load categories error:", error);
      Alert.alert("Lỗi", "Không thể tải danh mục");
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập",
          "Cần cấp quyền truy cập thư viện ảnh để chọn ảnh"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const currentTotal = images.length;
        const availableSlots = 5 - currentTotal;

        if (availableSlots <= 0) {
          Alert.alert("Giới hạn", "Chỉ được tải tối đa 5 ảnh");
          return;
        }

        const uris = result.assets
          .map((asset) => asset.uri)
          .slice(0, availableSlots);
        setImages((prev) => [...prev, ...uris]);
        setNewImages((prev) => [...prev, ...uris]);

        if (result.assets.length > availableSlots) {
          Alert.alert(
            "Thông báo",
            `Chỉ thêm được ${availableSlots} ảnh do giới hạn tối đa 5 ảnh`
          );
        }
      }
    } catch (error) {
      console.error("Pick images error:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];

    // Remove from images array
    setImages((prev) => prev.filter((_, i) => i !== index));

    // Remove from newImages if it's a new image
    if (newImages.includes(imageToRemove)) {
      setNewImages((prev) => prev.filter((img) => img !== imageToRemove));
    }
    // Remove from originalImages if it's an original image
    if (originalImages.includes(imageToRemove)) {
      setOriginalImages((prev) => prev.filter((img) => img !== imageToRemove));
    }
  };

  const formatPrice = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, "");

    if (numbersOnly === "") {
      return "";
    }

    return new Intl.NumberFormat("vi-VN").format(Number(numbersOnly));
  };

  const handlePriceChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, "");

    setRawPrice(numbersOnly);
    setPrice(formatPrice(numbersOnly));
  };

  const handleClose = () => {
    Alert.alert(
      "Xác nhận thoát",
      "Bạn có chắc chắn muốn thoát? Các thay đổi chưa lưu sẽ bị mất.",
      [
        {
          text: "Tiếp tục chỉnh sửa",
          style: "cancel",
        },
        {
          text: "Thoát",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề");
      return false;
    }
    if (!rawPrice || Number(rawPrice) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ");
      return false;
    }
    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục");
      return false;
    }
    if (images.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 ảnh");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const updateData = {
        title: title.trim(),
        description: description.trim(),
        price: Number(rawPrice),
        condition,
        categoryId: selectedCategory!._id,
        categoryName: selectedCategory!.name,
        address: address.trim(),
        imageUris: images, // Gửi tất cả ảnh hiện tại (cả cũ và mới)
      };

      await postsService.updatePost(id as string, updateData);

      Alert.alert("Thành công", "Đã cập nhật bài đăng thành công", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Update post error:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật bài đăng");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPostLoading) {
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          disabled={isLoading}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Chỉnh sửa bài đăng
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Tiêu đề <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Nhập tiêu đề bài đăng"
            placeholderTextColor={colors.tertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Mô tả</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Mô tả chi tiết về sản phẩm..."
            placeholderTextColor={colors.tertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Giá <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Nhập giá (VNĐ)"
            placeholderTextColor={colors.tertiary}
            value={price}
            onChangeText={handlePriceChange}
            keyboardType="numeric"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Danh mục <Text style={{ color: colors.error }}>*</Text>
          </Text>
          {isCategoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.tertiary }]}>
                Đang tải danh mục...
              </Text>
            </View>
          ) : categories.length === 0 ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Không có danh mục nào
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor:
                        selectedCategory?._id === category._id
                          ? colors.primary + "20"
                          : colors.card,
                      borderColor:
                        selectedCategory?._id === category._id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Ionicons
                    name="pricetag"
                    size={20}
                    color={
                      selectedCategory?._id === category._id
                        ? colors.primary
                        : colors.tertiary
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          selectedCategory?._id === category._id
                            ? colors.primary
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

        {/* Condition */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Tình trạng <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={styles.conditionRow}>
            <TouchableOpacity
              style={[
                styles.conditionButton,
                condition === "new" && {
                  backgroundColor: colors.primary + "20",
                  borderColor: colors.primary,
                },
                { borderColor: colors.border },
              ]}
              onPress={() => setCondition("new")}
            >
              <Ionicons
                name={
                  condition === "new" ? "radio-button-on" : "radio-button-off"
                }
                size={20}
                color={condition === "new" ? colors.primary : colors.tertiary}
              />
              <Text
                style={[
                  styles.conditionText,
                  {
                    color:
                      condition === "new" ? colors.primary : colors.secondary,
                  },
                ]}
              >
                Mới
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.conditionButton,
                condition === "used" && {
                  backgroundColor: colors.primary + "20",
                  borderColor: colors.primary,
                },
                { borderColor: colors.border },
              ]}
              onPress={() => setCondition("used")}
            >
              <Ionicons
                name={
                  condition === "used" ? "radio-button-on" : "radio-button-off"
                }
                size={20}
                color={condition === "used" ? colors.primary : colors.tertiary}
              />
              <Text
                style={[
                  styles.conditionText,
                  {
                    color:
                      condition === "used" ? colors.primary : colors.secondary,
                  },
                ]}
              >
                Đã dùng
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Địa chỉ</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Nhập địa chỉ"
            placeholderTextColor={colors.tertiary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Hình ảnh <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={28} color="red" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={[
                  styles.addImageButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={pickImages}
              >
                <Ionicons name="camera" size={32} color={colors.tertiary} />
                <Text style={[styles.addImageText, { color: colors.tertiary }]}>
                  {images.length === 0 ? "Thêm ảnh" : `${images.length}/5`}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            isLoading && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Cập nhật</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  priceHelper: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: "italic",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imagesScroll: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  imageItem: {
    marginRight: 12,
    position: "relative",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#fff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    padding: 16,
  },
  categoriesScroll: {
    flexDirection: "row",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  conditionRow: {
    flexDirection: "row",
    gap: 12,
  },
  conditionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  conditionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 32,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

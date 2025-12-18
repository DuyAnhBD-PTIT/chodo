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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as postsService from "@/services/api/posts";
import * as categoriesService from "@/services/api/categories";
import type { PostCondition, Category } from "@/types";
import LocationSelector, {
  Province,
  District,
} from "@/components/LocationSelector";

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rawPrice, setRawPrice] = useState(""); // Giá trị thô không format
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState<PostCondition>("new");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [specificAddress, setSpecificAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Error states
  const [titleError, setTitleError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [imagesError, setImagesError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      // Chỉ lấy categories active
      const activeCategories = data.filter((cat) => cat.isActive);
      setCategories(activeCategories);
    } catch (error: any) {
      console.error("Load categories error:", error);
      setGeneralError("Không thể tải danh mục");
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleProvinceChange = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null); // Reset district when province changes
    setLocationError("");
  };

  const handleDistrictChange = (district: District) => {
    setSelectedDistrict(district);
    setLocationError("");
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setImagesError("Cần cấp quyền truy cập thư viện ảnh để chọn ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const uris = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...uris].slice(0, 5));
        setImagesError("");
      }
    } catch (error) {
      console.error("Pick images error:", error);
      setImagesError("Không thể chọn ảnh");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const hasUnsavedChanges = () => {
    return (
      title.trim() !== "" ||
      description.trim() !== "" ||
      price.trim() !== "" ||
      quantity !== "1" ||
      selectedCategory !== null ||
      selectedProvince !== null ||
      selectedDistrict !== null ||
      specificAddress.trim() !== "" ||
      images.length > 0
    );
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        "Xác nhận thoát",
        "Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát?",
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
    } else {
      router.back();
    }
  };

  const formatPrice = (value: string) => {
    // Loại bỏ tất cả ký tự không phải số
    const numbersOnly = value.replace(/[^0-9]/g, "");

    if (numbersOnly === "") {
      return "";
    }

    // Format với dấu phẩy ngăn cách hàng nghìn
    return new Intl.NumberFormat("vi-VN").format(Number(numbersOnly));
  };

  const handlePriceChange = (text: string) => {
    // Loại bỏ tất cả ký tự không phải số
    const numbersOnly = text.replace(/[^0-9]/g, "");

    setRawPrice(numbersOnly);
    setPrice(formatPrice(numbersOnly));
    setPriceError("");
  };

  const handleQuantityChange = (text: string) => {
    // Chỉ cho phép số
    const numbersOnly = text.replace(/[^0-9]/g, "");
    setQuantity(numbersOnly);
    setQuantityError("");
  };

  const validateForm = () => {
    let isValid = true;

    // Reset all errors
    setTitleError("");
    setPriceError("");
    setQuantityError("");
    setCategoryError("");
    setImagesError("");

    if (!title.trim()) {
      setTitleError("Vui lòng nhập tiêu đề");
      isValid = false;
    }

    if (!rawPrice || Number(rawPrice) <= 0) {
      setPriceError("Vui lòng nhập giá hợp lệ");
      isValid = false;
    }

    if (!quantity || Number(quantity) <= 0) {
      setQuantityError("Vui lòng nhập số lượng hợp lệ");
      isValid = false;
    }

    if (!selectedCategory) {
      setCategoryError("Vui lòng chọn danh mục");
      isValid = false;
    }

    if (images.length === 0) {
      setImagesError("Vui lòng chọn ít nhất 1 ảnh");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setGeneralError("");

      // Build address string from location
      let fullAddress = "";
      if (specificAddress) {
        fullAddress = specificAddress;
        if (selectedDistrict) {
          fullAddress += `, ${selectedDistrict.name}`;
        }
        if (selectedProvince) {
          fullAddress += `, ${selectedProvince.name}`;
        }
      }

      const postData = {
        title: title.trim(),
        description: description.trim(),
        price: Number(rawPrice),
        quantity: Number(quantity),
        condition,
        categoryId: selectedCategory!._id,
        categoryName: selectedCategory!.name,
        address: fullAddress,
        imageUris: images,
      };

      await postsService.createPost(postData);
      // Navigate to profile with postCreated flag
      router.replace("/(tabs)/profile?postCreated=true");
    } catch (error: any) {
      console.error("Create post error:", error);
      setGeneralError(error.message || "Không thể tạo bài đăng");
    } finally {
      setIsLoading(false);
    }
  };

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
          Tạo bài đăng
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* General Error */}
        {generalError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.error + "20" },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>
              {generalError}
            </Text>
          </View>
        ) : null}

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Tiêu đề <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
              titleError && { borderColor: colors.error, borderWidth: 1 },
            ]}
            placeholder="Nhập tiêu đề bài đăng"
            placeholderTextColor={colors.tertiary}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setTitleError("");
            }}
            maxLength={100}
          />
          {titleError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {titleError}
            </Text>
          ) : null}
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

        {/* Price and Quantity Row */}
        <View style={styles.section}>
          <View style={styles.rowInputs}>
            {/* Price */}
            <View style={styles.rowInputItem}>
              <Text style={[styles.label, { color: colors.text }]}>
                Giá <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text },
                  priceError && { borderColor: colors.error, borderWidth: 1 },
                ]}
                placeholder="Nhập giá (VNĐ)"
                placeholderTextColor={colors.tertiary}
                value={price}
                onChangeText={handlePriceChange}
                keyboardType="numeric"
              />
              {priceError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {priceError}
                </Text>
              ) : null}
            </View>

            {/* Quantity */}
            <View style={styles.rowInputItemSmall}>
              <Text style={[styles.label, { color: colors.text }]}>
                Số lượng <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text },
                  quantityError && {
                    borderColor: colors.error,
                    borderWidth: 1,
                  },
                ]}
                placeholder="Số lượng"
                placeholderTextColor={colors.tertiary}
                value={quantity}
                onChangeText={handleQuantityChange}
                keyboardType="numeric"
              />
              {quantityError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {quantityError}
                </Text>
              ) : null}
            </View>
          </View>
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
                  onPress={() => {
                    setSelectedCategory(category);
                    setCategoryError("");
                  }}
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
          {categoryError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {categoryError}
            </Text>
          ) : null}
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
                Đã qua sử dụng
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <LocationSelector
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            onProvinceChange={handleProvinceChange}
            onDistrictChange={handleDistrictChange}
            provinceError={locationError}
          />
        </View>

        {/* Specific Address */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Địa chỉ</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Số nhà, tên đường..."
            placeholderTextColor={colors.tertiary}
            value={specificAddress}
            onChangeText={setSpecificAddress}
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
          {imagesError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {imagesError}
            </Text>
          ) : null}
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
              <Text style={styles.submitButtonText}>Đăng bài</Text>
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  rowInputItem: {
    flex: 0.7,
  },
  rowInputItemSmall: {
    flex: 0.3,
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

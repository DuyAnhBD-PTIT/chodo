import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as categoriesService from "@/services/categories";
import * as postsService from "@/services/posts";
import type { Category } from "@/types";
import { PostCondition } from "@/types";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { Plus, X } from "lucide-react-native";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface CreatePostSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface CreatePostSheetProps {
  onPostCreated?: () => void;
}

const CreatePostSheet = forwardRef<CreatePostSheetRef, CreatePostSheetProps>(
  ({ onPostCreated }, ref) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [condition, setCondition] = useState<PostCondition>("used");
    const [address, setAddress] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasUnsavedChanges = () => {
      return (
        title.trim() !== "" ||
        description.trim() !== "" ||
        price.trim() !== "" ||
        address.trim() !== "" ||
        categoryId !== "" ||
        images.length > 0
      );
    };

    const handleClose = () => {
      if (hasUnsavedChanges()) {
        Alert.alert(
          "Bạn có thay đổi chưa lưu",
          "Bạn có chắc muốn thoát? Bài đăng sẽ không được lưu.",
          [
            { text: "Tiếp tục chỉnh sửa", style: "cancel" },
            {
              text: "Thoát",
              style: "destructive",
              onPress: () => {
                resetForm();
                bottomSheetRef.current?.close();
              },
            },
          ]
        );
      } else {
        bottomSheetRef.current?.close();
      }
    };

    const snapPoints = useMemo(() => ["90%"], []);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.expand(),
      dismiss: () => bottomSheetRef.current?.close(),
    }));

    // Load categories
    useEffect(() => {
      loadCategories();
    }, []);

    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const data = await categoriesService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Load categories error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Pick images
    const pickImages = async () => {
      if (images.length >= 10) {
        Alert.alert("Giới hạn", "Chỉ được upload tối đa 10 ảnh");
        return;
      }

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập",
          "Cần cấp quyền truy cập thư viện ảnh để upload"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - images.length,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);
      }
    };

    // Remove image
    const removeImage = (index: number) => {
      setImages(images.filter((_, i) => i !== index));
    };

    // Reset form
    const resetForm = () => {
      setTitle("");
      setDescription("");
      setPrice("");
      setCondition("used");
      setAddress("");
      setCategoryId("");
      setImages([]);
    };

    // Submit form
    const handleSubmit = async () => {
      // Validation
      if (!title.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tiêu đề");
        return;
      }
      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ");
        return;
      }
      if (!categoryId) {
        Alert.alert("Lỗi", "Vui lòng chọn danh mục");
        return;
      }
      if (images.length === 0) {
        Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 ảnh");
        return;
      }

      try {
        setIsSubmitting(true);

        const imageUrls = images;

        // Get category name
        const selectedCategory = categories.find((c) => c._id === categoryId);

        const postData = {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          condition,
          categoryId,
          categoryName: selectedCategory?.name || "",
          address: address.trim(),
          images: imageUrls,
        };

        console.log("Creating post with data:", postData);

        await postsService.createPost(postData);

        Alert.alert("Thành công", "Đã tạo bài đăng mới", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              bottomSheetRef.current?.close();
              onPostCreated?.();
            },
          },
        ]);
      } catch (error: any) {
        console.error("Create post error:", error);
        Alert.alert(
          "Lỗi",
          error.message || "Không thể tạo bài đăng. Vui lòng thử lại."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={(index) => {
          if (index === -1) {
            handleClose();
          }
        }}
        backgroundStyle={{
          backgroundColor: colors.cardBackground,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
        }}
      >
        <BottomSheetScrollView
          style={[styles.container, { backgroundColor: colors.cardBackground }]}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Đăng bài mới
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Tiêu đề <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.screenBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Nhập tiêu đề bài đăng..."
                placeholderTextColor={colors.tertiary}
                value={title}
                onChangeText={setTitle}
                editable={!isSubmitting}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Mô tả</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.screenBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Nhập mô tả chi tiết..."
                placeholderTextColor={colors.tertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            {/* Price */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Giá (VNĐ) <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.screenBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={colors.tertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>

            {/* Condition */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Tình trạng <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={styles.conditionButtons}>
                <TouchableOpacity
                  style={[
                    styles.conditionButton,
                    {
                      backgroundColor:
                        condition === "new"
                          ? colors.primary
                          : colors.screenBackground,
                      borderColor:
                        condition === "new" ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCondition("new")}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      {
                        color: condition === "new" ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    Mới
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.conditionButton,
                    {
                      backgroundColor:
                        condition === "used"
                          ? colors.primary
                          : colors.screenBackground,
                      borderColor:
                        condition === "used" ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCondition("used")}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      {
                        color: condition === "used" ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    Đã sử dụng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Địa chỉ
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.screenBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Nhập địa chỉ..."
                placeholderTextColor={colors.tertiary}
                value={address}
                onChangeText={setAddress}
                editable={!isSubmitting}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Danh mục <Text style={{ color: colors.error }}>*</Text>
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryTag,
                        {
                          backgroundColor:
                            categoryId === category._id
                              ? colors.primary
                              : colors.screenBackground,
                          borderColor:
                            categoryId === category._id
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setCategoryId(category._id)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.categoryTagText,
                          {
                            color:
                              categoryId === category._id
                                ? "#fff"
                                : colors.text,
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

            {/* Images */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Hình ảnh ({images.length}/10){" "}
                <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesList}
              >
                {/* Upload button */}
                {images.length < 10 && (
                  <TouchableOpacity
                    style={[
                      styles.imageUploadButton,
                      {
                        backgroundColor: colors.screenBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={pickImages}
                    disabled={isSubmitting}
                  >
                    <Plus size={32} color={colors.tertiary} />
                  </TouchableOpacity>
                )}

                {/* Image previews */}
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={[
                        styles.imageRemoveButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Đăng bài</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

CreatePostSheet.displayName = "CreatePostSheet";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  conditionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  conditionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoriesList: {
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  imagesList: {
    gap: 12,
  },
  imageUploadButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imageRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CreatePostSheet;

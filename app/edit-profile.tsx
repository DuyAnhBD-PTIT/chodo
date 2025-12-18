import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as usersService from "@/services/api/users";
import LocationSelector, {
  Province,
  District,
} from "@/components/LocationSelector";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser, updateUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [gender, setGender] = useState<string>(user?.gender || "");
  const [address, setAddress] = useState(user?.address || "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.DateOfBirth || "");
  const [avatarUri, setAvatarUri] = useState<string>(user?.avatarUrl || "");

  // Date inputs
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Location
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load initial province/district from user data
    const loadInitialLocation = async () => {
      if (user?.TinhThanh) {
        try {
          const response = await fetch(
            "https://provinces.open-api.vn/api/v2/p/"
          );
          const provincesData = await response.json();
          const province = provincesData.find(
            (p: Province) => p.name === user.TinhThanh
          );
          if (province) {
            setSelectedProvince(province);

            // Load districts for the province
            if (user?.XaPhuong) {
              const districtResponse = await fetch(
                `https://provinces.open-api.vn/api/v2/p/${province.code}?depth=2`
              );
              const provinceData = await districtResponse.json();
              const district = provinceData.districts?.find(
                (d: District) => d.name === user.XaPhuong
              );
              if (district) {
                setSelectedDistrict(district);
              }
            }
          }
        } catch (error) {
          console.error("Error loading location data:", error);
        }
      }
    };

    loadInitialLocation();

    // Parse existing date
    if (user?.DateOfBirth) {
      const date = new Date(user.DateOfBirth);
      setDay(String(date.getDate()).padStart(2, "0"));
      setMonth(String(date.getMonth() + 1).padStart(2, "0"));
      setYear(String(date.getFullYear()));
    }
  }, []);

  const handleProvinceChange = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null); // Reset district when province changes
  };

  const handleDistrictChange = (district: District) => {
    setSelectedDistrict(district);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Pick image error:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Build date string
      let formattedDate = "";
      if (day && month && year) {
        formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      }

      const updateData: any = {
        fullName: fullName.trim(),
        gender: gender || undefined,
        address: address.trim() || undefined,
        TinhThanh: selectedProvince?.name || undefined,
        XaPhuong: selectedDistrict?.name || undefined,
        DateOfBirth: formattedDate || undefined,
      };

      // Handle avatar upload if changed
      if (avatarUri && avatarUri !== user?.avatarUrl) {
        updateData.avatarUri = avatarUri;
      }

      await usersService.updateUser(updateData);

      // Fetch updated user data from API and update context
      const updatedUserData = await usersService.getUserById(user!._id);
      await updateUser(updatedUserData);

      Alert.alert("Thành công", "Cập nhật thông tin thành công", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Update error:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật thông tin");
    } finally {
      setIsSaving(false);
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Chỉnh sửa thông tin
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {fullName?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.avatarEditButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Họ và tên</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Nhập họ và tên"
            placeholderTextColor={colors.tertiary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Giới tính</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                {
                  backgroundColor:
                    gender === "Nam" ? colors.primary + "20" : colors.card,
                  borderColor:
                    gender === "Nam" ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setGender("Nam")}
            >
              <Text
                style={[
                  styles.genderText,
                  { color: gender === "Nam" ? colors.primary : colors.text },
                ]}
              >
                Nam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderOption,
                {
                  backgroundColor:
                    gender === "Nữ" ? colors.primary + "20" : colors.card,
                  borderColor: gender === "Nữ" ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setGender("Nữ")}
            >
              <Text
                style={[
                  styles.genderText,
                  { color: gender === "Nữ" ? colors.primary : colors.text },
                ]}
              >
                Nữ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Ngày sinh</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[
                styles.dateInput,
                { backgroundColor: colors.card, color: colors.text },
              ]}
              placeholder="DD"
              placeholderTextColor={colors.tertiary}
              value={day}
              onChangeText={setDay}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={[styles.dateSeparator, { color: colors.text }]}>
              /
            </Text>
            <TextInput
              style={[
                styles.dateInput,
                { backgroundColor: colors.card, color: colors.text },
              ]}
              placeholder="MM"
              placeholderTextColor={colors.tertiary}
              value={month}
              onChangeText={setMonth}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={[styles.dateSeparator, { color: colors.text }]}>
              /
            </Text>
            <TextInput
              style={[
                styles.yearInput,
                { backgroundColor: colors.card, color: colors.text },
              ]}
              placeholder="YYYY"
              placeholderTextColor={colors.tertiary}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        {/* Province and District Selection */}
        <LocationSelector
          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          onProvinceChange={handleProvinceChange}
          onDistrictChange={handleDistrictChange}
        />

        {/* Address */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Địa chỉ cụ thể
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            placeholder="Số nhà, tên đường..."
            placeholderTextColor={colors.tertiary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            isSaving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  genderText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: "center",
  },
  yearInput: {
    flex: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: "center",
  },
  dateSeparator: {
    fontSize: 20,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: "70%",
    overflow: "hidden",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignSelf: "center",
    width: "92%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalItemSelected: {
    backgroundColor: "#ececec",
  },
  modalHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalSearch: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginHorizontal: 12,
    marginBottom: 8,
  },
});

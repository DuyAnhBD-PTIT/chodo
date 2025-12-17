import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface Province {
  name: string;
  code: number;
  districts?: District[];
}

export interface District {
  name: string;
  code: number;
}

interface LocationSelectorProps {
  selectedProvince?: Province | null;
  selectedDistrict?: District | null;
  onProvinceChange: (province: Province) => void;
  onDistrictChange: (district: District) => void;
  provinceError?: string;
  districtError?: string;
  disabled?: boolean;
}

export default function LocationSelector({
  selectedProvince,
  selectedDistrict,
  onProvinceChange,
  onDistrictChange,
  provinceError,
  districtError,
  disabled = false,
}: LocationSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);

  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince.code);
    } else {
      setDistricts([]);
    }
  }, [selectedProvince?.code]);

  const loadProvinces = async () => {
    try {
      setIsLoadingProvinces(true);
      const response = await axios.get("https://provinces.open-api.vn/api/p/");
      setProvinces(response.data);
    } catch (error) {
      console.error("Error loading provinces:", error);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    try {
      setIsLoadingDistricts(true);
      const response = await axios.get(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error("Error loading districts:", error);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const handleProvinceSelect = (province: Province) => {
    onProvinceChange(province);
    setProvinceModalVisible(false);
    setProvinceSearch("");
  };

  const handleDistrictSelect = (district: District) => {
    onDistrictChange(district);
    setDistrictModalVisible(false);
    setDistrictSearch("");
  };

  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Province Selection */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          Tỉnh/Thành phố
        </Text>
        <Pressable
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.card,
              borderColor: provinceError ? colors.error : colors.border,
            },
            disabled && { opacity: 0.5 },
          ]}
          onPress={() => !disabled && setProvinceModalVisible(true)}
          disabled={disabled}
        >
          {isLoadingProvinces ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={{
                color: selectedProvince ? colors.text : colors.tertiary,
                fontSize: 15,
              }}
            >
              {selectedProvince?.name || "Chọn tỉnh/thành phố"}
            </Text>
          )}
        </Pressable>
        {provinceError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {provinceError}
          </Text>
        ) : null}
      </View>

      {/* District Selection */}
      {selectedProvince && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Quận/Huyện</Text>
          <Pressable
            style={[
              styles.pickerContainer,
              {
                backgroundColor: colors.card,
                borderColor: districtError ? colors.error : colors.border,
              },
              (disabled || districts.length === 0) && { opacity: 0.5 },
            ]}
            onPress={() =>
              !disabled && districts.length > 0 && setDistrictModalVisible(true)
            }
            disabled={disabled || districts.length === 0}
          >
            {isLoadingDistricts ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={{
                  color: selectedDistrict ? colors.text : colors.tertiary,
                  fontSize: 15,
                }}
              >
                {selectedDistrict?.name || "Chọn quận/huyện"}
              </Text>
            )}
          </Pressable>
          {districtError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {districtError}
            </Text>
          ) : null}
        </View>
      )}

      {/* Province Modal */}
      <Modal
        visible={provinceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProvinceModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProvinceModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Chọn Tỉnh/Thành phố
              </Text>
              <Pressable onPress={() => setProvinceModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.modalSearch,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder="Tìm kiếm tỉnh/thành phố..."
              placeholderTextColor={colors.tertiary}
              value={provinceSearch}
              onChangeText={setProvinceSearch}
            />
            <FlatList
              data={filteredProvinces}
              keyExtractor={(item) => String(item.code)}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    selectedProvince?.code === item.code &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => handleProvinceSelect(item)}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* District Modal */}
      <Modal
        visible={districtModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDistrictModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDistrictModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Chọn Quận/Huyện
              </Text>
              <Pressable onPress={() => setDistrictModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.modalSearch,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder="Tìm kiếm quận/huyện..."
              placeholderTextColor={colors.tertiary}
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />
            <FlatList
              data={filteredDistricts}
              keyExtractor={(item) => String(item.code)}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    selectedDistrict?.code === item.code &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => handleDistrictSelect(item)}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
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
});

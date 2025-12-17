import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "@/services/api/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import LocationSelector, {
  Province,
  District,
} from "@/components/LocationSelector";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Email
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Step 2: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: Personal Info
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [dateError, setDateError] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [addressError, setAddressError] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");
  const [specificAddressError, setSpecificAddressError] = useState("");
  // Gender selection
  const [gender, setGender] = useState<string>("");

  // Date input refs for auto-focus
  const dayInputRef = useRef<TextInput>(null);
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  // Step 4: Verification
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const codeInputs = useRef<Array<TextInput | null>>([]);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate step transition
    slideAnim.setValue(50);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const handleProvinceChange = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null); // Reset district when province changes
    setAddressError("");
  };

  const handleDistrictChange = (district: District) => {
    setSelectedDistrict(district);
    setAddressError("");
  };

  const validateStep1 = () => {
    let isValid = true;
    setEmailError("");

    if (!email) {
      setEmailError("Vui lòng nhập email");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email không hợp lệ");
      isValid = false;
    }

    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    setPasswordError("");
    setConfirmPasswordError("");

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng nhập xác nhận mật khẩu");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      isValid = false;
    }

    return isValid;
  };

  const validateStep3 = () => {
    let isValid = true;
    setFullNameError("");
    setDateError("");
    setAddressError("");
    setSpecificAddressError("");

    if (!fullName) {
      setFullNameError("Vui lòng nhập họ và tên");
      isValid = false;
    }

    if (!day || !month || !year) {
      setDateError("Vui lòng nhập đầy đủ ngày sinh");
      isValid = false;
    } else {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      if (
        dayNum < 1 ||
        dayNum > 31 ||
        monthNum < 1 ||
        monthNum > 12 ||
        yearNum < 1900 ||
        yearNum > new Date().getFullYear()
      ) {
        setDateError("Ngày sinh không hợp lệ");
        isValid = false;
      }
    }

    if (!selectedProvince || !selectedDistrict) {
      setAddressError("Vui lòng chọn tỉnh/thành phố và quận/huyện");
      isValid = false;
    }

    if (!specificAddress) {
      setSpecificAddressError("Vui lòng nhập địa chỉ cụ thể");
      isValid = false;
    }

    return isValid;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (validateStep3()) {
        // Call register API
        setIsLoading(true);
        try {
          const DateOfBirth = `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}`;

          await authService.register({
            fullName,
            email,
            password,
            DateOfBirth,
            address: specificAddress,
            TinhThanh: selectedProvince?.name,
            XaPhuong: selectedDistrict?.name,
            // gender is optional; include if selected
            ...(gender ? { gender } : {}),
          });

          setCurrentStep(4);
        } catch (error) {
          Alert.alert(
            "Đăng ký thất bại",
            error instanceof Error ? error.message : "Đã xảy ra lỗi"
          );
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push("/landing");
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã xác thực");
      return;
    }

    setIsLoading(true);
    try {
      await authService.verify({ email, code });
      Alert.alert("Thành công", "Tài khoản đã được xác thực", [
        {
          text: "OK",
          onPress: () => router.replace("/auth/login"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Xác thực thất bại",
        error instanceof Error ? error.message : "Đã xảy ra lỗi"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  currentStep >= step ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <Animated.View
      style={[styles.stepContainer, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Địa chỉ Email
      </Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        Nhập email của bạn để bắt đầu
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: emailError ? colors.error : colors.border,
              backgroundColor: colors.card,
              color: colors.text,
            },
          ]}
          placeholder="example@email.com"
          placeholderTextColor={colors.tertiary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />
        {emailError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {emailError}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      style={[styles.stepContainer, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>Mật khẩu</Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        Tạo mật khẩu bảo mật cho tài khoản
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              {
                borderColor: passwordError ? colors.error : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            placeholder="Tối thiểu 6 ký tự"
            placeholderTextColor={colors.tertiary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.tertiary}
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {passwordError}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Xác nhận mật khẩu
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              {
                borderColor: confirmPasswordError
                  ? colors.error
                  : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor={colors.tertiary}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError("");
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.tertiary}
            />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {confirmPasswordError}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View
      style={[styles.stepContainer, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Thông tin cá nhân
      </Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        Hoàn thiện hồ sơ của bạn
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Họ và tên</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: fullNameError ? colors.error : colors.border,
              backgroundColor: colors.card,
              color: colors.text,
            },
          ]}
          placeholder="Nguyễn Văn A"
          placeholderTextColor={colors.tertiary}
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (fullNameError) setFullNameError("");
          }}
          autoComplete="name"
          editable={!isLoading}
        />
        {fullNameError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {fullNameError}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Ngày sinh</Text>
        <View style={styles.dateContainer}>
          <TextInput
            ref={dayInputRef}
            style={[
              styles.dateInput,
              {
                borderColor: dateError ? colors.error : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            placeholder="DD"
            placeholderTextColor={colors.tertiary}
            value={day}
            onChangeText={(text) => {
              setDay(text);
              if (dateError) setDateError("");
              if (text.length === 2) {
                monthInputRef.current?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={2}
            editable={!isLoading}
            returnKeyType="next"
          />
          <Text style={[styles.dateSeparator, { color: colors.tertiary }]}>
            /
          </Text>
          <TextInput
            ref={monthInputRef}
            style={[
              styles.dateInput,
              {
                borderColor: dateError ? colors.error : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            placeholder="MM"
            placeholderTextColor={colors.tertiary}
            value={month}
            onChangeText={(text) => {
              setMonth(text);
              if (dateError) setDateError("");
              if (text.length === 2) {
                yearInputRef.current?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={2}
            editable={!isLoading}
            returnKeyType="next"
          />
          <Text style={[styles.dateSeparator, { color: colors.tertiary }]}>
            /
          </Text>
          <TextInput
            ref={yearInputRef}
            style={[
              styles.dateInput,
              styles.yearInput,
              {
                borderColor: dateError ? colors.error : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            placeholder="YYYY"
            placeholderTextColor={colors.tertiary}
            value={year}
            onChangeText={(text) => {
              setYear(text);
              if (dateError) setDateError("");
            }}
            keyboardType="number-pad"
            maxLength={4}
            editable={!isLoading}
            returnKeyType="done"
          />
        </View>
        {dateError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {dateError}
          </Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Giới tính</Text>
        <View style={styles.genderRow}>
          {[
            { key: "male", label: "Nam" },
            { key: "female", label: "Nữ" },
            { key: "other", label: "Khác" },
          ].map((opt) => {
            const isSelected = gender === opt.label;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.genderOption,
                  isSelected && styles.genderOptionSelected,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                  },
                ]}
                onPress={() => setGender(opt.label)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    { color: isSelected ? "#fff" : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <LocationSelector
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
        onProvinceChange={handleProvinceChange}
        onDistrictChange={handleDistrictChange}
        provinceError={addressError}
        disabled={isLoading}
      />

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Địa chỉ cụ thể
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: specificAddressError ? colors.error : colors.border,
              backgroundColor: colors.card,
              color: colors.text,
            },
          ]}
          placeholder="Số nhà, tên đường..."
          placeholderTextColor={colors.tertiary}
          value={specificAddress}
          onChangeText={(text) => {
            setSpecificAddress(text);
            if (specificAddressError) setSpecificAddressError("");
          }}
          editable={!isLoading}
        />
        {specificAddressError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {specificAddressError}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View
      style={[styles.stepContainer, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Xác thực tài khoản
      </Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        Nhập mã gồm 6 chữ số đã được gửi đến{"\n"}
        <Text style={{ fontWeight: "600" }}>{email}</Text>
      </Text>

      <View style={styles.codeContainer}>
        {verificationCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (codeInputs.current[index] = ref)}
            style={[
              styles.codeInput,
              {
                borderColor: digit ? colors.primary : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            value={digit}
            onChangeText={(value) => handleCodeChange(index, value)}
            onKeyPress={({ nativeEvent }) =>
              handleCodeKeyPress(index, nativeEvent.key)
            }
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!isLoading}
          />
        ))}
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Quay lại
          </Text>
        </TouchableOpacity>

        {renderProgressBar()}

        <View style={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </View>

        <View style={styles.buttonsContainer}>
          {currentStep < 4 ? (
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.backButtonStyle,
                  { borderColor: colors.border },
                ]}
                onPress={handleBack}
                disabled={isLoading}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>
                  Quay lại
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.nextButton,
                  { backgroundColor: colors.primary },
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {currentStep === 3 ? "Hoàn tất" : "Tiếp theo"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                styles.verifyButton,
                { backgroundColor: colors.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {currentStep < 4 && (
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.secondary }]}>
              Đã có tài khoản?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: "center",
  },
  yearInput: {
    flex: 1.5,
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
  picker: {
    height: 50,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 32,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonsContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonStyle: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    flex: 2,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  verifyButton: {
    width: "100%",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
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
  /* Gender inline options */
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  genderOptionSelected: {
    borderColor: "transparent",
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "600",
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

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Pressable,
  Modal,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as conversationsService from "@/services/api/conversations";
import * as postsService from "@/services/api/posts";
import * as messagesService from "@/services/api/messages";
import { socketService } from "@/services/socket";
import type { Conversation, Post, Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionQuantity, setTransactionQuantity] = useState("1");

  // Dùng Ref để lưu ID hiện tại, giúp hàm callback socket luôn đọc được ID mới nhất
  const currentIdRef = useRef(id);
  useEffect(() => {
    currentIdRef.current = id;
  }, [id]);

  // 1. Tải dữ liệu ban đầu
  useEffect(() => {
    loadConversationData();
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Keyboard listeners
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [id]);

  // 2. Lắng nghe Realtime
  useEffect(() => {
    if (!id) return;

    const handleNewMessage = (messageData: Message) => {
      console.log("🚀 SOCKET NHẬN TÍN HIỆU:", messageData.content);

      const incomingConvId = String(messageData.conversationId).trim();
      const currentConvId = String(currentIdRef.current).trim();

      console.log(
        `🔍 So sánh ID: Nhận(${incomingConvId}) vs Hiện tại(${currentConvId})`
      );

      if (incomingConvId === currentConvId) {
        setMessages((prev) => {
          // Tránh trùng tin nhắn
          if (prev.some((msg) => msg._id === messageData._id)) return prev;
          return [...prev, messageData];
        });

        // Nếu đang ở cuối, tự động cuộn xuống
        if (isAtBottom) {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        } else {
          // Nếu đang cuộn lên trên, hiển thị nút và badge
          if (messageData.sender.id !== user?._id) {
            setHasNewMessage(true);
            setShowScrollButton(true);
          }
        }

        // ✅ Tự động mark as read khi nhận tin nhắn từ người khác
        if (messageData.sender.id !== user?._id && conversation) {
          messagesService
            .markMessagesAsRead(conversation._id)
            .then(() => {
              console.log("✅ Auto marked message as read");
            })
            .catch((err) => {
              console.error("Error auto marking as read:", err);
            });
        }
      } else {
        console.log("❌ Tin nhắn thuộc hội thoại khác, bỏ qua.");
      }
    };

    const handleMessagesRead = (data: {
      conversationId: string;
      messageIds: string[];
    }) => {
      console.log("📖 MESSAGES READ:", data);

      if (
        String(data.conversationId).trim() ===
        String(currentIdRef.current).trim()
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    socketService.on("new_message", handleNewMessage);
    socketService.on("messages_read", handleMessagesRead);

    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("messages_read", handleMessagesRead);
    };
  }, [id, user?._id, isAtBottom, conversation]);

  const loadConversationData = async () => {
    try {
      // Lấy danh sách conversations để có otherUser data
      const allConversations = await conversationsService.getConversations();
      const currentConv = allConversations.find((conv) => conv._id === id);

      if (currentConv) {
        setConversation(currentConv);

        const [postData, messagesData] = await Promise.all([
          postsService.getPostById(currentConv.postId),
          messagesService.getMessages(currentConv._id),
        ]);

        setPost(postData);
        setMessages(messagesData);

        // Kiểm tra xem người dùng hiện tại có phải là người bán không
        if (postData && postData.user && postData.user.id === user?._id) {
          setIsSeller(true);
        } else {
          setIsSeller(false);
        }

        // Scroll to bottom on initial load
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
          setIsInitialLoad(false);
        }, 100);

        // Đánh dấu đã đọc qua API
        await messagesService.markMessagesAsRead(currentConv._id);

        // Đánh dấu đã đọc qua socket
        if (currentConv.otherUser?.id) {
          socketService.emit("mark_read", {
            senderId: currentConv.otherUser.id,
          });
        }
      }
    } catch (error) {
      console.error("Lỗi tải cuộc hội thoại:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
    setHasNewMessage(false);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    setIsAtBottom(isNearBottom);

    if (isNearBottom) {
      setShowScrollButton(false);
      setHasNewMessage(false);
    }
    // Chỉ hiển thị nút khi có tin nhắn mới (hasNewMessage = true)
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !conversation) return;

    const contentToSend = message.trim();

    try {
      setIsSending(true);

      const response = await messagesService.sendMessage({
        receiverId: conversation?.otherUser.id || "",
        content: contentToSend,
        conversationId: conversation._id,
      });

      if (response.success && response.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === response.data._id)) return prev;
          return [...prev, response.data];
        });

        // Clear message after frame to prevent blur
        requestAnimationFrame(() => {
          setMessage("");
        });
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      setMessage(contentToSend);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn lúc này.");
    } finally {
      setIsSending(false);

      // Chỉ scroll nếu input KHÔNG focus
      if (!textInputRef.current?.isFocused()) {
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        });
      }
    }
  };

  const handleOpenActionMenu = () => {
    setShowActionMenu(true);
  };

  const handleCloseActionMenu = () => {
    setShowActionMenu(false);
  };

  const handleOpenTransactionModal = () => {
    setShowActionMenu(false);
    setTransactionQuantity("1");
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn thoát khỏi xác nhận giao dịch?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Thoát",
          style: "destructive",
          onPress: () => {
            setShowTransactionModal(false);
            setTransactionQuantity("1");
          },
        },
      ]
    );
  };

  const handleConfirmTransaction = async () => {
    if (!conversation || !post) return;

    const quantity = parseInt(transactionQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số lượng hợp lệ");
      return;
    }

    if (quantity > post.quantity) {
      Alert.alert("Lỗi", `Số lượng không được vượt quá ${post.quantity}`);
      return;
    }

    Alert.alert(
      "Xác nhận giao dịch",
      `Bạn có chắc chắn muốn xác nhận bán ${quantity} sản phẩm cho ${conversation.otherUser.fullName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              await postsService.confirmSell(
                post._id,
                conversation.otherUser.id,
                quantity
              );
              setShowTransactionModal(false);
              setTransactionQuantity("1");
              Alert.alert("Thành công", "Giao dịch đã được xác nhận", [
                {
                  text: "OK",
                  onPress: () => {
                    // Reload conversation to get updated post data
                    loadConversationData();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert(
                "Lỗi",
                error.message || "Không thể xác nhận giao dịch"
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation || !post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.error }}>
            Không tìm thấy cuộc hội thoại
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={["top"]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.card,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text
                style={[styles.headerTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {post.title}
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.secondary }]}
              >
                {post.price.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            onContentSizeChange={() => {
              if (isAtBottom) {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }
            }}
          >
            <View style={styles.messagesList}>
              {messages.map((msg, index) => {
                const isMyMessage = msg.sender.id === user?._id;
                const currentDate = new Date(msg.createdAt);
                const previousDate =
                  index > 0 ? new Date(messages[index - 1].createdAt) : null;

                // Check if this is the last message from current user (before other user replies or end of list)
                const isLastMyMessage =
                  isMyMessage &&
                  (index === messages.length - 1 ||
                    messages[index + 1]?.sender.id !== user?._id);

                // Check if we need to show date separator
                const showDateSeparator =
                  !previousDate ||
                  currentDate.toDateString() !== previousDate.toDateString();

                // Format date for separator
                const formatDateSeparator = (date: Date) => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);

                  if (date.toDateString() === today.toDateString()) {
                    return "Hôm nay";
                  } else if (date.toDateString() === yesterday.toDateString()) {
                    return "Hôm qua";
                  } else {
                    return date.toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                  }
                };

                return (
                  <View key={msg._id}>
                    {showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <View
                          style={[
                            styles.separatorLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                        <Text
                          style={[
                            styles.separatorText,
                            { color: colors.tertiary },
                          ]}
                        >
                          {formatDateSeparator(currentDate)}
                        </Text>
                        <View
                          style={[
                            styles.separatorLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageItem,
                        isMyMessage ? styles.myMessage : styles.theirMessage,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          {
                            backgroundColor: isMyMessage
                              ? colors.primary
                              : colors.card,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            { color: isMyMessage ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          {msg.content}
                        </Text>
                        <View style={styles.messageFooter}>
                          <Text
                            style={[
                              styles.messageTime,
                              {
                                color: isMyMessage
                                  ? "rgba(255,255,255,0.7)"
                                  : colors.tertiary,
                              },
                            ]}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Text>
                          {isMyMessage && isLastMyMessage && (
                            <Ionicons
                              name={msg.isRead ? "checkmark-done" : "checkmark"}
                              size={14}
                              color={
                                msg.isRead ? "#4CAF50" : "rgba(255,255,255,0.7)"
                              }
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Floating Scroll to Bottom Button */}
          {showScrollButton && (
            <TouchableOpacity
              style={[styles.scrollButton, { backgroundColor: colors.primary }]}
              onPress={scrollToBottom}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={24} color="#FFF" />
              {hasNewMessage && (
                <View
                  style={[
                    styles.newMessageBadge,
                    { backgroundColor: "#FF3B30" },
                  ]}
                >
                  <Text style={styles.badgeText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Input */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: isKeyboardVisible
                  ? 10
                  : Platform.OS === "ios"
                  ? 30
                  : 10,
              },
            ]}
          >
            {/* Plus Button for Seller */}
            {isSeller && (
              <TouchableOpacity
                onPress={handleOpenActionMenu}
                style={styles.plusButton}
              >
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              value={message}
              onChangeText={setMessage}
              multiline
              blurOnSubmit={false}
            />

            <Pressable
              onPressIn={(e) => {
                e.preventDefault?.();
                textInputRef.current?.focus();
              }}
              onPress={handleSendMessage}
              android_disableSound
            >
              <Ionicons
                name="send"
                size={24}
                color={
                  !message.trim() || isSending
                    ? colors.tertiary
                    : colors.primary
                }
              />
            </Pressable>
          </View>

          {/* Action Menu Modal */}
          <Modal
            visible={showActionMenu}
            transparent
            animationType="fade"
            onRequestClose={handleCloseActionMenu}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={handleCloseActionMenu}
            >
              <View
                style={[
                  styles.actionMenu,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={handleOpenTransactionModal}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.actionMenuText, { color: colors.text }]}>
                    Xác nhận giao dịch
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {/* Transaction Confirmation Modal */}
          <Modal
            visible={showTransactionModal}
            transparent
            animationType="slide"
            onRequestClose={handleCloseTransactionModal}
          >
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.modalContent}
              >
                <View
                  style={[
                    styles.transactionModal,
                    { backgroundColor: colors.background },
                  ]}
                >
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Xác nhận giao dịch
                    </Text>
                    <TouchableOpacity
                      onPress={handleCloseTransactionModal}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Product Image */}
                    {post && post.images && post.images.length > 0 && (
                      <Image
                        source={{ uri: post.images[0].imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    )}

                    {/* Product Info */}
                    <View style={styles.infoSection}>
                      <Text
                        style={[styles.productTitle, { color: colors.text }]}
                      >
                        {post?.title}
                      </Text>
                      <Text
                        style={[styles.productPrice, { color: colors.primary }]}
                      >
                        {post?.price.toLocaleString("vi-VN")} đ
                      </Text>
                      <Text
                        style={[
                          styles.productStock,
                          { color: colors.secondary },
                        ]}
                      >
                        Số lượng còn lại: {post?.quantity}
                      </Text>
                    </View>

                    {/* Buyer Info */}
                    <View
                      style={[
                        styles.infoSection,
                        styles.userInfoSection,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.secondary },
                        ]}
                      >
                        Người mua
                      </Text>
                      <View style={styles.userInfo}>
                        {conversation?.otherUser?.avatarUrl ? (
                          <Image
                            source={{
                              uri: conversation.otherUser.avatarUrl,
                            }}
                            style={styles.userAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.userAvatarPlaceholder,
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
                        <Text style={[styles.userName, { color: colors.text }]}>
                          {conversation?.otherUser?.fullName || "Người mua"}
                        </Text>
                      </View>
                    </View>

                    {/* Seller Info */}
                    <View
                      style={[
                        styles.infoSection,
                        styles.userInfoSection,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.secondary },
                        ]}
                      >
                        Người bán
                      </Text>
                      <View style={styles.userInfo}>
                        {user && user.avatarUrl ? (
                          <Image
                            source={{ uri: user.avatarUrl }}
                            style={styles.userAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.userAvatarPlaceholder,
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
                        <Text style={[styles.userName, { color: colors.text }]}>
                          {user?.fullName || "Người bán"}
                        </Text>
                      </View>
                    </View>

                    {/* Quantity Input */}
                    <View style={styles.infoSection}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.secondary },
                        ]}
                      >
                        Số lượng bán
                      </Text>
                      <TextInput
                        style={[
                          styles.quantityInput,
                          {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        value={transactionQuantity}
                        onChangeText={setTransactionQuantity}
                        keyboardType="number-pad"
                        placeholder="Nhập số lượng"
                        placeholderTextColor={colors.tertiary}
                      />
                    </View>
                  </ScrollView>

                  {/* Footer Buttons */}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.cancelButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={handleCloseTransactionModal}
                    >
                      <Text
                        style={[
                          styles.cancelButtonText,
                          { color: colors.text },
                        ]}
                      >
                        Hủy
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.confirmButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={handleConfirmTransaction}
                    >
                      <Text style={styles.confirmButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 13 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  messagesContainer: { flex: 1 },
  messagesContent: { flexGrow: 1, paddingVertical: 16 },
  messagesList: { paddingHorizontal: 16, gap: 12 },
  messageItem: { flexDirection: "row", marginBottom: 4 },
  myMessage: { justifyContent: "flex-end" },
  theirMessage: { justifyContent: "flex-start" },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  messageTime: { fontSize: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  plusButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    textTransform: "capitalize",
  },
  scrollButton: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  newMessageBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  actionMenu: {
    marginHorizontal: 16,
    marginBottom: 100,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  actionMenuText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  transactionModal: {
    borderRadius: 16,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    padding: 16,
  },
  productImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
  },
  userInfoSection: {
    padding: 12,
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  quantityInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {},
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

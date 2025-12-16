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

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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
  }, [id]);

  // 2. Lắng nghe Realtime (SỬA ĐỔI CHÍNH Ở ĐÂY)
  useEffect(() => {
    if (!id) return;

    const handleNewMessage = (messageData: Message) => {
      // LOG KIỂM TRA MÁY NHẬN
      console.log("🚀 SOCKET NHẬN TÍN HIỆU:", messageData.content);

      const incomingConvId = String(messageData.conversationId).trim();
      const currentConvId = String(currentIdRef.current).trim();

      console.log(`🔍 So sánh ID: Nhận(${incomingConvId}) vs Hiện tại(${currentConvId})`);

      if (incomingConvId === currentConvId) {
        setMessages((prev) => {
          // Tránh trùng tin nhắn
          if (prev.some((msg) => msg._id === messageData._id)) return prev;
          return [...prev, messageData];
        });
        
        // Cuộn xuống cuối
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log("❌ Tin nhắn thuộc hội thoại khác, bỏ qua.");
      }
    };

    socketService.on("new_message", handleNewMessage);

    return () => {
      socketService.off("new_message");
    };
  }, [id]); 

  const loadConversationData = async () => {
    try {
      const currentConv = await conversationsService.getConversationById(id as string);
      if (currentConv) {
        setConversation(currentConv);

        const [postData, messagesData] = await Promise.all([
          postsService.getPostById(currentConv.postId),
          messagesService.getMessages(currentConv._id),
        ]);

        setPost(postData);
        setMessages(messagesData);

        // Đánh dấu đã đọc
        const otherMember = currentConv.members.find((m) => m.id !== user?._id);
        if (otherMember) {
          socketService.emit("mark_read", { senderId: otherMember.id });
        }
      }
    } catch (error) {
      console.error("Lỗi tải cuộc hội thoại:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !conversation) return;

    const otherMember = conversation.members.find((m) => m.id !== user?._id);
    const contentToSend = message.trim();

    try {
      setIsSending(true);
      setMessage(""); 

      const response = await messagesService.sendMessage({
        receiverId: otherMember?.id || "",
        content: contentToSend,
        conversationId: conversation._id,
      });

      if (response.success && response.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === response.data._id)) return prev;
          return [...prev, response.data];
        });
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      setMessage(contentToSend);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn lúc này.");
    } finally {
      setIsSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation || !post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.error }}>Không tìm thấy cuộc hội thoại</Text>
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{post.title}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>{post.price.toLocaleString("vi-VN")} đ</Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            <View style={styles.messagesList}>
              {messages.map((msg) => {
                const isMyMessage = msg.sender.id === user?._id;
                return (
                  <View key={msg._id} style={[styles.messageItem, isMyMessage ? styles.myMessage : styles.theirMessage]}>
                    <View style={[styles.messageBubble, { backgroundColor: isMyMessage ? colors.primary : colors.card }]}>
                      <Text style={[styles.messageText, { color: isMyMessage ? "#FFFFFF" : colors.text }]}>{msg.content}</Text>
                      <Text style={[styles.messageTime, { color: isMyMessage ? "rgba(255,255,255,0.7)" : colors.tertiary }]}>
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={colors.tertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!isSending}
            />
            <TouchableOpacity onPress={handleSendMessage} disabled={!message.trim() || isSending}>
              <Ionicons name="send" size={24} color={!message.trim() || isSending ? colors.tertiary : colors.primary} />
            </TouchableOpacity>
          </View>
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
  messageBubble: { maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: "right" },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 8, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  textInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, fontSize: 15, maxHeight: 100 },
});
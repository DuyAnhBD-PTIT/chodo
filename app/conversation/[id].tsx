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

  useEffect(() => {
    loadConversationData();

    // Ensure socket is connected
    if (!socketService.isConnected()) {
      console.log("Socket not connected, attempting to connect...");
      socketService.connect();
    } else {
      console.log("Socket already connected");
    }
  }, [id]);

  // Setup socket listeners for real-time messages
  useEffect(() => {
    console.log(
      "[Conversation] Setting up socket listeners for conversation:",
      id
    );
    console.log("[Conversation] Current user ID:", user?._id);

    const handleNewMessage = (messageData: Message) => {
      console.log(
        "[Conversation] Received new message via socket:",
        messageData
      );
      console.log("[Conversation] Current conversation ID:", id);
      console.log(
        "[Conversation] Message conversation ID:",
        messageData.conversationId
      );

      // Only add message if it belongs to this conversation
      if (messageData.conversationId === id) {
        console.log("[Conversation] Adding message to conversation");
        setMessages((prev) => {
          console.log("[Conversation] Previous messages count:", prev.length);
          // Check if message already exists (prevent duplicates)
          const messageExists = prev.some((msg) => msg._id === messageData._id);
          if (messageExists) {
            console.log("[Conversation] Message already exists, skipping");
            return prev;
          }
          return [...prev, messageData];
        });
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log("[Conversation] Message ignored - wrong conversation");
      }
    };

    const handleUserConnected = (data: { userId: string }) => {
      console.log("[Conversation] User online:", data.userId);
    };

    const handleUserDisconnected = (data: { userId: string }) => {
      console.log("[Conversation] User offline:", data.userId);
    };

    // Register socket event listeners
    console.log("[Conversation] Registering socket event listeners");
    socketService.on("new_message", handleNewMessage);
    socketService.on("user_connected", handleUserConnected);
    socketService.on("user_disconnected", handleUserDisconnected);

    // Cleanup listeners on unmount
    return () => {
      console.log("[Conversation] Cleaning up socket listeners");
      socketService.off("new_message", handleNewMessage);
      socketService.off("user_connected", handleUserConnected);
      socketService.off("user_disconnected", handleUserDisconnected);
    };
  }, [id, user?._id]);

  const loadConversationData = async () => {
    try {
      // Load conversation by ID
      const currentConv = await conversationsService.getConversationById(
        id as string
      );

      if (currentConv) {
        setConversation(currentConv);

        // Load post details
        const postData = await postsService.getPostById(currentConv.postId);
        setPost(postData);

        // Load messages
        const messagesData = await messagesService.getMessages(currentConv._id);
        setMessages(messagesData);
      }
    } catch (error: any) {
      console.error("Load conversation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherMember = () => {
    if (!conversation) return null;
    return conversation.members.find((member) => member.id !== user?._id);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !conversation) return;

    const otherMember = getOtherMember();
    if (!otherMember || !post) return;

    const messageContent = message.trim();

    try {
      setIsSending(true);
      setMessage(""); // Clear input immediately for better UX

      console.log("Sending message via API:", {
        receiverId: otherMember.id,
        content: messageContent,
        conversationId: conversation._id,
        isSocketConnected: socketService.isConnected(),
      });

      // Send via API
      const apiResponse = await messagesService.sendMessage({
        receiverId: otherMember.id,
        content: messageContent,
        conversationId: conversation._id,
      });
      console.log("Message sent via API:", apiResponse);

      // Emit socket event for real-time delivery
      if (socketService.isConnected()) {
        socketService.emit("send_message", {
          conversationId: conversation._id,
          receiverId: otherMember.id,
          content: messageContent,
        });
      }

      // Add message immediately to UI (optimistic update)
      if (apiResponse.data) {
        const newMessage = apiResponse.data;
        setMessages((prev) => {
          // Check if message already exists
          const messageExists = prev.some((msg) => msg._id === newMessage._id);
          if (messageExists) {
            console.log("Message already exists from socket, skipping");
            return prev;
          }
          console.log("Adding sent message to UI");
          return [...prev, newMessage];
        });
      }

      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Send message error:", error);
      // On error, restore the message
      setMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            Đang tải...
          </Text>
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Không tìm thấy cuộc hội thoại
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const otherMember = getOtherMember();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
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
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
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
                numberOfLines={1}
              >
                {post.price.toLocaleString("vi-VN")} đ
              </Text>
            </View>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => router.push(`/post/${post._id}`)}
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Messages Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color={colors.tertiary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Cuộc trò chuyện
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: colors.tertiary }]}
                >
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Bắt đầu trò chuyện về bài đăng "{post.title}"
                </Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {messages.map((msg) => {
                  const isMyMessage = msg.sender.id === user?._id;
                  return (
                    <View
                      key={msg._id}
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
                            {
                              color: isMyMessage ? "#FFFFFF" : colors.text,
                            },
                          ]}
                        >
                          {msg.content}
                        </Text>
                        <Text
                          style={[
                            styles.messageTime,
                            {
                              color: isMyMessage
                                ? "rgba(255, 255, 255, 0.7)"
                                : colors.tertiary,
                            },
                          ]}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={colors.tertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              editable={!isSending}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!message.trim() || isSending}
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
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  infoButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  theirMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 8,
  },
  attachButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    padding: 4,
  },
});

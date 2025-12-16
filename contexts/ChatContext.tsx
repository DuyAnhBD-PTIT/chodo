import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  totalUnreadCount: number;
  setTotalUnreadCount: (count: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  return (
    <ChatContext.Provider value={{ totalUnreadCount, setTotalUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

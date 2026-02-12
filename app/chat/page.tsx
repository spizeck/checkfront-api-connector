"use client";

import { useChat } from "@ai-sdk/react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  const chat = useChat();

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col">
      <ChatInterface
        messages={chat.messages}
        status={chat.status}
        error={chat.error}
        sendMessage={chat.sendMessage}
      />
    </div>
  );
}

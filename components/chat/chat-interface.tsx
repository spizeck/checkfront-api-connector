"use client";

import { useRef, useEffect } from "react";
import type { UIMessage } from "ai";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";

interface ChatInterfaceProps {
  messages: UIMessage[];
  status: string;
  error: Error | undefined;
  sendMessage: (message: { text: string }) => Promise<void>;
}

export function ChatInterface({
  messages,
  status,
  error,
  sendMessage,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h2 className="text-xl font-semibold">Booking Assistant</h2>
            <p className="max-w-md text-(--color-muted)">
              I can help you find and book activities. Tell me what
              you&apos;re looking for, or ask about our available options.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 py-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-(--color-border) px-4 py-2">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-(--color-error-light) p-3 text-sm text-(--color-error)">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        disabled={isStreaming}
      />
    </>
  );
}

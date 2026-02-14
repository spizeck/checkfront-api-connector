"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolResultCard } from "./tool-result-card";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-lg px-4 py-3 ${
          isUser
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-border)]"
        }`}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            if (!part.text) return null;

            if (isUser) {
              // User messages: plain text, no markdown
              return (
                <div key={index} className="whitespace-pre-wrap text-sm">
                  {part.text}
                </div>
              );
            }

            // Assistant messages: render markdown
            return (
              <div key={index} className="prose-chat text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          // Handle tool invocation parts (dynamic-tool type)
          if ("toolName" in part && "state" in part) {
            const toolPart = part as {
              toolName: string;
              toolCallId: string;
              state: string;
              input?: unknown;
              output?: unknown;
            };

            if (toolPart.state === "output-available" && toolPart.output) {
              return (
                <ToolResultCard
                  key={toolPart.toolCallId}
                  toolName={toolPart.toolName}
                  result={toolPart.output}
                />
              );
            }

            if (
              toolPart.state === "input-available" ||
              toolPart.state === "input-streaming"
            ) {
              return (
                <div
                  key={toolPart.toolCallId}
                  className="text-xs italic text-[var(--color-muted)]"
                >
                  Searching...
                </div>
              );
            }
          }

          return null;
        })}
      </div>
    </div>
  );
}

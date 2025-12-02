import React from "react";
import { Message } from "@/src/types/event";
import ChatMessage from "@/src/components/chat/ChatMessage";
import { shouldShowDate, formatChatDate } from "@/src/utils/chat";

interface MessageListProps {
  messages: Message[];
  eventId: string;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export default function MessageList({
  messages,
  eventId,
  currentUserId,
  onEdit,
  onDelete,
}: MessageListProps) {
  return (
    <div className="px-4 py-2 space-y-2">
      {messages.map((message, index) => {
        const showDate = shouldShowDate(messages, index);
        return (
          <React.Fragment key={message.id}>
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="bg-white/55 px-3 py-1 rounded-lg text-sm shadow-md">
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            <ChatMessage
              message={message}
              eventId={eventId}
              isOwnMessage={message.userId === currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

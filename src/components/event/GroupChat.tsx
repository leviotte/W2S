// src/components/event/GroupChat.tsx
"use client";

import { useMemo } from "react";
import MessageList from "../chat/MessageList";
import ChatInput from "../chat/ChatInput";
import { Message } from "@/types";
import { useScrollToBottom } from "../../hooks/useScrollToBottom";
import { X } from "lucide-react";

interface GroupChatProps {
  eventId: string;
  messages: Message[] | undefined; // ✅ undefined kan ook
  onSendMessage: (
    text: string,
    isAnonymous: boolean,
    gifUrl?: string
  ) => Promise<void>;
  onEditMessage?: (messageId: string, newText: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onClose?: () => void;
  currentUserId: string;
  currentUserName?: string;
}

export default function GroupChat({
  eventId,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onClose,
  currentUserId,
}: GroupChatProps) {
  // ✅ Zorg dat messages altijd correct gestructureerd zijn
  const safeMessages: Message[] = useMemo(() => {
    if (!messages) return [];
    return messages.map((msg) => ({
      id: msg.id,
      userId: msg.userId ?? msg.senderId ?? "unknown",
      userName: msg.userName ?? "Unknown User",
      timestamp: msg.timestamp ?? new Date().toISOString(),
      text: msg.text ?? msg.content ?? "",
      isAnonymous: msg.isAnonymous ?? false,
      edited: msg.edited ?? false,
      read: msg.read ?? false,
      gifUrl: msg.gifUrl,
      senderId: msg.senderId,
      replyTo: msg.replyTo,
    }));
  }, [messages]);

  const chatContainerRef = useScrollToBottom([safeMessages]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-12rem)] backdrop-blur-sm bg-white/40 rounded-xl shadow-xl"
      style={{ boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}
    >
      {/* Header */}
      <div className="border-b-[1.5px] border-black px-5 py-4 flex flex-row justify-between items-center space-x-3 rounded-t-lg">
        <h2 className="text-lg font-semibold">Groepsberichten</h2>
        <button
          onClick={onClose}
          className="flex flex-row gap-1 items-center text-white focus:outline-none xs:hidden"
          aria-label="Close chat"
        >
          close
          <X className="hover:text-[#b34c4c]" />
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-warm-olive scrollbar-track-transparent bg-cover bg-center"
      >
        <MessageList
          messages={safeMessages}
          eventId={eventId}
          currentUserId={currentUserId}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
        />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}
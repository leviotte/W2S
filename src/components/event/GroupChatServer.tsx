import { memo } from "react";
import MessageList from "../chat/MessageList";
import ChatInputClient from "../chat/ChatInputClient";
import type { EventMessage, EventParticipant } from "@/types/event";
import type { Message } from "@/types";
import { mapEventMessagesToMessages } from "@/hooks/useEventMessages";
import { getEventByIdAction } from "@/lib/server/actions/events";

interface GroupChatServerProps {
  eventId: string;
  currentUserId: string;
  currentUserName?: string;
  onClose?: () => void;
}

export default async function GroupChatServer({
  eventId,
  currentUserId,
  currentUserName,
  onClose,
}: GroupChatServerProps) {
  // Fetch event via server action
  const result = await getEventByIdAction(eventId);
  const event = result.success ? result.data : null;
  const messages: Message[] = [];

if (event && Array.isArray(event.messages) && event.messages.length > 0) {
  messages.push(
    ...mapEventMessagesToMessages(event.messages as EventMessage[], currentUserId, currentUserName)
  );
}

  // --- Server actions for sending/editing/deleting messages ---
  async function handleSendMessage(text: string, isAnonymous: boolean, gifUrl?: string) {
    "use server";
    // Implementeer een server action in events.ts die een message toevoegt
    const msg = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      senderName: currentUserName,
      text,
      gifUrl: gifUrl || null,
      timestamp: new Date().toISOString(),
      anonymous: isAnonymous,
    };
    // Update event
    await fetch(`/api/events/${eventId}/message`, {
      method: "POST",
      body: JSON.stringify(msg),
    });
  }

  async function handleEditMessage(messageId: string, newText: string) {
    "use server";
    await fetch(`/api/events/${eventId}/message/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text: newText }),
    });
  }

  async function handleDeleteMessage(messageId: string) {
    "use server";
    await fetch(`/api/events/${eventId}/message/${messageId}`, {
      method: "DELETE",
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] backdrop-blur-sm bg-white/40 rounded-xl shadow-xl">
      <div className="border-b-[1.5px] border-black px-5 py-4 flex flex-row justify-between items-center space-x-3 rounded-t-lg">
        <h2 className="text-lg font-semibold">Groepsberichten</h2>
        {onClose && (
          <button onClick={onClose} className="flex flex-row gap-1 items-center text-white focus:outline-none xs:hidden">
            close
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-warm-olive scrollbar-track-transparent bg-cover bg-center">
        <MessageList
          messages={messages}
          eventId={eventId}
          currentUserId={currentUserId}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
        />
      </div>

      <ChatInputClient onSendMessage={handleSendMessage} />
    </div>
  );
}

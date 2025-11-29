import React, { useState, useRef } from "react";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import { Message } from "@/components/types/event";
import { getPseudonymForUser } from "@/components/utils/pseudonyms";


interface ChatMessageProps {
  message: Message;
  eventId: string;
  isOwnMessage: boolean;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export default function ChatMessage({
  message,
  eventId,
  isOwnMessage,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const handleEdit = async () => {
    if (!onEdit || !editText.trim()) return;
    try {
      await onEdit(message.id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error("Bericht bijwerken mislukt:", error);
    }
  };

  const displayName = message.isAnonymous
    ? getPseudonymForUser(message.userId, eventId)
    : message.userName;

  return (
    <div
      ref={messageRef}
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } items-end space-x-2 mb-2 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isOwnMessage && (
        <UserAvatar
          firstName={message.userName.split(" ")[0]}
          lastName={message.userName.split(" ")[1]}
          size="sm"
        />
      )}
      <div className="flex flex-col max-w-[70%]">
        <span className="text-sm  mb-1 px-2">{displayName}</span>
        <motion.div
          className="relative"
          animate={{ x: isHovered && isOwnMessage && !isEditing ? -40 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={`${
              isOwnMessage
                ? "bg-white/55 rounded-tr-none"
                : "bg-white rounded-tl-none"
            } p-3 rounded-lg transition-all duration-200 overflow-hidden shadow-md`}
          >
            {isEditing ? (
              <div className="flex flex-col space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 resize-none focus:border-warm-olive focus:ring-1 focus:ring-warm-olive"
                  rows={Math.min(5, editText.split("\n").length)}
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-warm-olive text-white rounded-md hover:bg-cool-olive transition-colors flex items-center space-x-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>Opslaan</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(message.text);
                    }}
                    className="px-3 py-1 bg-gray-100  rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Annuleer</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.gifUrl ? (
                  <img
                    src={message.gifUrl}
                    alt="GIF"
                    className="max-w-full rounded-md"
                    loading="lazy"
                  />
                ) : (
                  <p className="text-gray-800 break-words whitespace-pre-wrap">
                    {message.text}
                  </p>
                )}
              </>
            )}
          </div>

          {isOwnMessage && !isEditing && (
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-1"
                  style={{ transform: "translateX(calc(100% + 8px))" }}
                >
                  {!message.gifUrl && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1  hover:text-gray-600 bg-white rounded-full shadow-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete?.(message.id)}
                    className="p-1  hover:text-red-600 bg-white rounded-full shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}

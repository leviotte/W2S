"use client";

import { MessageCircle } from "lucide-react";
import NotificationBadge from "../NotificationBadge";

interface ChatNotificationProps {
  unreadCount: number;
  onClick?: () => void;
}

export default function ChatNotification({ unreadCount, onClick }: ChatNotificationProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      <MessageCircle className="h-5 w-5 text-gray-500 hover:text-gray-700" />
      <NotificationBadge count={unreadCount} className="absolute top-0 right-0" />
    </div>
  );
}

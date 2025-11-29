import { Message } from "@/types/event";

export const formatChatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Vandaag";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Gisteren";
  } else {
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};

export const shouldShowDate = (messages: Message[], index: number): boolean => {
  if (index === 0) return true;

  const currentDate = new Date(messages[index].timestamp).toDateString();
  const prevDate = new Date(messages[index - 1].timestamp).toDateString();

  return currentDate !== prevDate;
};

export const getUnreadMessageCount = (
  messages: Message[],
  userId: string,
  lastReadTimestamp: number
): number => {
  return messages.filter(
    (msg) =>
      new Date(msg.timestamp).getTime() > lastReadTimestamp &&
      msg.userId !== userId
  ).length;
};

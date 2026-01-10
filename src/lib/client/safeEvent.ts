// src/lib/client/safeEvent.ts
import type { ServerEvent } from "@/lib/server/types/event-admin";
import type { Event, EventMessage } from "@/types/event";

function isEventMessage(value: unknown): value is EventMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).id === "string" &&
    typeof (value as any).text === "string" &&
    typeof (value as any).createdAt === "string"
  );
}

export function toSafeEvent(server: ServerEvent): Event {
  return {
    ...server,

    // ✅ UNKNOWN → STRICT CLIENT TYPE
    messages: Array.isArray(server.messages)
      ? server.messages.filter(isEventMessage)
      : [],

    // ✅ client verwacht altijd een object
    drawnNames: server.drawnNames ?? {},

    // ✅ tasks altijd array
    tasks: Array.isArray(server.tasks) ? server.tasks : [],
  };
}

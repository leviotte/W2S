// src/app/dashboard/events/[eventId]/edit/page.tsx
import { getEventByIdAction, updateEventAction } from "@/lib/server/actions/events";
import EventDetailsForm from "../../_components/EventDetailsForm";
import { notFound } from "next/navigation";
import { toSafeEvent } from "@/lib/client/safeEvent";

interface PageProps {
  params: { eventId: string };
}

export default async function EventEditPage({ params }: PageProps) {
  const { eventId } = params;

  const result = await getEventByIdAction(eventId);
  if (!result.success || !result.data) notFound();

  const safeEvent = toSafeEvent(result.data); // ✅ server → client grens

  async function handleSave(data: any): Promise<void> {
    await updateEventAction(eventId, data);
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Bewerk Event</h1>
      <EventDetailsForm
        initialData={safeEvent}
        onClose={() => {}}
        onSaved={handleSave}
      />
    </div>
  );
}

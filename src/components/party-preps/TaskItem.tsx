// src/components/party-preps/TaskItem.tsx
// GOUDSTANDAARD VERSIE: Gebruikt centrale types en heeft correcte JSX-syntax.

"use client";

import { useState } from "react";
import { Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/use-auth-store";
// STAP 1: Importeer de types
import type { Task } from "@/types/task";
import type { EventParticipant } from "@/types/event";

interface TaskItemProps {
  // STAP 2: Gebruik de geïmporteerde types
  task: Task;
  eventId: string;
  participants: EventParticipant[];
  currentUserId: string;
  isOrganizer: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onRemoveParticipant: (participantId: string) => void;
}

export default function TaskItem({
  task,
  eventId,
  participants,
  isOrganizer,
  onToggle,
  onDelete,
  onRemoveParticipant,
}: TaskItemProps) {
  const { isOver } = useDroppable({ id: task.id });
  const [showParticipants, setShowParticipants] = useState(false);
  const { updateEvent } = useAuthStore();

  const assignedParticipantsDetails = task.assignedParticipants
    .map((id) => participants.find((p) => p.id === id))
    .filter((p): p is EventParticipant => !!p);

  const toggleParticipants = () => setShowParticipants(!showParticipants);

  const handleAssignParticipant = async (participantId: string) => {
    if (task.assignedParticipants.includes(participantId)) {
      toast.info("Een deelnemer kan maar 1 keer toegewezen worden");
      return;
    }

    try {
      const event = useAuthStore.getState().events.find((e) => e.id === eventId);
      if (!event || !event.tasks) throw new Error("Event of taken niet gevonden");

      const updatedTasks = event.tasks.map((t) =>
        t.id === task.id
          ? { ...t, assignedParticipants: [...t.assignedParticipants, participantId] }
          : t
      );

      await updateEvent(eventId, { tasks: updatedTasks });
      toast.success("Deelnemer toegewezen!");
    } catch {
      toast.error("Taak Toewijzen Mislukt");
    }
  };

  return (
    <div className="p-4 rounded-lg border-[1.5px] border-black transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-grow">
          <label className="relative inline-flex items-center cursor-pointer mt-1">
            {/* CORRECTIE: JSX event handler syntax */}
            <input type="checkbox" checked={task.completed} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-warm-olive/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-olive"></div>
          </label>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <p className={`transition-colors ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
              <div className="flex items-center">
                <button onClick={toggleParticipants} className="p-2 text-gray-600 hover:text-gray-900">
                  {showParticipants ? <ChevronUp /> : <ChevronDown />}
                </button>
                {onDelete && (
                  <button onClick={onDelete} className="p-1 hover:text-red-600 transition-colors ml-2">
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {isOrganizer && showParticipants && (
              <div className="mt-4">
                <p className="text-sm my-2 font-bold">Wijzig Toewijzing:</p>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between border-black border rounded-md p-2">
                      <span>{participant.firstName} {participant.lastName}</span>
                      <button
                        onClick={() => handleAssignParticipant(participant.id)}
                        disabled={task.assignedParticipants.includes(participant.id)}
                        className="px-3 py-1 rounded-lg text-sm transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-accent text-white hover:bg-accent/80"
                      >
                        {task.assignedParticipants.includes(participant.id) ? "Toegewezen" : "Wijs toe"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              {assignedParticipantsDetails.length > 0 ? (
                <div>
                  <p className="text-sm my-2 font-bold">Toegewezen aan:</p>
                  <ul className="space-y-2">
                    {assignedParticipantsDetails.map((participant) => (
                      <li key={participant.id} className="flex items-center justify-between border rounded-md p-2 border-black">
                        <span>{participant.firstName} {participant.lastName}</span>
                        {isOrganizer && (
                          <button
                            onClick={() => onRemoveParticipant(participant.id)}
                            className="text-white ml-2 bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors text-xs"
                          >
                            Verwijder
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center text-sm mt-2 text-gray-500 italic">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span>Nog aan niemand toegewezen</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
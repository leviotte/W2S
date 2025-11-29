"use client";

import { useState } from "react";
import { Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "react-toastify";
import { useStore } from "@/store/useStore";

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    completed: boolean;
    assignedParticipants: string[];
  };
  eventId: string;
  participants: Array<{ id: string; firstName: string; lastName: string }>;
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
  currentUserId,
  isOrganizer,
  onToggle,
  onDelete,
  onRemoveParticipant,
}: TaskItemProps) {
  const { isOver } = useDroppable({ id: task.id });
  const [showParticipants, setShowParticipants] = useState(false);
  const { updateEvent } = useStore();

  const assignedParticipants = task.assignedParticipants
    .map((id) => participants.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const toggleParticipants = () => setShowParticipants(!showParticipants);

  const handleAssignParticipant = async (participantId: string) => {
    if (task.assignedParticipants.includes(participantId)) {
      toast.info("Een deelnemer kan maar 1 keer toegewezen worden");
      return;
    }

    try {
      const event = useStore.getState().events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event niet gevonden");

      const updatedTasks = event.tasks.map((t) =>
        t.id === task.id
          ? { ...t, assignedParticipants: [...t.assignedParticipants, participantId] }
          : t
      );

      await updateEvent(eventId, { tasks: updatedTasks });
    } catch {
      toast.error("Taak Toewijzen Mislukt");
    }
  };

  return (
    <div className="p-4 rounded-lg border-[1.5px] border-black transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-grow">
          <label className="relative inline-flex items-center cursor-pointer mt-2">
            <input type="checkbox" checked={task.completed} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-warm-olive/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-olive"></div>
          </label>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <p>{task.title}</p>
              <button onClick={toggleParticipants} className="p-2 text-gray-600 hover:text-gray-900">
                {showParticipants ? <ChevronUp /> : <ChevronDown />}
              </button>
              {onDelete && (
                <button onClick={onDelete} className="p-1 hover:text-[#b34c4c] transition-colors ml-2">
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>

            {isOrganizer && showParticipants && (
              <div className="mt-4">
                <p className="text-sm my-2 font-bold">Deelnemers:</p>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between border-black border rounded-md p-2">
                      <span>{participant.firstName} {participant.lastName}</span>
                      <button
                        onClick={() => handleAssignParticipant(participant.id)}
                        disabled={task.assignedParticipants.includes(participant.id)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          task.assignedParticipants.includes(participant.id)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-accent text-white hover:bg-accent/80"
                        }`}
                      >
                        {task.assignedParticipants.includes(participant.id) ? "Assigned" : "Assign"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              {assignedParticipants.length > 0 ? (
                <div>
                  <p className="text-sm my-2 font-bold">Toegewezen deelnemers:</p>
                  <ul className="space-y-2">
                    {assignedParticipants.map((participant) => (
                      <li key={participant.id} className="flex items-center justify-between border rounded-md p-2 border-black">
                        <span>{participant.firstName} {participant.lastName}</span>
                        {isOrganizer && (
                          <button
                            onClick={() => onRemoveParticipant(participant.id)}
                            className="text-white ml-2 bg-accent hover:bg-chart-5 px-3 py-1 rounded-lg transition-colors"
                          >
                            Verwijder
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center text-sm mt-2">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span>Wijs taak toe</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

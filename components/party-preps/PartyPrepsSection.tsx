"use client";

import { useState } from "react";
import { Plus, HelpCircle } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { toast } from "sonner";

import { useStore } from "@/lib/store/useStore";
import TaskList from "./TaskList";
import ParticipantList from "../ParticipantList";
import DraggableParticipant from "./DraggableParticipant";

interface PartyPrepsProps {
  eventId: string;
  isOrganizer: boolean;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  currentUserId: string;
}

export default function PartyPrepsSection({
  eventId,
  isOrganizer,
  participants,
  currentUserId,
}: PartyPrepsProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { updateEvent, events } = useStore();
  const event = events.find((e) => e.id === eventId);
  const tasks = event?.tasks || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Geef de taak een titel");
      return;
    }

    try {
      const newTask = {
        id: crypto.randomUUID(),
        title: newTaskTitle,
        completed: false,
        assignedParticipants: [],
      };

      await updateEvent(eventId, { tasks: [...tasks, newTask] });
      setNewTaskTitle("");
      setShowAddTask(false);
    } catch (error) {
      toast.error("Taak toevoegen mislukt");
    }
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const participantId = active.id as string;
    const taskId = over.id as string;

    try {
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          const isAlreadyAssigned = task.assignedParticipants.includes(participantId);
          if (isAlreadyAssigned) {
            toast.info("Je doet deze taak al");
            return task;
          }
          return {
            ...task,
            assignedParticipants: [...task.assignedParticipants, participantId],
          };
        }
        return task;
      });

      await updateEvent(eventId, { tasks: updatedTasks });
      toast.success("Jij hebt deze taak gekregen");
    } catch (error) {
      toast.error("Taak toewijzen mislukt");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      await updateEvent(eventId, { tasks: updatedTasks });
    } catch {
      toast.error("Taak updaten mislukt");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      await updateEvent(eventId, { tasks: updatedTasks });
      toast.success("Taak verwijderd");
    } catch {
      toast.error("Taak verwijderen mislukt");
    }
  };

  const handleRemoveParticipant = async (taskId: string, participantId: string) => {
    try {
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            assignedParticipants: task.assignedParticipants.filter((id) => id !== participantId),
          };
        }
        return task;
      });

      await updateEvent(eventId, { tasks: updatedTasks });
    } catch {
      toast.error("Verwijderen mislukt");
    }
  };

  const activeParticipant = participants.find((p) => p.id === activeId);

  return (
    <div className="backdrop-blur-sm bg-white/40 rounded-lg p-5" style={{ boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900">PartyPreps</h2>
            <button className="hover:text-gray-600" title="Versleep je naam om jezelf toe te voegen of te verwijderen bij een taak.">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm mt-1">Wijs jezelf toe aan een taak</p>
        </div>
      </div>

      <div className="space-y-6">
        {isOrganizer && !showAddTask && (
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 border-[1.5px] border-black rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Voeg Taak Toe</span>
          </button>
        )}

        {showAddTask && (
          <div className="space-y-3 p-4 rounded-lg">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Beschrijf de taak..."
              className="w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-black focus:ring-0 bg-transparent placeholder:text-[#000] p-2"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddTask(false)}
                className="px-3 py-1.5 rounded hover:bg-white/50 border-black border-[1.5px]"
              >
                Annuleer
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-1.5 bg-warm-olive text-white rounded-md hover:bg-cool-olive"
              >
                Voeg Toe
              </button>
            </div>
          </div>
        )}

        <TaskList
          tasks={tasks}
          eventId={eventId}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onToggleTask={handleToggleTask}
          onDeleteTask={isOrganizer ? handleDeleteTask : undefined}
          onRemoveParticipant={handleRemoveParticipant}
        />
      </div>
    </div>
  );
}

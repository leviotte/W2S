/**
 * src/features/events/components/party-preps-section.tsx
 *
 * FINALE VERSIE: Gecorrigeerde dataflow, types, en JSX-syntax.
 */
"use client";

import { useState } from "react";
import { Plus, HelpCircle } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/store/use-auth-store";
import TaskList from "./TaskList";
import ParticipantList from "../event/ParticipantList";
import DraggableParticipant from "./DraggableParticipant";

import type { Event, EventParticipant } from "@/types/event";
import type { Task } from "@/types/task";
import type { UserProfile } from "@/types/user";

interface PartyPrepsProps {
  // We verwachten het volledige event object voor maximale performance en duidelijkheid
  event: Event; 
  isOrganizer: boolean;
  // We gebruiken hier een simpeler type, maar je kan dit verfijnen
  participants: Array<{ id: string; firstName: string; lastName: string; }>;
  currentUserId: string;
}

export function PartyPrepsSection({
  event,
  isOrganizer,
  participants,
  currentUserId,
}: PartyPrepsProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // De updateEvent functie uit onze store.
  const updateEvent = useAuthStore((state) => state.updateEvent);
  const tasks = event.tasks || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Geef de taak een titel");
      return;
    }

    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: newTaskTitle,
        completed: false,
        assignedParticipants: [],
      };

      await updateEvent(event.id, { tasks: [...tasks, newTask] });
      setNewTaskTitle("");
      setShowAddTask(false);
      toast.success("Taak succesvol toegevoegd!");
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error("Taak toevoegen mislukt");
    }
  };

  const handleDragEnd = async (dragEvent: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = dragEvent;
    if (!over) return;

    const participantId = active.id as string;
    const taskId = over.id as string;

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate?.assignedParticipants.includes(participantId)) {
        toast.info("Je bent al toegewezen aan deze taak.");
        return;
    }

    try {
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            assignedParticipants: [...task.assignedParticipants, participantId],
          };
        }
        return task;
      });

      await updateEvent(event.id, { tasks: updatedTasks });
      toast.success("Taak aan jezelf toegewezen!");
    } catch (error) {
      console.error("Failed to assign task:", error);
      toast.error("Taak toewijzen mislukt");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await updateEvent(event.id, { tasks: updatedTasks }).catch(() => toast.error("Taak status wijzigen mislukt."));
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    await updateEvent(event.id, { tasks: updatedTasks });
    toast.success("Taak verwijderd");
  };

  const handleRemoveParticipant = async (taskId: string, participantId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          assignedParticipants: task.assignedParticipants.filter((id) => id !== participantId),
        };
      }
      return task;
    });
    await updateEvent(event.id, { tasks: updatedTasks });
  };
  
  const activeParticipant = participants.find((p) => p.id === activeId);

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
    >
      <div className="backdrop-blur-sm bg-white/40 rounded-lg p-5 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">PartyPreps</h2>
              <button className="text-gray-500 hover:text-gray-700" title="Sleep je naam naar een taak om jezelf toe te wijzen.">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Organiseer de voorbereidingen met je gasten.</p>
          </div>
        </div>

        {isOrganizer && (
            <div className="mb-4">
              {!showAddTask ? (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Voeg Taak Toe</span>
                </button>
              ) : (
                <form onSubmit={handleAddTask} className="space-y-3 p-4 bg-white/60 rounded-lg">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
                    placeholder="Beschrijf de taak..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-transparent p-2"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setShowAddTask(false)}>
                      Annuleren
                    </Button>
                    <Button type="submit">
                      Voeg Toe
                    </Button>
                  </div>
                </form>
              )}
            </div>
        )}
        
        {/* We geven de functies nu door met duidelijke prop namen */}
        <TaskList
          tasks={tasks}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onToggleTask={handleToggleTask}
          onDeleteTask={isOrganizer ? handleDeleteTask : undefined}
          onRemoveParticipant={handleRemoveParticipant}
        />

        <h3 className="font-bold mt-6 mb-2">Deelnemers</h3>
        <ParticipantList participants={participants} activeId={activeId} />
      </div>

      {/* Visuele feedback voor de gebruiker tijdens het slepen */}
      {activeId && activeParticipant && (
          <DraggableParticipant 
              id={activeId}
              firstName={activeParticipant.firstName}
              lastName={activeParticipant.lastName}
          />
      )}
    </DndContext>
  );
}
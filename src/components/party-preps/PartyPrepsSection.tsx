'use client';

import { useState, useTransition } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Plus, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import TaskList from './TaskList';
import ParticipantList from '../event/ParticipantList';
import DraggableParticipant from './DraggableParticipant';
import { updateEventAction } from '@/app/dashboard/events/[id]/actions';
import type { Event, EventParticipant } from '@/types/event';
import type { Task } from '@/types/task';

interface PartyPrepsProps {
  event: Event;
  isOrganizer: boolean;
  participants: EventParticipant[];
  currentUserId: string;
}

export function PartyPrepsSection({
  event,
  isOrganizer,
  participants,
  currentUserId,
}: PartyPrepsProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tasks = event.tasks || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleUpdateTasks = (updatedTasks: Task[]) => {
    startTransition(async () => {
      const result = await updateEventAction(event.id, { tasks: updatedTasks });
      if (!result.success) {
        toast.error(result.message);
      }
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return toast.error('Geef de taak een titel');
    
    // ✅ FIX: createdAt toegevoegd
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      completed: false,
      assignedParticipants: [],
      createdAt: new Date(),
    };
    
    handleUpdateTasks([...tasks, newTask]);
    toast.success('Taak succesvol toegevoegd!');
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = dragEvent;
    if (!active || !over) return;

    const participantId = active.id as string;
    const taskId = over.id as string;

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (taskToUpdate?.assignedParticipants.includes(participantId)) {
      return toast.info('Je bent al toegewezen aan deze taak.');
    }

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, assignedParticipants: [...task.assignedParticipants, participantId] }
        : task
    );
    handleUpdateTasks(updatedTasks);
    toast.success('Taak aan jezelf toegewezen!');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    handleUpdateTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    handleUpdateTasks(updatedTasks);
    toast.success('Taak verwijderd');
  };

  const handleRemoveParticipant = (taskId: string, participantId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, assignedParticipants: task.assignedParticipants.filter((id) => id !== participantId) }
        : task
    );
    handleUpdateTasks(updatedTasks);
  };

  const activeParticipant = participants.find((p) => p.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="backdrop-blur-sm bg-white/40 rounded-lg p-5 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900">PartyPreps</h2>
            <button className="text-gray-500 hover:text-gray-700" title="Sleep je naam naar een taak om jezelf toe te wijzen.">
              <HelpCircle className="h-5 w-5" />
            </button>
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
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Beschrijf de taak..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-transparent p-2"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="ghost" onClick={() => setShowAddTask(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Toevoegen...' : 'Voeg Toe'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
        
        {/* ✅ FIX: onToggle prop naam */}
        <TaskList
          eventId={event.id}
          tasks={tasks}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onToggle={handleToggleTask}
          onDelete={isOrganizer ? handleDeleteTask : undefined}
          onRemoveParticipant={handleRemoveParticipant}
        />

        <h3 className="font-bold mt-6 mb-2">Deelnemers</h3>
        <ParticipantList
          participants={participants}
          currentUserId={currentUserId}
        />
      </div>

      <DragOverlay>
        {activeId && activeParticipant ? (
          <DraggableParticipant
            id={activeId}
            firstName={activeParticipant.firstName}
            lastName={activeParticipant.lastName}
            photoURL={activeParticipant.photoURL}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
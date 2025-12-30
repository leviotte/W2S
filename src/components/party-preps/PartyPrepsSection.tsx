// src/components/party-preps/PartyPrepsSection.tsx
"use client";

import { useState, useTransition } from 'react';
import { Plus, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TaskList from './TaskList';
import {
  updateEventAction,
  getEventByIdAction,
  registerParticipantAction,
  updateEventTasksAction,
  assignParticipantToTaskAction,
  removeParticipantFromTaskAction,
  toggleTaskAction
} from '@/lib/server/actions/events';

import type { Event, EventParticipant } from '@/types/event';
import type { TaskFromFirestore, TaskSerialized } from '@/types/task';

// ✅ Type guard for Firestore Timestamp
function isFirestoreTimestamp(value: any): value is { toDate: () => Date } {
  return value && typeof value === 'object' && typeof value.toDate === 'function';
}

// ✅ Serialize tasks to plain objects
const serializeTasks = (tasks: (TaskFromFirestore | Partial<TaskFromFirestore>)[]): TaskFromFirestore[] => {
  return tasks.map(task => ({
    id: task.id || crypto.randomUUID(),
    title: task.title || 'Nieuwe Taak',
    description: task.description || '',
    completed: task.completed ?? false,
    assignedParticipants: task.assignedParticipants ?? [],
    createdAt: task.createdAt
      ? isFirestoreTimestamp(task.createdAt)
        ? task.createdAt.toDate()
        : typeof task.createdAt === 'string'
        ? new Date(task.createdAt)
        : task.createdAt
      : new Date(),
  }));
};


interface PartyPrepsSectionProps {
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
}: PartyPrepsSectionProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const tasks = serializeTasks(
  (event.tasks || []).map(t => ({
    ...t,
    assignedParticipants: t.assignedTo, // map assignedTo → assignedParticipants
    createdAt: new Date(),              // fallback
    description: '',                    // fallback
  }))
);


  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Geef de taak een titel');
      return;
    }

    const newTask: TaskSerialized = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      completed: false,
      assignedParticipants: [],
      createdAt: new Date().toISOString(),
    };

    startTransition(async () => {
  const updatedTasks = serializeTasks([...tasks, newTask]);
  const result = await updateEventTasksAction(event.id, updatedTasks);
  if (result.success) {
    toast.success('Taak toegevoegd!');
    setNewTaskTitle('');
    setShowAddTask(false);
  } else {
    toast.error(result.message || 'Kon taak niet toevoegen');
  }
});
  };

  const handleToggleTask = async (taskId: string) => {
  startTransition(async () => {
    const updatedTasks = serializeTasks(
      tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    const result = await updateEventTasksAction(event.id, updatedTasks);
    if (!result.success) toast.error(result.message || 'Toggle mislukt');
  });
};

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    
    startTransition(async () => {
      const serializedTasks = serializeTasks(updatedTasks);
      const result = await updateEventTasksAction(event.id, serializedTasks);
      
      if (result.success) {
        toast.success('Taak verwijderd');
      } else {
        toast.error(result.message || 'Verwijderen mislukt');
      }
    });
  };

  const handleAssignParticipant = async (taskId: string, participantId: string) => {
    startTransition(async () => {
      const result = await assignParticipantToTaskAction(event.id, taskId, participantId);
      if (result.success) {
        toast.success(result.message || 'Toegewezen!');
      } else {
        toast.error(result.message || 'Toewijzen mislukt');
      }
    });
  };

  const handleRemoveParticipant = async (taskId: string, participantId: string) => {
    startTransition(async () => {
      const result = await removeParticipantFromTaskAction(event.id, taskId, participantId);
      if (!result.success) {
        toast.error(result.message || 'Verwijderen mislukt');
      }
    });
  };

  return (
    <div
      className="backdrop-blur-sm bg-white/40 rounded-lg p-5 shadow-lg"
      style={{ boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900">PartyPreps</h2>
            <button
              className="hover:text-gray-600"
              title="Wijs jezelf toe aan een taak door op 'Assign' te klikken."
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm mt-1">Wijs jezelf toe aan een taak</p>
        </div>
      </div>

      {/* Add Task Button */}
      {isOrganizer && !showAddTask && (
        <button
          onClick={() => setShowAddTask(true)}
          className="w-full flex items-center justify-center space-x-2 p-3 border-[1.5px] border-black rounded-lg hover:bg-white/50 transition-colors mb-4"
        >
          <Plus className="h-5 w-5" />
          <span>Voeg Taak Toe</span>
        </button>
      )}

      {/* Add Task Form */}
      {showAddTask && (
        <div className="space-y-3 p-4 rounded-lg mb-4">
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
              onClick={() => {
                setShowAddTask(false);
                setNewTaskTitle('');
              }}
              className="px-3 py-1.5 rounded hover:bg-white/50 border-black border-[1.5px]"
            >
              Annuleer
            </button>
            <button
              onClick={handleAddTask}
              disabled={isPending}
              className="px-4 py-1.5 bg-warm-olive text-white rounded-md hover:bg-cool-olive"
            >
              Voeg Toe
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        <TaskList
          tasks={tasks}
          eventId={event.id}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onToggleTask={handleToggleTask}
          onDeleteTask={isOrganizer ? handleDeleteTask : undefined}
          onAssignParticipant={handleAssignParticipant}
          onRemoveParticipant={handleRemoveParticipant}
        />
      </div>

      {/* Empty State */}
      {tasks.length === 0 && !showAddTask && (
        <div className="text-center py-6 text-gray-500">
          <p className="mb-2">Nog geen taken toegevoegd.</p>
          {isOrganizer && (
            <p className="text-sm">Klik op "Voeg Taak Toe" om te beginnen.</p>
          )}
        </div>
      )}
    </div>
  );
}
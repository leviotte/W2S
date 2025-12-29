// src/components/event/ExclusionModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import type { EventParticipant } from '@/types/event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ExclusionModalProps {
  isOpen: boolean; // controlled open state
  participants: EventParticipant[];
  exclusions: Record<string, string[]>;
  onSave: (exclusions: Record<string, string[]>) => Promise<void>;
  onClose: () => void;
}

export default function ExclusionModal({
  isOpen,
  participants,
  exclusions: initialExclusions,
  onSave,
  onClose,
}: ExclusionModalProps) {
  const [exclusions, setExclusions] = useState<Record<string, string[]>>(
    initialExclusions || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync with incoming exclusions
  useEffect(() => {
    setExclusions(initialExclusions || {});
  }, [initialExclusions]);

  const handleExclusionChange = (
    personId: string,
    excludedId: string,
    isExcluded: boolean
  ): void => {
    setExclusions((prev) => {
      const newExclusions = { ...prev };

      if (!newExclusions[personId]) {
        newExclusions[personId] = [];
      }

      if (isExcluded) {
        // Max exclusions check
        const count = Object.values(newExclusions).reduce(
          (acc, ids) => acc + (ids.includes(excludedId) ? 1 : 0),
          0
        );

        if (count >= participants.length - 3) {
          toast.error(
            'Deze deelnemer is al uitgesloten van te veel andere deelnemers'
          );
          return prev;
        }

        if (!newExclusions[personId].includes(excludedId)) {
          newExclusions[personId].push(excludedId);
        }
      } else {
        newExclusions[personId] = newExclusions[personId].filter(
          (id) => id !== excludedId
        );
      }

      return newExclusions;
    });
  };

  const countRemainingOptions = (personId: string): number => {
    const excluded = exclusions[personId] || [];
    return participants.length - 1 - excluded.length;
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await onSave(exclusions);
    } catch (err) {
      console.error('Error saving exclusions:', err);
      toast.error('Kon exclusions niet opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Exclusies Configureren</DialogTitle>
          <DialogDescription>
            Selecteer welke deelnemers elkaar niet mogen trekken. Elke persoon
            moet minimaal 2 mogelijke matches overhouden.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {participants.map((person) => {
            const remainingOptions = countRemainingOptions(person.id);
            const canExcludeMore = remainingOptions > 2;

            return (
              <div
                key={person.id}
                className="border border-gray-300 rounded-lg p-4"
              >
                <h3 className="font-medium text-lg mb-2">
                  {person.firstName} {person.lastName}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {remainingOptions} mogelijke matches over
                </p>

                <div className="space-y-2">
                  {participants
                    .filter((p) => p.id !== person.id)
                    .map((otherPerson) => {
                      const isExcluded = exclusions[person.id]?.includes(
                        otherPerson.id
                      );

                      return (
                        <div
                          key={otherPerson.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${person.id}-${otherPerson.id}`}
                            checked={isExcluded}
                            onCheckedChange={(checked) =>
                              handleExclusionChange(
                                person.id,
                                otherPerson.id,
                                checked === true
                              )
                            }
                            disabled={!canExcludeMore && !isExcluded}
                          />
                          <Label
                            htmlFor={`${person.id}-${otherPerson.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {otherPerson.firstName} {otherPerson.lastName}
                          </Label>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

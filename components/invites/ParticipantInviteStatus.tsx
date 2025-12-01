"use client";

import { Check } from 'lucide-react';

interface ParticipantInviteStatusProps {
  participants: Array<{
    firstName: string;
    lastName: string;
  }>;
  currentIndex: number;
}

export default function ParticipantInviteStatus({
  participants,
  currentIndex,
}: ParticipantInviteStatusProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
      <div className="flex-1">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-warm-olive transition-all duration-500"
            style={{ width: `${(currentIndex / participants.length) * 100}%` }}
          />
        </div>
      </div>
      <span className="ml-4 text-sm font-medium text-gray-600">
        {currentIndex}/{participants.length} Uitgenodigd
      </span>
    </div>
  );
}

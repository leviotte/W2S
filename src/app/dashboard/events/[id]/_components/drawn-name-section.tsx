'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import NameDrawingAnimation from '@/components/event/NameDrawingAnimation';

interface DrawnNameSectionProps {
  names: string[];
  onNameDrawn: (name: string) => void;
}

export function DrawnNameSection({ names, onNameDrawn }: DrawnNameSectionProps) {
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  const handleStartDrawing = () => {
    setShowDrawingModal(true);
  };

  const handleNameDrawn = (drawnName: string) => {
    onNameDrawn(drawnName);
    setShowDrawingModal(false);
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleStartDrawing} size="lg">
        Trek een naam
      </Button>

      {/* ✅ FIX: Correcte props voor NameDrawingAnimation */}
      <NameDrawingAnimation
        isOpen={showDrawingModal}
        onClose={() => setShowDrawingModal(false)}
        names={names}
        onDraw={handleNameDrawn}
      />
    </div>
  );
}
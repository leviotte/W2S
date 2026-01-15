// src/app/dashboard/events/_components/organized-event-count.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { getOrganizedEventCount } from '@/lib/server/actions/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrganizedEventCountProps {
  userId: string;
}

export default function OrganizedEventCount({ userId }: OrganizedEventCountProps) {
  const [counts, setCounts] = useState({ onGoing: 0, past: 0, all: 0 });
  const [isPending, startTransition] = useTransition();

  const fetchCounts = () => {
    startTransition(async () => {
      if (!userId) return;
      try {
        const data = await getOrganizedEventCount(userId);
        setCounts(data);
      } catch (err) {
        console.error('Kon event counts niet ophalen:', err);
      }
    });
  };

  useEffect(() => {
    fetchCounts();
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Georganiseerde Events</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p>Aankomende: {counts.onGoing}</p>
        <p>Verlopen: {counts.past}</p>
        <p>Totaal: {counts.all}</p>
      </CardContent>
    </Card>
  );
}

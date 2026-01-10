'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { nlBE } from 'date-fns/locale';
import { toast } from 'sonner';

import type { Event } from '@/types/event';
import type { UserProfile, SubProfile } from '@/types/user';
import { joinEventAction } from '@/lib/server/actions/events';

import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/shared/user-avatar';

type Profile = (UserProfile | SubProfile) & { id: string };

interface Props {
  event: Event;
  profiles: Profile[];
}

export default function ParticipateClient({ event, profiles }: Props) {
  const router = useRouter();
  const [showProfiles, setShowProfiles] = useState(false);
  const [isPending, startTransition] = useTransition();

  function join(profile: Profile) {
    startTransition(async () => {
      const res = await joinEventAction({
        eventId: event.id,
        profileId: profile.id,
      });

      if (res.success) {
        toast.success(`${profile.firstName} neemt nu deel aan "${event.name}"!`);
        router.push(`/dashboard/event/${event.id}`);
      } else {
        const errorMessage = 'error' in res ? res.error : res.message;
        toast.error(errorMessage ?? 'Deelname mislukt');
      }
    });
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Deelnemen aan: {event.name}
          </CardTitle>
          <CardDescription>
            Georganiseerd op{' '}
            {format(new Date(event.startDateTime), 'd MMMM yyyy', { locale: nlBE })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {event.backgroundImage && (
            <div className="relative h-48 w-full overflow-hidden rounded-md">
              <Image
                src={event.backgroundImage}
                alt={event.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          {event.additionalInfo && <p>{event.additionalInfo}</p>}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {!showProfiles ? (
            <Button
              onClick={() => setShowProfiles(true)}
              disabled={isPending}
              className="w-full"
            >
              Nu Deelnemen
            </Button>
          ) : (
            <>
              <Separator />
              <h3 className="text-center font-semibold">
                Wie neemt er deel?
              </h3>
              <div className="flex flex-col gap-3">
                {profiles.map(profile => (
                  <Button
                    key={profile.id}
                    variant="outline"
                    onClick={() => join(profile)}
                    disabled={isPending}
                    className="flex items-center gap-4 p-4 justify-start"
                  >
                    <UserAvatar {...profile} size="md" />
                    <span className="font-medium">
                      {profile.firstName} {profile.lastName}
                    </span>
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { togglePublicStatus } from '@/app/dashboard/profile/actions';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PublicStatusFormProps {
  profile: UserProfile;
}

export default function PublicStatusForm({ profile }: PublicStatusFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(profile.isPublic ?? false);

  const handleCheckedChange = (checked: boolean) => {
    // Optimistische UI update
    setIsPublic(checked);

    startTransition(async () => {
      const result = await togglePublicStatus(checked);
      
      // TypeScript weet nu exact hoe 'result' eruit ziet in beide gevallen!
      if (result.success) {
        // Geen '.data' of vraagtekens meer nodig. Directe, veilige toegang.
        toast.success(result.message);
        // We kunnen de state zelfs nog eens synchroniseren voor absolute zekerheid.
        setIsPublic(result.newStatus);
      } else {
        toast.error('Oeps!', { description: result.error });
        // Pessimistische correctie: zet de state terug naar hoe het was vóór de klik.
        setIsPublic(!checked);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profiel Zichtbaarheid</CardTitle>
        <CardDescription>
          Een publiek profiel kan gevonden worden door andere gebruikers. Een privé profiel is enkel zichtbaar via directe links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 rounded-md border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="public-status-switch" className="text-base font-medium leading-none">
              Profiel is Publiek
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPublic ? 'Je profiel is momenteel publiek.' : 'Je profiel is momenteel privé.'}
            </p>
          </div>
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              id="public-status-switch"
              checked={isPublic}
              onCheckedChange={handleCheckedChange}
              aria-label="Toggle profiel zichtbaarheid"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
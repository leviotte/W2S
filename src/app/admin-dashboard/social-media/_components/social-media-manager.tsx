'use client';

import { useState, useTransition } from 'react';
import { Trash2, Save, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  updateSinglePlatform,
  removePlatform,
  removeAllPlatforms,
  updateSocialMediaAccounts,
} from '@/lib/server/actions/social-media';
import type { SocialMediaAccounts, SocialPlatform } from '@/types/social-media';
import { SOCIAL_PLATFORMS } from '@/types/social-madia';

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  initialAccounts: SocialMediaAccounts | null;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SocialMediaManager({ initialAccounts }: Props) {
  const [isPending, startTransition] = useTransition();

  // Form state
  const [instagram, setInstagram] = useState(initialAccounts?.instagram || '');
  const [facebook, setFacebook] = useState(initialAccounts?.facebook || '');
  const [twitter, setTwitter] = useState(initialAccounts?.twitter || '');
  const [tiktok, setTikTok] = useState(initialAccounts?.tiktok || '');
  const [pinterest, setPinterest] = useState(initialAccounts?.pinterest || '');

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleUpdateSingle = (platform: SocialPlatform, value: string) => {
    if (!value.trim()) {
      toast.error(`Voer een ${SOCIAL_PLATFORMS[platform].name} URL in`);
      return;
    }

    startTransition(async () => {
      const result = await updateSinglePlatform(platform, value);

      if (result.success) {
        toast.success(`${SOCIAL_PLATFORMS[platform].name} bijgewerkt! ✓`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRemoveSingle = (platform: SocialPlatform) => {
    startTransition(async () => {
      const result = await removePlatform(platform);

      if (result.success) {
        // Clear local state
        switch (platform) {
          case 'instagram':
            setInstagram('');
            break;
          case 'facebook':
            setFacebook('');
            break;
          case 'twitter':
            setTwitter('');
            break;
          case 'tiktok':
            setTikTok('');
            break;
          case 'pinterest':
            setPinterest('');
            break;
        }

        toast.success(`${SOCIAL_PLATFORMS[platform].name} verwijderd`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleUpdateAll = () => {
    startTransition(async () => {
      const result = await updateSocialMediaAccounts({
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        twitter: twitter.trim() || null,
        tiktok: tiktok.trim() || null,
        pinterest: pinterest.trim() || null,
      });

      if (result.success) {
        toast.success('Alle accounts bijgewerkt! 🎉');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRemoveAll = () => {
    startTransition(async () => {
      const result = await removeAllPlatforms();

      if (result.success) {
        // Clear all state
        setInstagram('');
        setFacebook('');
        setTwitter('');
        setTikTok('');
        setPinterest('');

        toast.success('Alle accounts verwijderd');
      } else {
        toast.error(result.error);
      }
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Social Media Beheer
        </h1>
        <p className="text-gray-600 text-lg">
          Beheer je social media links voor de hele website
        </p>
      </div>

      {/* Social Media Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram */}
        <PlatformCard
          platform="instagram"
          value={instagram}
          onChange={setInstagram}
          onUpdate={() => handleUpdateSingle('instagram', instagram)}
          onRemove={() => handleRemoveSingle('instagram')}
          disabled={isPending}
        />

        {/* Facebook */}
        <PlatformCard
          platform="facebook"
          value={facebook}
          onChange={setFacebook}
          onUpdate={() => handleUpdateSingle('facebook', facebook)}
          onRemove={() => handleRemoveSingle('facebook')}
          disabled={isPending}
        />

        {/* Twitter/X */}
        <PlatformCard
          platform="twitter"
          value={twitter}
          onChange={setTwitter}
          onUpdate={() => handleUpdateSingle('twitter', twitter)}
          onRemove={() => handleRemoveSingle('twitter')}
          disabled={isPending}
        />

        {/* TikTok */}
        <PlatformCard
          platform="tiktok"
          value={tiktok}
          onChange={setTikTok}
          onUpdate={() => handleUpdateSingle('tiktok', tiktok)}
          onRemove={() => handleRemoveSingle('tiktok')}
          disabled={isPending}
        />

        {/* Pinterest */}
        <PlatformCard
          platform="pinterest"
          value={pinterest}
          onChange={setPinterest}
          onUpdate={() => handleUpdateSingle('pinterest', pinterest)}
          onRemove={() => handleRemoveSingle('pinterest')}
          disabled={isPending}
        />
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t">
        <Button
          onClick={handleUpdateAll}
          disabled={isPending}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Bezig...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Update Alle Accounts
            </>
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              disabled={isPending}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Verwijder Alles
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
              <AlertDialogDescription>
                Dit verwijdert alle social media links. Deze actie kan niet ongedaan gemaakt worden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveAll}
                className="bg-red-600 hover:bg-red-700"
              >
                Ja, verwijder alles
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ============================================================================
// PLATFORM CARD SUB-COMPONENT
// ============================================================================

type PlatformCardProps = {
  platform: SocialPlatform;
  value: string;
  onChange: (value: string) => void;
  onUpdate: () => void;
  onRemove: () => void;
  disabled: boolean;
};

function PlatformCard({
  platform,
  value,
  onChange,
  onUpdate,
  onRemove,
  disabled,
}: PlatformCardProps) {
  const config = SOCIAL_PLATFORMS[platform];

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-accent p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`text-3xl bg-gradient-to-r ${config.color} w-12 h-12 rounded-full flex items-center justify-center`}>
          <span className="text-white text-xl">{config.icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">{config.name}</h3>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <Label htmlFor={`${platform}-input`} className="text-sm font-medium">
          Account URL
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id={`${platform}-input`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            className="pl-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          disabled={disabled || !value}
          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Verwijder
        </Button>
        <Button
          size="sm"
          onClick={onUpdate}
          disabled={disabled || !value.trim()}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Update
        </Button>
      </div>

      {/* Status Indicator */}
      {value && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          <span>Account gekoppeld</span>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { UserProfile } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInfoForm from './personal-info-form';
import AddressForm from './address-form';
import PhotoForm from './photo-form';
import PublicStatusForm from './public-status-form';
import ShareProfileForm from './share-profile-form';

interface ProfileManager {
  userId: string;
  email: string;
  displayName?: string;
  grantedAt: Date;
  grantedBy: string;
}

interface ProfileClientProps {
  profile: UserProfile & { id: string };
  managers: ProfileManager[];
}

export function ProfileClient({ profile, managers }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Profiel Instellingen</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Persoonlijk</TabsTrigger>
          <TabsTrigger value="address">Adres</TabsTrigger>
          <TabsTrigger value="photo">Foto</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="sharing">Delen</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Persoonlijke Informatie</CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Adresgegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photo">
          <Card>
            <CardHeader>
              <CardTitle>Profielfoto</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Instellingen</CardTitle>
            </CardHeader>
            <CardContent>
              <PublicStatusForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing">
          <ShareProfileForm profile={profile} managers={managers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
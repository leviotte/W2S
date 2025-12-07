// src/components/profile/ShareProfileSection.tsx
"use client";

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { useProfileManagers } from '@/hooks/use-profile-managers'; // Toekomstige hook!
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { X, Search } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Manager } from '@/types/user';

interface ShareProfileSectionProps {
  profileId: string;
}

export default function ShareProfileSection({ profileId }: ShareProfileSectionProps) {
  // DE LOGICA IS VERPLAATST!
  // Deze custom hook zal alle complexiteit bevatten:
  // - Managers ophalen
  // - Zoeken naar nieuwe managers
  // - Een manager toevoegen/verwijderen
  const { managers, searchResults, isLoading, addManager, removeManager, setSearchQuery } = useProfileManagers(profileId);

  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-lg font-semibold text-accent mb-4">Profielbeheerders</h2>
      
      {/* Zoekfunctionaliteit */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Zoek gebruiker op e-mail..."
          className="pl-9"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            {searchResults.map((user) => (
              <div key={user.id} className="p-2 hover:bg-gray-100">
                <Button variant="ghost" className="w-full justify-start" onClick={() => addManager(user)}>
                  <UserAvatar src={user.photoURL} name={`${user.firstName} ${user.lastName}`} className="h-8 w-8 mr-2" />
                  <span>{user.firstName} {user.lastName} ({user.email})</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lijst van huidige managers */}
      <div className="space-y-3">
        {isLoading && <LoadingSpinner />}
        {!isLoading && managers.length === 0 && (
          <p className="text-gray-500 text-center py-4">Nog geen beheerders toegevoegd.</p>
        )}
        {managers.map((manager) => (
          <div key={manager.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <UserAvatar src={manager.photoURL} name={`${manager.firstName} ${manager.lastName}`} className="h-10 w-10" />
              <div>
                <p className="font-medium">{manager.firstName} {manager.lastName}</p>
                <p className="text-sm text-gray-500">{manager.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeManager(manager.id)}>
              <X className="h-5 w-5 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
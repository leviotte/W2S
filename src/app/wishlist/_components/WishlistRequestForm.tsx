// src/app/wishlist/_components/WishlistRequestForm.tsx
'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import WishlistRequestDialog from './WishlistRequestDialog';
import { wishlistRequestAction } from '@/lib/server/actions/wishlistRequestAction';
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function WishlistRequestForm() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteContext, setInviteContext] = useState<{ firstName: string; lastName: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await wishlistRequestAction(formData);

    if (!result.success) {
  toast.error(result.error || 'Onverwachte fout.');
} else if (!result.userFound) {
  if (result.user) {
    setInviteContext(result.user); // alleen als er een user-object is
    setInviteDialogOpen(true);
  } else {
    toast.error('Geen gebruiker gevonden om uit te nodigen.');
  }
} else {
  toast.success('Je uitnodiging is verzonden.');
  setFormData({ firstName: '', lastName: '' });
}

setIsLoading(false);

  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Zoek naar een Wish2Share-List</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.firstName}
              placeholder="Voornaam"
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              required
            />
            <input
              type="text"
              value={formData.lastName}
              placeholder="Achternaam"
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-warm-olive text-white px-6 py-2 rounded-md hover:bg-cool-olive flex items-center"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Search className="h-5 w-5 mr-2" />}
              Zoek
            </button>
          </div>
        </form>
      </div>

      {inviteDialogOpen && inviteContext && (
        <WishlistRequestDialog
          isOpen={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          context={{ type: 'search', recipient: inviteContext }}
        />
      )}
    </div>
  );
}

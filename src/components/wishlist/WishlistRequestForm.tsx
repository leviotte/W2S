'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WishlistInviteHandler } from '@/components/wishlist/WishlistInviteHandler';

interface FormData {
  firstName: string;
  lastName: string;
}

export default function WishlistRequestForm() {
  const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [suggestInvite, setSuggestInvite] = useState(false);
  const [recipient, setRecipient] = useState<FormData & { email?: string }>({ 
    firstName: '', 
    lastName: '',
    email: '' 
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const first = formData.firstName.trim().toLowerCase();
    const last = formData.lastName.trim().toLowerCase();

    if (!first || !last) {
      toast.error('Fill all required fields');
      return;
    }

    setIsLoading(true);
    setSuggestInvite(false);

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('firstName_lower', '==', first),
        where('lastName_lower', '==', last)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setRecipient({ 
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: '' 
        });
        setSuggestInvite(true);
        return;
      }

      if (snap.docs.length > 1) {
        toast.error('Multiple people found. Please refine your search.');
        return;
      }

      const userDoc = snap.docs[0];

      await addDoc(collection(db, 'wishlistRequests'), {
        recipientId: userDoc.id,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('Your invitation is sent.');
      setFormData({ firstName: '', lastName: '' });
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Look for Wish2Share-List</h2>
        <p className="text-gray-600 mb-6">
          Fill in the name of the person you're looking a Wish2Share-List for.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                placeholder="First name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-warm-olive text-white px-6 py-2 rounded-md hover:bg-cool-olive flex items-center"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Search className="h-5 w-5 mr-2" />}
              Search
            </button>
          </div>
        </form>
      </div>

      {/* ✅ FIXED: Component doesn't need props */}
      {suggestInvite && <WishlistInviteHandler />}
    </div>
  );
}
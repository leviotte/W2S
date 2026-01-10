'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { Account } from '@/types/account';

type Props = {
  account?: Account | null;
};

export default function AccountForm({ account }: Props) {
  const [instagram, setInstagram] = useState(account?.instagram || '');
  const [facebook, setFacebook] = useState(account?.facebook || '');
  const [twitter, setTwitter] = useState(account?.twitter || '');
  const [tiktok, setTikTok] = useState(account?.tiktok || '');
  const [pinterest, setPinterest] = useState(account?.pinterest || '');

  const accounts = [
    { name: 'Instagram', value: instagram, setter: setInstagram },
    { name: 'Facebook', value: facebook, setter: setFacebook },
    { name: 'Twitter/X', value: twitter, setter: setTwitter },
    { name: 'TikTok', value: tiktok, setter: setTikTok },
    { name: 'Pinterest', value: pinterest, setter: setPinterest },
  ];

  const handleUpdate = async (platform: keyof Account, value: string) => {
    if (!value) return Swal.fire('Warning', `Enter a ${platform} URL`, 'warning');
    const res = await fetch('/api/account/upsert', {
      method: 'POST',
      body: JSON.stringify({ [platform]: value }),
    });
    if (res.ok) Swal.fire('Success', `${platform} updated!`, 'success');
  };

  const handleRemove = async (platform: keyof Account, setter: any) => {
    const res = await fetch('/api/account/remove', {
      method: 'POST',
      body: JSON.stringify({ field: platform }),
    });
    if (res.ok) {
      setter('');
      Swal.fire('Removed', `${platform} removed!`, 'success');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {accounts.map(acc => (
        <div
          key={acc.name}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#606C38] hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{acc.name}</h2>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#606C38] mb-4"
            value={acc.value}
            onChange={e => acc.setter(e.target.value)}
          />
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-red-300 text-red-700 rounded-md hover:bg-red-400 transition-colors"
              onClick={() => handleRemove(acc.name.toLowerCase() as keyof Account, acc.setter)}
            >
              Remove
            </button>
            <button
              className="px-4 py-2 bg-[#606C38]/30 text-[#606C38] rounded-md hover:bg-[#606C38]/60 transition-colors"
              onClick={() => handleUpdate(acc.name.toLowerCase() as keyof Account, acc.value)}
            >
              Update
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

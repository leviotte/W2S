'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface AccountsState {
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  pinterest: string;
}

export default function AccountFormPage() {
  const [accounts, setAccounts] = useState<AccountsState>({
    instagram: '',
    facebook: '',
    twitter: '',
    tiktok: '',
    pinterest: '',
  });
  const [loading, setLoading] = useState(true);

  // Initial load: fetch server-side data
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/account/upsert', { method: 'POST', body: JSON.stringify({}) });
        if (res.ok) {
          const data = await res.json();
          setAccounts({
            instagram: data.account?.instagram || '',
            facebook: data.account?.facebook || '',
            twitter: data.account?.twitter || '',
            tiktok: data.account?.tiktok || '',
            pinterest: data.account?.pinterest || '',
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to load accounts', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const updateField = async (platform: keyof AccountsState, value: string) => {
    if (!value) return Swal.fire('Warning', `Please enter a ${platform} URL`, 'warning');
    try {
      const res = await fetch('/api/account/upsert', {
        method: 'POST',
        body: JSON.stringify({ [platform]: value }),
      });
      const data = await res.json();
      if (data.success) Swal.fire('Success', `${platform} updated!`, 'success');
      setAccounts((prev) => ({ ...prev, [platform]: value }));
    } catch (err) {
      console.error(err);
      Swal.fire('Error', `Failed to update ${platform}`, 'error');
    }
  };

  const removeField = async (platform: keyof AccountsState) => {
    try {
      const res = await fetch('/api/account/remove', {
        method: 'POST',
        body: JSON.stringify({ field: platform }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => ({ ...prev, [platform]: '' }));
        Swal.fire('Removed', `${platform} removed successfully!`, 'success');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', `Failed to remove ${platform}`, 'error');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-12 w-12 border-b-2 border-[#606C38] rounded-full"></div>
    </div>
  );

  const fields: { label: string; key: keyof AccountsState }[] = [
    { label: 'Instagram', key: 'instagram' },
    { label: 'Facebook', key: 'facebook' },
    { label: 'Twitter/X', key: 'twitter' },
    { label: 'TikTok', key: 'tiktok' },
    { label: 'Pinterest', key: 'pinterest' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#606C38] mb-4 text-center">
          Manage Social Media Accounts
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Update or remove your social media links
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div
              key={field.key}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#606C38] hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{field.label}</h2>
              <input
                type="text"
                placeholder={`www.${field.label.toLowerCase()}.com/...`}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#606C38] mb-4"
                value={accounts[field.key]}
                onChange={(e) =>
                  setAccounts((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => removeField(field.key)}
                  className="px-4 py-2 bg-red-300 text-red-700 rounded-md hover:bg-red-400 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => updateField(field.key, accounts[field.key])}
                  className="px-4 py-2 bg-[#606C38]/30 text-[#606C38] rounded-md hover:bg-[#606C38]/60 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => updateField('instagram', accounts.instagram)}
            className="px-6 py-3 bg-[#606C38] text-white rounded-md hover:bg-[#606C38]/80 transition-colors"
          >
            Update All Accounts
          </button>
          <button
            onClick={() =>
              Promise.all(
                (Object.keys(accounts) as (keyof AccountsState)[]).map((k) =>
                  removeField(k)
                )
              )
            }
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Remove All Accounts
          </button>
        </div>
      </div>
    </div>
  );
}

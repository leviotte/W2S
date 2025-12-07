// src/components/profile/AddressSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Address } from "@/types/user";

interface AddressSectionProps {
  address?: Partial<Address>;
  onFieldChange: (field: keyof Address, value: string) => void;
}

const addressFields: { key: keyof Address; label: string }[] = [
    { key: 'street', label: 'Straat' },
    { key: 'number', label: 'Huisnummer' },
    { key: 'box', label: 'Bus' },
    { key: 'postalCode', label: 'Postcode' },
    { key: 'city', label: 'Stad' },
    { key: 'country', label: 'Land' },
];

export default function AddressSection({ address, onFieldChange }: AddressSectionProps) {
  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-lg font-semibold text-accent mb-4">Adres</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addressFields.map(({ key, label }) => (
          <div key={key} className={key === 'street' ? 'sm:col-span-2' : ''}>
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="text"
              value={address?.[key] || ''}
              onChange={(e) => onFieldChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
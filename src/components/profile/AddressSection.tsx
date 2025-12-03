"use client";

import React from "react";
import RequiredFieldMarker from "@/components/RequiredFieldMarker";

const inputClasses =
  "mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive";

export interface Address {
  street: string;
  number: string;
  box: string;
  postalCode: string;
  city: string;
  country: string;
}

interface AddressSectionProps {
  address: Address;
  onChange: (field: keyof Address, value: string) => void;
}

export default function AddressSection({
  address,
  onChange,
}: AddressSectionProps) {
  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-lg font-semibold text-accent mb-3">Adres</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: "Land", key: "country", required: false },
          { label: "Locatie", key: "city", required: true },
          { label: "Straat", key: "street", required: false },
          { label: "Nummer", key: "number", required: false },
          { label: "Bus", key: "box", required: false },
          { label: "Postcode", key: "postalCode", required: false },
        ].map(({ label, key, required }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-accent">
              {label} {required && <RequiredFieldMarker />}
            </label>
            <input
              type="text"
              required={required}
              value={address[key]}
              onChange={(e) => onChange(key as keyof Address, e.target.value)}
              className={inputClasses}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

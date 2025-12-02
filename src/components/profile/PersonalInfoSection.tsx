"use client";

import RequiredFieldMarker from "@/src/components/RequiredFieldMarker";
import DateInput from "@/src/components/DateInput";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  name?: string;
  phone: string;
  birthdate: string;
  isProfile: boolean;
}

interface PersonalInfoSectionProps {
  data: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
}

export default function PersonalInfoSection({
  data,
  onChange,
}: PersonalInfoSectionProps) {
  const inputClasses =
    "mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive";

  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-lg font-semibold text-accent mb-3">Persoonlijk</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!data.isProfile ? (
          <>
            <div>
              <label className="block text-sm font-medium text-accent">
                Voornaam <RequiredFieldMarker />
              </label>
              <input
                type="text"
                required
                value={data.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent">
                Achternaam <RequiredFieldMarker />
              </label>
              <input
                type="text"
                required
                value={data.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                className={inputClasses}
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-accent">
              Voor- en Achternaam <RequiredFieldMarker />
            </label>
            <input
              type="text"
              required
              value={data.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className={inputClasses}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-accent">
            E-mailadres <RequiredFieldMarker />
          </label>
          <input
            type="email"
            required
            disabled={data.isProfile}
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-accent">GSM-nummer</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="sm:col-span-2">
          <DateInput
            id="date-of-birth"
            label="Geboortedatum"
            value={data.birthdate}
            onChange={(value) => onChange("birthdate", value)}
            required
            maxDate={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>
    </div>
  );
}

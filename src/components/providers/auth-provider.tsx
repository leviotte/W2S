/**
 * src/components/providers/auth-provider.tsx
 *
 * Dit is een Client Component dat de server-side opgehaalde gebruikersdata
 * beschikbaar maakt voor alle andere Client Components binnen een beveiligde layout
 * via een React Context. Dit is een fundamenteel 'Server-naar-Client' patroon.
 */
'use client';

import { createContext, useContext, ReactNode } from 'react';
// MENTOR-TIP: We gebruiken 'type' import hier omdat we enkel de TypeScript-type definitie nodig hebben.
import type { UserProfile } from '@/types/user';

// 1. Definieer de structuur van onze context-data.
// We kunnen ervan uitgaan dat 'user' altijd aanwezig zal zijn binnen deze provider,
// omdat de layout die hem gebruikt, zal redirecten als de gebruiker niet is ingelogd.
type AuthContextType = {
  user: UserProfile;
};

// 2. Creëer de context. We geven een 'undefined' default waarde om te kunnen
// controleren of de hook wel correct binnen de provider wordt gebruikt.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Maak de Provider component.
// Deze ontvangt de 'user' data als prop van een Server Component (zoals dashboard/layout.tsx).
export default function AuthProvider({
  user,
  children,
}: {
  user: UserProfile;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Creëer een custom hook voor eenvoudig en veilig gebruik.
// Dit wordt de standaardmanier voor client components om de ingelogde gebruiker op te halen.
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Als een component deze hook gebruikt buiten de AuthProvider,
  // gooien we een duidelijke foutmelding. Dit voorkomt bugs.
  if (context === undefined) {
    throw new Error('useAuth moet binnen een AuthProvider gebruikt worden');
  }

  return context;
};
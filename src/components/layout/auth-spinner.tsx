'use client';

import { HashLoader } from 'react-spinners';

/**
 * MENTOR'S OPMERKING: De "Gold Standard" Spinner
 *
 * Dit is nu een puur presentatie-component. Het toont enkel een spinner,
 * gecentreerd op het scherm. De logica WANNEER deze getoond wordt, zit
 * volledig in de <AuthProvider>. Deze kijkt naar de 'isInitialized' state.
 *
 * Dit houdt onze componenten simpel, gefocust en herbruikbaar. Het heeft
 * geen 'children' of interne state meer nodig.
 */
export function AuthSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {/* De kleur is prima, maar voor consistentie kan je later een
          kleur uit je tailwind.config.js gebruiken, bv. `colors.primary`. */}
      <HashLoader color="#4d7c0f" loading size={50} />
    </div>
  );
}

// We exporteren het als named export voor consistentie met de rest van de codebase.
export default AuthSpinner;
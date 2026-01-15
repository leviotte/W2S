'use client';

import { HashLoader } from 'react-spinners';

/**

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
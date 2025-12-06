/**
 * src/components/providers/theme-provider.tsx
 *
 * Client Component die de themaprovider van 'next-themes' wikkelt.
 * Dit is nodig omdat thema-switching afhankelijk is van client-side state en localStorage.
 * Deze wordt in de RootLayout gebruikt om de hele applicatie te omvatten.
 */
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// MENTOR-VERBETERING: We importeren niet langer het type via een diep pad.
// Dit is de robuuste, "gold standard" manier. We leiden de props af
// van de component zelf. Dit breekt nooit, zelfs niet bij library updates.
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
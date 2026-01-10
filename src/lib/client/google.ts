'use client';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let googleScriptLoadingPromise: Promise<void> | null = null;

/**
 * Zorgt dat Google GSI script exact 1x geladen wordt
 */
function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.google?.accounts) {
    return Promise.resolve();
  }

  if (googleScriptLoadingPromise) {
    return googleScriptLoadingPromise;
  }

  googleScriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google GSI script kon niet laden'));

    document.head.appendChild(script);
  });

  return googleScriptLoadingPromise;
}

export const googleSignInClient = {
  async getIdToken(): Promise<string> {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID ontbreekt');
    }

    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      throw new Error('Google API niet beschikbaar na script load');
    }

    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: (response: any) => {
            if (response?.credential) {
              resolve(response.credential);
            } else {
              reject(new Error('Geen Google ID token ontvangen'));
            }
          },
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment()
          ) {
            reject(new Error('Google login geannuleerd'));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  },
};

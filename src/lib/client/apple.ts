'use client';

declare global {
  interface Window {
    AppleID?: any;
  }
}

const APPLE_SCRIPT_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

let appleScriptPromise: Promise<void> | null = null;

/**
 * Laadt Apple Sign-In SDK exact 1x
 */
function loadAppleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.AppleID) {
    return Promise.resolve();
  }

  if (appleScriptPromise) {
    return appleScriptPromise;
  }

  appleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${APPLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Apple Sign-In SDK kon niet laden'));

    document.head.appendChild(script);
  });

  return appleScriptPromise;
}

export const appleSignInClient = {
  async getIdToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

    if (!clientId) {
      throw new Error('NEXT_PUBLIC_APPLE_CLIENT_ID ontbreekt');
    }
    if (!redirectURI) {
      throw new Error('NEXT_PUBLIC_APPLE_REDIRECT_URI ontbreekt');
    }

    await loadAppleScript();

    if (!window.AppleID?.auth) {
      throw new Error('AppleID SDK niet beschikbaar');
    }

    return new Promise((resolve, reject) => {
      try {
        window.AppleID.auth.init({
          clientId,
          scope: 'name email',
          redirectURI,
          usePopup: true,
        });

        window.AppleID.auth
          .signIn()
          .then((response: any) => {
            const token = response?.authorization?.id_token;
            if (!token) {
              reject(new Error('Geen Apple ID token ontvangen'));
              return;
            }
            resolve(token);
          })
          .catch((err: any) => {
            reject(
              new Error(
                err?.error || err?.message || 'Apple login geannuleerd'
              )
            );
          });
      } catch (err: any) {
        reject(err);
      }
    });
  },
};

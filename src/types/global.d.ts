// src/types/global.d.ts
declare global {
  interface Window {
    recaptchaVerifier?: any;
    confirmationResult?: any;
  }
}

export {};

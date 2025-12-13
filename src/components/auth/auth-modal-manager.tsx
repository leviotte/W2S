'use client';

import { useModalStore } from '@/lib/store/use-modal-store';
import { LoginModal } from './login-modal';
import { RegisterModal } from './register-modal';

export function AuthModalManager() {
  const { 
    isOpen, 
    type, 
    returnUrl, 
    close, 
    switchToLogin, 
    switchToRegister, 
    switchToForgotPassword 
  } = useModalStore();

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={isOpen && type === 'login'}
        onClose={close}
        onSwitchToRegister={switchToRegister}
        onSwitchToForgotPassword={switchToForgotPassword}
        returnUrl={returnUrl}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isOpen && type === 'register'}
        onClose={close}
        onSwitchToLogin={switchToLogin}
      />

      {/* TODO: Forgot Password Modal - Add later if needed */}
      {/* <ForgotPasswordModal
        isOpen={isOpen && type === 'forgotPassword'}
        onClose={close}
        onSwitchToLogin={switchToLogin}
      /> */}
    </>
  );
}
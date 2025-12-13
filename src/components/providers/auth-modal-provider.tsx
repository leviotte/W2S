'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LoginModal } from '@/components/auth/login-modal';
import { RegisterModal } from '@/components/auth/register-modal';

interface AuthModalContextType {
  showLoginModal: (returnUrl?: string) => void;
  showRegisterModal: () => void;
  closeModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | undefined>();

  const showLoginModal = (url?: string) => {
    setReturnUrl(url);
    setIsLoginOpen(true);
    setIsRegisterOpen(false);
  };

  const showRegisterModal = () => {
    setIsRegisterOpen(true);
    setIsLoginOpen(false);
  };

  const closeModals = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setReturnUrl(undefined);
  };

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  return (
    <AuthModalContext.Provider value={{ showLoginModal, showRegisterModal, closeModals }}>
      {children}
      
      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeModals}
        onSwitchToRegister={handleSwitchToRegister}
        returnUrl={returnUrl}
      />
      
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={closeModals}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
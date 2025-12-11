/**
 * src/components/auth/auth-modal.tsx
 */
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Jouw formulieren worden hier geïmporteerd
import { LoginForm } from './login-form';
import RegisterForm from './register-form';

// Een type voor de verschillende views in de modal
type AuthView = 'login' | 'register' | 'forgot_password';

export default function AuthModal() {
  // ✅ CORRECTE API: activeModal i.p.v. isLoginModalOpen
  const activeModal = useAuthStore((state) => state.activeModal);
  const closeModal = useAuthStore((state) => state.closeModal);
  const onSuccessCallback = useAuthStore((state) => state.onSuccessCallback);

  // De 'view' is nu LOKALE state van dit component.
  const [view, setView] = useState<AuthView>('login');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeModal();
      // Reset de view naar 'login' wanneer de modal sluit
      setTimeout(() => setView('login'), 300);
    }
  };

  const handleSuccess = () => {
    closeModal();
    if (onSuccessCallback) {
      onSuccessCallback();
    }
    setTimeout(() => setView('login'), 300);
  };

  // Functies om de lokale view state aan te passen
  const switchToLogin = () => setView('login');
  const switchToRegister = () => setView('register');
  const switchToForgotPassword = () => setView('forgot_password');

  const renderContent = () => {
    switch (view) {
      case 'register':
        return <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={switchToLogin} />;
      
      case 'forgot_password':
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold">Wachtwoord Resetten</h2>
            <p className="mt-2 text-muted-foreground">Dit formulier komt binnenkort.</p>
            <button onClick={switchToLogin} className="mt-4 text-sm text-primary underline">
              Terug naar login
            </button>
          </div>
        );

      case 'login':
      default:
        return (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        );
    }
  };

  // ✅ OPEN ALLEEN ALS activeModal NIET NULL IS
  const isOpen = activeModal !== null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
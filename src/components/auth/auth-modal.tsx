'use client';

import { useAuthStore } from '@/lib/store/use-auth-store';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import LoginForm from './login-form';
import RegisterForm from './register-form';
// import ForgotPasswordForm from './forgot-password-form';

export default function AuthModal() {
  // We halen nu het state-object en de setter-functie op
  const { authModal, setAuthModalState } = useAuthStore();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setAuthModalState({ open: false });
    }
  };

  // De 'switch' functies worden veel eenvoudiger
  const switchToLogin = () => setAuthModalState({ view: 'login' });
  const switchToRegister = () => setAuthModalState({ view: 'register' });
  const switchToForgotPassword = () => setAuthModalState({ view: 'forgot_password' });
  const handleSuccess = () => setAuthModalState({ open: false });

  const renderContent = () => {
    switch (authModal.view) {
      case 'register':
        return <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={switchToLogin} />;
      
      case 'forgot_password':
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold">Wachtwoord Resetten</h2>
            <p className="text-muted-foreground mt-2">Dit formulier komt binnenkort.</p>
            <button onClick={switchToLogin} className="text-sm text-primary underline mt-4">
              Terug naar login
            </button>
          </div>
        );

      case 'login':
      default:
        // Alle props worden nu correct doorgegeven
        return (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        );
    }
  };

  return (
    <Dialog open={authModal.open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
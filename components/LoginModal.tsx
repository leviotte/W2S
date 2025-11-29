"use client";

import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import PasswordResetForm from "@/components/PasswordResetForm";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onLoginSuccess,
}: LoginModalProps) {
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-50 flex flex-col items-center justify-center rounded-lg bg-slate-50 p-6 md:p-10 w-full max-w-sm md:max-w-3xl">
        {isResettingPassword ? (
          <PasswordResetForm
            isOpen={isOpen}
            onClose={onClose}
            backToLogin={() => setIsResettingPassword(false)}
          />
        ) : (
          <LoginForm
            isOpen={isOpen}
            onClose={onClose}
            onSwitchToRegister={onSwitchToRegister}
            onLoginSuccess={onLoginSuccess}
            resetPassword={() => setIsResettingPassword(true)}
          />
        )}
      </div>
    </div>
  );
}

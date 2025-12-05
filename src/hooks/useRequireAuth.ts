import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { useAuth } from '@/app/dashboard/layout';

export const useRequireAuth = () => {
  const { currentUser } = useAuthStore();
  const { showLoginModal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      showLoginModal();
      router.push('/');
    }
  }, [currentUser, router, showLoginModal]);

  return currentUser;
};

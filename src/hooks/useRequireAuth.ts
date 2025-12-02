import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/src/lib/store/useStore';
import { useAuth } from '@/src/app/dashboard/layout';

export const useRequireAuth = () => {
  const { currentUser } = useStore();
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

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { useAuth } from '@/components/AuthContext';

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

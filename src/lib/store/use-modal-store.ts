/**
 * src/lib/store/use-modal-store.ts
 */
import { create } from 'zustand';

type ModalState = {
  isLoginModalOpen: boolean;
  onSuccessCallback: (() => void) | null;
  showLoginModal: (onSuccess?: () => void) => void;
  hideLoginModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  isLoginModalOpen: false,
  onSuccessCallback: null,
  showLoginModal: (onSuccess) => set({ isLoginModalOpen: true, onSuccessCallback: onSuccess || null }),
  hideLoginModal: () => set({ isLoginModalOpen: false, onSuccessCallback: null }),
}));
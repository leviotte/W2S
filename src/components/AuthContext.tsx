// Path: app/context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import LoginModal from "@/src/components/LoginModal";
import RegisterModal from "@/src/components/event/RegisterModal";
import { useStore } from "@/src/lib/store/useStore";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/src/types/global";

interface AuthContextType {
  showLoginModal: (onSuccess?: () => void) => void;
  showRegisterModal: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginSuccessCallback, setLoginSuccessCallback] = useState<
    (() => void) | undefined
  >();
  const router = useRouter();
  const { loadEvents } = useStore();
  const memoizedLoadEvents = useCallback(() => loadEvents(), [loadEvents]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);

      if (user && user.emailVerified) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { emailVerified: true });
      }

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            const activeProfileId = localStorage.getItem("activeProfile");

            if (activeProfileId && activeProfileId !== "main-account") {
              const profileDoc = await getDoc(doc(db, `profiles/${activeProfileId}`));
              if (profileDoc.exists()) {
                const profileData = profileDoc.data();
                useStore.setState({
                  currentUser: {
                    ...userData,
                    id: user.uid,
                    name: profileData.name,
                    avatarURL: profileData.avatarURL,
                    birthdate: profileData?.birthdate,
                    phone: profileData?.phone,
                    address: profileData?.address,
                  },
                });
              } else {
                console.warn("Active profile not found.");
                useStore.setState({ currentUser: { ...userData, id: user.uid } });
              }
            } else {
              useStore.setState({ currentUser: { ...userData, id: user.uid } });
            }

            try {
              await loadEvents();
            } catch (error) {
              console.error("Error loading events:", error);
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        useStore.setState({ currentUser: null, events: [], wishlists: [] });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    if (loginSuccessCallback) {
      loginSuccessCallback();
      setLoginSuccessCallback(undefined);
    }
    setIsLoginModalOpen(false);
  };

  const showLoginModal = (onSuccess?: () => void, redirectPath = "/dashboard") => {
    const currentUrl = window.location.href;
    setIsLoginModalOpen(true);
    setLoginSuccessCallback(() => () => {
      if (onSuccess) onSuccess();
      if (
        !currentUrl.includes("/event/participation/") &&
        !currentUrl.includes("/event/self-register/")
      ) {
        router.push(redirectPath);
      }
    });
  };

  const showRegisterModal = () => setIsRegisterModalOpen(true);

  return (
    <AuthContext.Provider
      value={{ showLoginModal, showRegisterModal, isAuthenticated, loading }}
    >
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

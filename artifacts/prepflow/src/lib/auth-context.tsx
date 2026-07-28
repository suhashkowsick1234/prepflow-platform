import React, { createContext, useContext, useEffect, useState } from "react";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "phone";
  phone?: string;
  createdAt: number;
}

interface AuthState {
  user: MockUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithGoogle: (name: string, email: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  updateUserProfile: (name: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const AUTH_STORAGE_KEY = "prepflow-auth";


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  const loginWithGoogle = async (name: string, email: string) => {
    setIsLoading(true);
    // Simulate OAuth flow delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const seed = name.split(" ")[0]?.toLowerCase() || "user";
    const newUser: MockUser = {
      id: `google_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`,
      provider: "google",
      createdAt: Date.now(),
    };
    setUser(newUser);
    setIsLoading(false);
    setShowLoginModal(false);
  };

  const loginWithPhone = async (phone: string, _otp: string) => {
    setIsLoading(true);
    // Simulate OTP verification delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const cleaned = phone.replace(/\D/g, "").slice(-4);
    const newUser: MockUser = {
      id: `phone_${Date.now()}`,
      name: `User ${cleaned}`,
      email: `user${cleaned}@prepflow.app`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}&backgroundColor=c0aede`,
      provider: "phone",
      phone,
      createdAt: Date.now(),
    };
    setUser(newUser);
    setIsLoading(false);
    setShowLoginModal(false);
  };

  const updateUserProfile = (name: string, email: string) => {
    setUser((prev) => {
      if (!prev) {
        return {
          id: `custom_${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
          provider: "google",
          createdAt: Date.now(),
        };
      }
      const seed = name.trim().split(" ")[0]?.toLowerCase() || "user";
      return {
        ...prev,
        name: name.trim(),
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`,
      };
    });
  };

  const logout = () => {
    setUser(null);
    setShowLoginModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        showLoginModal,
        openLoginModal,
        closeLoginModal,
        loginWithGoogle,
        loginWithPhone,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

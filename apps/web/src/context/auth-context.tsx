"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CurrentUserResponse } from "@atelier/types";
import { api, setAccessToken } from "../lib/api-client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUserResponse | null;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUserResponse | null>(null);

  const loadCurrentUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    setStatus("authenticated");
  }, []);

  // On first load there's no access token in memory yet — try to
  // silently restore a session from the httpOnly refresh cookie.
  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await api.refresh();
        setAccessToken(accessToken);
        await loadCurrentUser();
      } catch {
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    })();
  }, [loadCurrentUser]);

  const register: AuthContextValue["register"] = async (input) => {
    const { accessToken } = await api.register(input);
    setAccessToken(accessToken);
    await loadCurrentUser();
  };

  const login: AuthContextValue["login"] = async (input) => {
    const { accessToken } = await api.login(input);
    setAccessToken(accessToken);
    await loadCurrentUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  return (
    <AuthContext.Provider
      value={{ status, user, register, login, logout, refreshUser: loadCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

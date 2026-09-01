"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Tenant, UserRole } from "../db/types";
import { store } from "../db/store";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  currentUser: User | null;
  currentTenant: Tenant;
  availableTenants: Tenant[];
  availableUsers: User[];
  isLoggedIn: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tenants] = useState<Tenant[]>(() => store.getTenants());
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => store.getTenants()[0]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>(() => store.getUsers());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved session in localStorage
    const savedUserId = typeof window !== "undefined" ? localStorage.getItem("rt_user_id") : null;
    if (savedUserId) {
      const u = store.getUserById(savedUserId);
      if (u) {
        setCurrentUser(u);
        const t = store.getTenantById(u.tenantId) || store.getTenants()[0];
        setCurrentTenant(t);
      } else {
        // Default to Super Admin for immediate seamless start
        const superAdmin = store.getUsers().find((usr) => usr.role === "SUPER_ADMIN");
        if (superAdmin) {
          setCurrentUser(superAdmin);
          localStorage.setItem("rt_user_id", superAdmin.id);
        }
      }
    } else {
      // Default to Super Admin on first load
      const superAdmin = store.getUsers().find((usr) => usr.role === "SUPER_ADMIN");
      if (superAdmin) {
        setCurrentUser(superAdmin);
        localStorage.setItem("rt_user_id", superAdmin.id);
      }
    }
  }, []);

  const login = (email: string, pass: string): boolean => {
    const user = store.authenticate(email, pass);
    if (!user) return false;

    setCurrentUser(user);
    const t = store.getTenantById(user.tenantId) || store.getTenants()[0];
    setCurrentTenant(t);
    if (typeof window !== "undefined") {
      localStorage.setItem("rt_user_id", user.id);
    }
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("rt_user_id");
    }
    router.push("/login");
  };

  const switchTenant = (tenantId: string) => {
    const t = store.getTenantById(tenantId);
    if (t) setCurrentTenant(t);
  };

  const refreshUsers = () => {
    setAvailableUsers([...store.getUsers()]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentTenant,
        availableTenants: tenants,
        availableUsers,
        isLoggedIn: !!currentUser,
        login,
        logout,
        switchTenant,
        refreshUsers,
      }}
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
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
  isLoaded: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  refreshUsers: () => void;
  checkRouteAccess: (pathname: string) => { allowed: boolean; requiredRole?: string; reason?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define strict route permission rules
const ROUTE_PERMISSIONS: Array<{ prefix: string; roles: UserRole[]; description: string }> = [
  { prefix: "/portal/admin", roles: ["SUPER_ADMIN"], description: "Super Admin Platform Oversight & Audit Chain" },
  { prefix: "/portal/treasury", roles: ["SUPER_ADMIN", "OWNER"], description: "Owner Pocket & Showroom Treasury" },
  { prefix: "/portal/users", roles: ["SUPER_ADMIN", "OWNER"], description: "Staff & User Role Access Matrix" },
  { prefix: "/portal/products", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"], description: "Products Catalog & Inventory" },
  { prefix: "/portal/data-management", roles: ["SUPER_ADMIN", "OWNER"], description: "Production Clean Setup Controller" },
  { prefix: "/portal/import", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"], description: "Excel Bulk Customer Migration" },
  { prefix: "/portal/customers/legacy-entry", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "Fast Legacy Customer & Old Khata Entry" },
  { prefix: "/portal/customers/new", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "Customer KYC Registration" },
  { prefix: "/portal/customers", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "Customer KYC Directory" },
  { prefix: "/portal/claims", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "Warranty Claims & Product Returns / Wapsi Requests" },
  { prefix: "/portal/plans/new", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"], description: "Create Hire-Purchase Plan" },
  { prefix: "/portal/plans", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "Installment Portfolio" },
  { prefix: "/portal/recovery", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "Field Recovery Portal" },
  { prefix: "/portal/handovers", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"], description: "2-Step Cash Handovers" },
  { prefix: "/portal/expenses", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"], description: "Daily Showroom Expenses" },
  { prefix: "/portal/customer-portal", roles: ["SUPER_ADMIN", "CUSTOMER"], description: "Kharedar Self-Service" },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tenants] = useState<Tenant[]>(() => store.getTenants());
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => store.getTenants()[0]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>(() => store.getUsers());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check saved session in localStorage ONLY
    const savedUserId = typeof window !== "undefined" ? localStorage.getItem("rt_user_id") : null;
    if (savedUserId) {
      const u = store.getUserById(savedUserId);
      if (u && u.status === "ACTIVE") {
        setCurrentUser(u);
        const t = store.getTenantById(u.tenantId) || store.getTenants()[0];
        setCurrentTenant(t);
      } else {
        localStorage.removeItem("rt_user_id");
        setCurrentUser(null);
      }
    } else {
      // Strictly unauthenticated by default!
      setCurrentUser(null);
    }
    setIsLoaded(true);
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

  const checkRouteAccess = (pathname: string): { allowed: boolean; requiredRole?: string; reason?: string } => {
    if (!currentUser) {
      return { allowed: false, reason: "NOT_AUTHENTICATED" };
    }

    if (currentUser.role === "SUPER_ADMIN") {
      return { allowed: true };
    }

    // Match path against rules
    for (const rule of ROUTE_PERMISSIONS) {
      if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
        if (!rule.roles.includes(currentUser.role)) {
          return {
            allowed: false,
            requiredRole: rule.roles.join(" یا "),
            reason: `اس صفحے (${rule.description}) تک رسائی صرف (${rule.roles.join(", ")}) کے پاس ہے۔`,
          };
        }
        return { allowed: true };
      }
    }

    // General /portal overview is accessible to all logged-in roles
    return { allowed: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentTenant,
        availableTenants: tenants,
        availableUsers,
        isLoggedIn: !!currentUser,
        isLoaded,
        login,
        logout,
        switchTenant,
        refreshUsers,
        checkRouteAccess,
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
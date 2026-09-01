"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Tenant, UserRole } from "../db/types";

interface AuthContextType {
  currentUser: User;
  currentTenant: Tenant;
  availableUsers: User[];
  availableTenants: Tenant[];
  switchUser: (userId: string) => void;
  switchTenant: (tenantId: string) => void;
  switchRoleTier: (role: UserRole) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const defaultTenants: Tenant[] = [
  {
    id: "tenant_lhr",
    name: "RAJPOOT TRADERS - Lahore Main Flagship",
    code: "RT-LHR",
    brandHeader: "RAJPOOT TRADERS - Easy Installment & Electronics Hub",
    urduBrandName: "راجپوت ٹریڈرز - آسان اقساط کا بااعتماد ادارہ",
    contact: "+92 300 8472910",
    address: "Plot 14-B, Main Boulevard, Gulberg III, Lahore",
    city: "Lahore",
    licenseTier: "ENTERPRISE",
    status: "ACTIVE",
  },
  {
    id: "tenant_fsd",
    name: "RAJPOOT TRADERS - Faisalabad Hub",
    code: "RT-FSD",
    brandHeader: "RAJPOOT TRADERS - Easy Installment & Electronics Hub",
    urduBrandName: "راجپوت ٹریڈرز - فیصل آباد برانچ",
    contact: "+92 321 6654321",
    address: "Katchery Bazaar, Faisalabad",
    city: "Faisalabad",
    licenseTier: "BRANCH",
    status: "ACTIVE",
  },
];

const defaultUsers: User[] = [
  {
    id: "usr_superadmin",
    tenantId: "tenant_lhr",
    role: "SUPER_ADMIN",
    name: "Malik Tariq Rajpoot (Super Admin)",
    email: "boss@rajpoottraders.com",
    phone: "0300-8400001",
    branch: "Central Executive HQ",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_owner_lhr",
    tenantId: "tenant_lhr",
    role: "OWNER",
    name: "Chaudhry Kamran Rajpoot (Owner)",
    email: "owner.lhr@rajpoottraders.com",
    phone: "0300-8472910",
    branch: "Lahore Main Flagship",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_manager_lhr",
    tenantId: "tenant_lhr",
    role: "BRANCH_MANAGER",
    name: "Asim Raza (Branch Manager)",
    email: "asim.manager@rajpoottraders.com",
    phone: "0321-4455667",
    branch: "Lahore Main Flagship",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_rec_bilal",
    tenantId: "tenant_lhr",
    role: "FIELD_RECOVERY",
    name: "Muhammad Bilal (Recovery Officer)",
    email: "bilal.recovery@rajpoottraders.com",
    phone: "0333-7890123",
    branch: "Lahore Main Flagship",
    assignedArea: "Route-A (Gulberg / Model Town)",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_cust_usman",
    tenantId: "tenant_lhr",
    role: "CUSTOMER",
    name: "Hafiz Muhammad Usman (Kharedar)",
    email: "usman.kharedar@gmail.com",
    phone: "0322-9876543",
    branch: "Lahore Main Flagship",
    customerId: "cust_001",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUsers[1]); // Default to Owner
  const [currentTenant, setCurrentTenant] = useState<Tenant>(defaultTenants[0]);

  useEffect(() => {
    const savedUserId = localStorage.getItem("rt_active_user_id");
    const savedTenantId = localStorage.getItem("rt_active_tenant_id");
    if (savedUserId) {
      const u = defaultUsers.find((x) => x.id === savedUserId);
      if (u) setCurrentUser(u);
    }
    if (savedTenantId) {
      const t = defaultTenants.find((x) => x.id === savedTenantId);
      if (t) setCurrentTenant(t);
    }
  }, []);

  const switchUser = (userId: string) => {
    const u = defaultUsers.find((x) => x.id === userId);
    if (u) {
      setCurrentUser(u);
      localStorage.setItem("rt_active_user_id", u.id);
    }
  };

  const switchTenant = (tenantId: string) => {
    const t = defaultTenants.find((x) => x.id === tenantId);
    if (t) {
      setCurrentTenant(t);
      localStorage.setItem("rt_active_tenant_id", t.id);
    }
  };

  const switchRoleTier = (role: UserRole) => {
    const u = defaultUsers.find((x) => x.role === role);
    if (u) {
      setCurrentUser(u);
      localStorage.setItem("rt_active_user_id", u.id);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (currentUser.role === "SUPER_ADMIN") return true; // Super Admin has global override
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentTenant,
        availableUsers: defaultUsers,
        availableTenants: defaultTenants,
        switchUser,
        switchTenant,
        switchRoleTier,
        hasRole,
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

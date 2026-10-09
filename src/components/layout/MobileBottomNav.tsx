"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Bike,
  Wallet,
  Building2,
  FileText,
  ShieldCheck,
  Package,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { UserRole } from "@/lib/db/types";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const getRoleLinks = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { href: "/portal/admin/businesses", label: "Businesses", icon: Building2 },
          { href: "/portal/admin/blogs", label: "Blogs CMS", icon: FileText },
          { href: "/portal/admin", label: "Health", icon: ShieldCheck },
        ];
      case "OWNER":
        return [
          { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
          { href: "/portal/customers", label: "Customers", icon: Users },
          { href: "/portal/plans", label: "Plans", icon: FileSpreadsheet },
          { href: "/portal/recovery", label: "Recovery", icon: Bike },
          { href: "/portal/treasury", label: "Treasury", icon: Wallet },
        ];
      case "BRANCH_MANAGER":
        return [
          { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
          { href: "/portal/customers", label: "Customers", icon: Users },
          { href: "/portal/plans", label: "Plans", icon: FileSpreadsheet },
          { href: "/portal/products", label: "Inventory", icon: Package },
          { href: "/portal/handovers", label: "Handovers", icon: ArrowRightLeft },
        ];
      case "SALESMAN":
        return [
          { href: "/portal/customers", label: "Customers", icon: Users },
          { href: "/portal/plans", label: "New Plan", icon: FileSpreadsheet },
          { href: "/portal/products", label: "Products", icon: Package },
        ];
      case "FIELD_RECOVERY":
        return [
          { href: "/portal/recovery", label: "Recovery", icon: Bike },
          { href: "/portal/recovery/route-sheet", label: "Route Sheet", icon: FileSpreadsheet },
          { href: "/portal/handovers", label: "Handover", icon: ArrowRightLeft },
        ];
      case "CUSTOMER":
      default:
        return [
          { href: "/portal/customer-portal", label: "My Khata", icon: LayoutDashboard },
        ];
    }
  };

  const links = getRoleLinks(currentUser.role);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== "/portal" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
              isActive ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
            <span className="text-[10px] mt-0.5">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
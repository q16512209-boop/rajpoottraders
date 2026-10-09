"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileSpreadsheet, Bike, Wallet, Building2, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const links = isSuperAdmin
    ? [
        { href: "/portal/admin/businesses", label: "Businesses", icon: Building2 },
        { href: "/portal/admin/blogs", label: "Blogs CMS", icon: FileText },
        { href: "/portal/admin", label: "Platform Health", icon: ShieldCheck },
      ]
    : [
        { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
        { href: "/portal/customers", label: "Customers", icon: Users },
        { href: "/portal/plans", label: "Plans", icon: FileSpreadsheet },
        { href: "/portal/recovery", label: "Recovery", icon: Bike },
        { href: "/portal/treasury", label: "Cash Ledger", icon: Wallet },
      ];

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
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Users,
  FileSpreadsheet,
  Bike,
  CheckSquare,
  ShieldCheck,
  Receipt,
  FileText,
  Building2,
  UserCheck,
  CreditCard,
  LogOut,
  ExternalLink,
  ChevronDown,
  Layers,
  CircleDollarSign,
  Upload,
  Database,
  Volume2,
  X,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { UserRole } from "@/lib/db/types";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function PortalSidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, currentTenant, availableTenants, switchTenant, logout } = useAuth();

  if (!currentUser) return null;

  const roleBadgeInfo: Record<UserRole, { label: string; tier: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", tier: "Tier 0: Main Boss", color: "bg-purple-900/60 text-purple-200 border-purple-700" },
    OWNER: { label: "Shop Owner", tier: "Tier 1: Owner Pocket", color: "bg-amber-900/60 text-amber-200 border-amber-700" },
    BRANCH_MANAGER: { label: "Branch Manager", tier: "Tier 2: Counter & KYC", color: "bg-blue-900/60 text-blue-200 border-blue-700" },
    FIELD_RECOVERY: { label: "Recovery Officer", tier: "Tier 3: Field & Routes", color: "bg-emerald-900/60 text-emerald-200 border-emerald-700" },
    CUSTOMER: { label: "Customer / Kharedar", tier: "Tier 4: Self-Service", color: "bg-teal-900/60 text-teal-200 border-teal-700" },
  };

  const navItems = [
    {
      title: "Core Operations",
      links: [
        { href: "/portal", label: "Dashboard Overview", icon: LayoutDashboard, guideKey: "NEW_PLAN", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY", "CUSTOMER"] },
        { href: "/portal/users", label: "Staff & Role Management", icon: UserPlus, guideKey: "CUSTOMER_KYC", roles: ["SUPER_ADMIN", "OWNER"] },
        { href: "/portal/import", label: "Excel Bulk Importer", icon: Upload, guideKey: "IMPORT_EXCEL", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
        { href: "/portal/data-management", label: "Clean Production Setup", icon: Database, guideKey: "CLEAN_DATA", roles: ["SUPER_ADMIN", "OWNER"] },
      ],
    },
    {
      title: "Super Admin & Risk (Tier 0)",
      links: [
        { href: "/portal/admin", label: "Master Oversight & Audit Chain", icon: ShieldCheck, guideKey: "DEFULTER_RADAR", roles: ["SUPER_ADMIN"] },
        { href: "/portal/admin/blogs", label: "SEO Blog Post Publisher", icon: FileText, guideKey: "IMPORT_EXCEL", roles: ["SUPER_ADMIN"] },
      ],
    },
    {
      title: "Treasury & Finance (Tier 1)",
      links: [
        { href: "/portal/treasury", label: "Owner Pocket & Wallets", icon: Wallet, guideKey: "TREASURY", roles: ["SUPER_ADMIN", "OWNER"] },
        { href: "/portal/expenses", label: "Daily Expenses & Outflows", icon: CircleDollarSign, guideKey: "EXPENSE", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
        { href: "/portal/handovers", label: "2-Step Cash Handovers", icon: CheckSquare, guideKey: "HANDOVER", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"] },
      ],
    },
    {
      title: "Operations & KYC (Tier 2)",
      links: [
        { href: "/portal/customers", label: "KYC Vault & Defaulter Radar", icon: Users, guideKey: "DEFULTER_RADAR", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
        { href: "/portal/customers/legacy-entry", label: "Fast Old Khata Form (پرانا کھاتہ)", icon: UserCheck, guideKey: "IMPORT_EXCEL", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"] },
        { href: "/portal/customers/new", label: "Register Customer & Zamin", icon: UserPlus, guideKey: "CUSTOMER_KYC", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
        { href: "/portal/plans", label: "Installment Plans & Arrears", icon: FileSpreadsheet, guideKey: "LOG_PAYMENT", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"] },
        { href: "/portal/plans/new", label: "Create Hire-Purchase Plan", icon: CreditCard, guideKey: "NEW_PLAN", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
      ],
    },
    {
      title: "Field Recovery (Tier 3)",
      links: [
        { href: "/portal/recovery", label: "Mobile Recovery Portal", icon: Bike, guideKey: "LOG_PAYMENT", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"] },
        { href: "/portal/recovery/route-sheet", label: "Printable Route Sheets", icon: FileText, guideKey: "ROUTE_SHEET", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY"] },
      ],
    },
    {
      title: "Customer Self-Service (Tier 4)",
      links: [
        { href: "/portal/customer-portal", label: "My Installments & Receipts", icon: Receipt, guideKey: "PRINT_RECEIPT", roles: ["SUPER_ADMIN", "CUSTOMER"] },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
            <span className="text-amber-300 font-serif">R</span>T
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              RAJPOOT TRADERS
            </h2>
            <p className="text-[11px] text-emerald-400 font-medium">
              Enterprise Portal • v3.0
            </p>
          </div>
        </Link>

        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Logged-In User Profile Card */}
      <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-sm shrink-0 border border-emerald-500">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-bold text-white truncate">
                {currentUser.name}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleBadgeInfo[currentUser.role].color}`}>
            {roleBadgeInfo[currentUser.role].tier}
          </span>
          <button
            onClick={logout}
            className="text-[11px] font-urdu font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>لاگ آؤٹ</span>
          </button>
        </div>
      </div>

      {/* Branch Selector (for Super Admin) */}
      {currentUser.role === "SUPER_ADMIN" && (
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
            Active Branch (سپر ایڈمن ویو)
          </label>
          <div className="relative">
            <select
              value={currentTenant.id}
              onChange={(e) => switchTenant(e.target.value)}
              className="w-full bg-slate-800 text-xs font-semibold text-white border border-slate-700 rounded-lg px-2 py-1 appearance-none focus:outline-none focus:border-emerald-500 pr-7"
            >
              {availableTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
        {navItems.map((group, idx) => {
          const visibleLinks = group.links.filter(
            (link) => currentUser.role === "SUPER_ADMIN" || link.roles.includes(currentUser.role)
          );
          if (visibleLinks.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-1.5">
                {group.title}
              </h3>
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <div key={link.href} className="flex items-center justify-between group">
                    <Link
                      href={link.href}
                      onClick={onMobileClose}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive
                          ? "bg-emerald-700 text-white font-bold shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                    {link.guideKey && (
                      <div className="pl-1 shrink-0">
                        <UrduSpeaker guideKey={link.guideKey} size="sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Exit Link */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/40">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Public Showcase & Blog
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">Website</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex w-72 shrink-0 border-r border-slate-800 min-h-screen sticky top-0 h-screen">
        {content}
      </aside>

      {/* Mobile Drawer (Responsive Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
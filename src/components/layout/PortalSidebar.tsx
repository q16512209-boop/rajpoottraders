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
  ShieldCheck,
  FileText,
  Building2,
  LogOut,
  ExternalLink,
  ChevronDown,
  X,
  ArrowRightLeft,
  Receipt,
  Package,
  MapPin,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { UserRole } from "@/lib/db/types";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function getHomeLink(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/portal/admin/businesses";
    case "FIELD_RECOVERY":
      return "/portal/recovery";
    case "SALESMAN":
      return "/portal/plans";
    case "CUSTOMER":
      return "/portal/customer-portal";
    case "OWNER":
    case "BRANCH_MANAGER":
    default:
      return "/portal";
  }
}

export function PortalSidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, currentTenant, availableTenants, switchTenant, logout } = useAuth();

  if (!currentUser) return null;

  const roleBadgeInfo: Record<UserRole, { label: string; tier: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", tier: "Tier 0: Platform Boss", color: "bg-purple-900/60 text-purple-200 border-purple-700" },
    OWNER: { label: "Shop Owner", tier: "Tier 1: Owner Pocket", color: "bg-amber-900/60 text-amber-200 border-amber-700" },
    BRANCH_MANAGER: { label: "Branch Manager", tier: "Tier 2: Counter & Sales", color: "bg-blue-900/60 text-blue-200 border-blue-700" },
    SALESMAN: { label: "Sales Officer", tier: "Tier 2.5: Sales & KYC", color: "bg-cyan-900/60 text-cyan-200 border-cyan-700" },
    FIELD_RECOVERY: { label: "Recovery Officer", tier: "Tier 3: Field & Routes", color: "bg-emerald-900/60 text-emerald-200 border-emerald-700" },
    CUSTOMER: { label: "Customer", tier: "Tier 4: Self-Service", color: "bg-teal-900/60 text-teal-200 border-teal-700" },
  };

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  // Dedicated role-based navigation matrix
  const getNavGroups = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          {
            title: "Platform Administration",
            links: [
              { href: "/portal/admin/businesses", label: "Registered Businesses / Shops", icon: Building2, guideKey: "DEFULTER_RADAR" },
              { href: "/portal/admin/blogs", label: "SEO Blogs CMS", icon: FileText, guideKey: "IMPORT_EXCEL" },
              { href: "/portal/admin", label: "Cloud Backup & Database Health", icon: ShieldCheck, guideKey: "DEFULTER_RADAR" },
            ],
          },
        ];

      case "OWNER":
        return [
          {
            title: "Business Suite",
            links: [
              { href: "/portal", label: "Dashboard (All-in-One)", icon: LayoutDashboard, guideKey: "NEW_PLAN" },
              { href: "/portal/customers", label: "Customers & KYC Vault", icon: Users, guideKey: "CUSTOMER_KYC" },
              { href: "/portal/plans", label: "Installment Plans", icon: FileSpreadsheet, guideKey: "LOG_PAYMENT" },
              { href: "/portal/recovery", label: "Field Recovery (Overview)", icon: Bike, guideKey: "ROUTE_SHEET" },
              { href: "/portal/treasury", label: "Treasury & Pocket Cash", icon: Wallet, guideKey: "TREASURY" },
              { href: "/portal/handovers", label: "Cash Handovers (Accept Collection)", icon: ArrowRightLeft, guideKey: "HANDOVERS" },
              { href: "/portal/expenses", label: "Daily Expenses Logger", icon: Receipt, guideKey: "EXPENSES" },
              { href: "/portal/products", label: "Products & IMEI Inventory", icon: Package, guideKey: "PRODUCTS" },
              { href: "/portal/routes", label: "Routes & Area Zones", icon: MapPin, guideKey: "ROUTES" },
              { href: "/portal/users", label: "Staff & Roles Management", icon: UserCheck, guideKey: "STAFF" },
            ],
          },
        ];

      case "BRANCH_MANAGER":
        return [
          {
            title: "Branch Operations",
            links: [
              { href: "/portal", label: "Dashboard", icon: LayoutDashboard, guideKey: "NEW_PLAN" },
              { href: "/portal/customers", label: "Customers & KYC", icon: Users, guideKey: "CUSTOMER_KYC" },
              { href: "/portal/plans", label: "Installment Plans", icon: FileSpreadsheet, guideKey: "LOG_PAYMENT" },
              { href: "/portal/products", label: "Inventory Dispatch", icon: Package, guideKey: "PRODUCTS" },
              { href: "/portal/handovers", label: "Receive Field Handover", icon: ArrowRightLeft, guideKey: "HANDOVERS" },
              { href: "/portal/expenses", label: "Log Expenses", icon: Receipt, guideKey: "EXPENSES" },
              { href: "/portal/recovery", label: "Field Recovery View", icon: Bike, guideKey: "ROUTE_SHEET" },
            ],
          },
        ];

      case "SALESMAN":
        return [
          {
            title: "Sales & Booking",
            links: [
              { href: "/portal/customers", label: "Customers & KYC", icon: Users, guideKey: "CUSTOMER_KYC" },
              { href: "/portal/plans", label: "Installment Plans (New Booking)", icon: FileSpreadsheet, guideKey: "LOG_PAYMENT" },
              { href: "/portal/products", label: "Products & Inventory", icon: Package, guideKey: "PRODUCTS" },
            ],
          },
        ];

      case "FIELD_RECOVERY":
        return [
          {
            title: "Rider Recovery Operations",
            links: [
              { href: "/portal/recovery", label: "Mobile Recovery (Rider View)", icon: Bike, guideKey: "ROUTE_SHEET" },
              { href: "/portal/recovery/route-sheet", label: "Daily Route Sheet", icon: FileSpreadsheet, guideKey: "ROUTE_SHEET" },
              { href: "/portal/handovers", label: "Handover Cash to Till", icon: ArrowRightLeft, guideKey: "HANDOVERS" },
            ],
          },
        ];

      case "CUSTOMER":
      default:
        return [
          {
            title: "Customer Account",
            links: [
              { href: "/portal/customer-portal", label: "My Installments & Khata", icon: LayoutDashboard, guideKey: "CUSTOMER_PORTAL" },
            ],
          },
        ];
    }
  };

  const activeNavGroups = getNavGroups(currentUser.role);

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href={getHomeLink(currentUser.role)} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 border border-emerald-400/30">
            <span className="text-amber-300 font-serif">
              {isSuperAdmin ? "R" : currentTenant.name.slice(0, 1)}
            </span>
            {isSuperAdmin ? "T" : (currentTenant.name.split(" ")[1]?.slice(0, 1) || "T")}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate max-w-[160px]">
              {isSuperAdmin ? "RAJPOOT TRADERS" : currentTenant.name}
            </h2>
            <p className="text-[10px] text-emerald-400 font-medium truncate">
              {isSuperAdmin ? "Super Admin Platform" : `${currentTenant.city || currentTenant.code} • Portal`}
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
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Branch Switcher (Optional for Super Admin) */}
      {isSuperAdmin && (
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
            Active Tenant Context
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

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {activeNavGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-1">
              {group.title}
            </h3>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/portal" && pathname.startsWith(link.href));
              return (
                <div key={link.href} className="flex items-center justify-between group">
                  <Link
                    href={link.href}
                    onClick={onMobileClose}
                    className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
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
        ))}
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
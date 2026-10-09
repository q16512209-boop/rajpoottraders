"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Printer,
  FileText,
  Receipt,
  Bike,
  ChevronDown,
  Upload,
  Volume2,
  Building2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { QuickRecoveryModal } from "@/components/recovery/QuickRecoveryModal";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function PortalHeader({ onMenuToggle }: HeaderProps) {
  const { currentUser, currentTenant, availableTenants, switchTenant } = useAuth();
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [quickRecoveryOpen, setQuickRecoveryOpen] = useState(false);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        {/* Left: Mobile Hamburger & Branch Title / Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isSuperAdmin ? (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <select
                value={currentTenant.id}
                onChange={(e) => switchTenant(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 max-w-[200px] sm:max-w-[280px]"
              >
                {availableTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city || t.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[260px]">
                {currentTenant.name}
              </span>
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {currentTenant.code}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Recovery + Urdu Guide + Print Center */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Gold/Emerald 1-Click Quick Daily Recovery Button */}
          {!isSuperAdmin && (
            <button
              onClick={() => setQuickRecoveryOpen(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-black shadow-md border border-emerald-400/40 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              title="فوری ڈیلی ریکوری درج کریں"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-300 text-amber-300 shrink-0" />
              <span className="font-urdu whitespace-nowrap">
                ⚡ فوری ریکوری درج کریں
              </span>
            </button>
          )}

          {/* Global Urdu Voice Assistant Indicator */}
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
            <UrduSpeaker customText={`${currentTenant.name} پورٹل میں خوش آمدید۔ آپ کا سسٹم مکمل طور پر تیار ہے۔`} size="sm" />
            <span className="font-bold text-xs text-emerald-800">
              Voice Guide
            </span>
          </div>

          {/* Excel Importer Shortcut */}
          {!isSuperAdmin && (
            <Link
              href="/portal/import"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Import</span>
            </Link>
          )}

          {/* Quick Printable Document Selector */}
          {!isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => setPrintMenuOpen(!printMenuOpen)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Print Center</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {printMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in duration-150">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-2 py-1 block">
                    Official Document Layouts
                  </span>
                  <Link
                    href="/portal/print/contract/plan_001"
                    onClick={() => setPrintMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-semibold"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Legal Stamp Paper (Hire-Purchase)</span>
                  </Link>
                  <Link
                    href="/portal/print/receipt/plan_001"
                    onClick={() => setPrintMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-semibold"
                  >
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>80mm Thermal & A4 Receipt</span>
                  </Link>
                  <Link
                    href="/portal/print/route-sheet"
                    onClick={() => setPrintMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-semibold"
                  >
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span>High-Density Route Sheet</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* User Mini Profile */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-slate-300 object-cover"
            />
          </div>
        </div>
      </header>

      {/* 1-Click Quick Recovery Modal */}
      <QuickRecoveryModal
        isOpen={quickRecoveryOpen}
        onClose={() => setQuickRecoveryOpen(false)}
        onPaymentRecorded={() => {
          // If on portal or recovery page, trigger storage event / reload state
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("storage"));
          }
        }}
      />
    </>
  );
}
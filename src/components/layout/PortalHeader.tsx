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
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function PortalHeader({ onMenuToggle }: HeaderProps) {
  const { currentUser, currentTenant } = useAuth();
  const [printMenuOpen, setPrintMenuOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Mobile Hamburger & Branch Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[280px]">
            {currentTenant.name}
          </span>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {currentTenant.code}
          </span>
        </div>
      </div>

      {/* Right: Master Urdu Voice Toggle + Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Urdu Voice Assistant Indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
          <UrduSpeaker customText="راجپوت ٹریڈرز پورٹل میں خوش آمدید۔ آپ کا سسٹم مکمل طور پر تیار ہے۔" size="sm" />
          <span className="hidden md:inline font-bold text-xs text-emerald-800">
            Voice Guide
          </span>
        </div>

        {/* Excel Importer Shortcut */}
        <Link
          href="/portal/import"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>Excel Import</span>
        </Link>

        {/* Quick Printable Document Selector */}
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
  );
}
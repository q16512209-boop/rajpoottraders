"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Calculator, ShoppingBag, BookOpen, Search, Menu, X, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentTenant } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Urdu Slogan */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 flex items-center justify-center text-white font-bold text-2xl shadow-md group-hover:scale-105 transition-transform">
              <span className="text-amber-300 font-serif">R</span>T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  RAJPOOT TRADERS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Verified Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                راجپوت ٹریڈرز — آسان اقساط، الیکٹرانکس اور سولر فنانسنگ
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/products"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Products & Schemes
            </Link>
            <Link
              href="/calculator"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              Installment Calculator
            </Link>
            <Link
              href="/verify"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verify Plan / Receipt
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              SEO Guides
            </Link>
          </nav>

          {/* Portal Management Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/portal"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl shadow-sm hover:shadow transition-all group"
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <span>Management Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/products"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Products & Schemes
          </Link>
          <Link
            href="/calculator"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            <Calculator className="w-5 h-5 text-emerald-600" />
            Installment Calculator
          </Link>
          <Link
            href="/verify"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Verify Plan / Receipt
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            <BookOpen className="w-5 h-5 text-emerald-600" />
            SEO Guides & Blog
          </Link>
          <div className="pt-2">
            <Link
              href="/portal"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-bold text-white bg-emerald-700 rounded-xl"
            >
              <Lock className="w-5 h-5 text-amber-300" />
              Enter Management Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

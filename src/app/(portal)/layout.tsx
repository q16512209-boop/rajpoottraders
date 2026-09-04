"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  LogOut,
  Building,
  KeyRound,
  UserCheck,
} from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, currentTenant, isLoaded, checkRouteAccess, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto redirect to login if unauthenticated after load
  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.replace("/login");
    }
  }, [isLoaded, currentUser, router]);

  // 1. Loading State
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-2xl font-black shadow-2xl border border-emerald-400/40 animate-pulse">
          <span className="text-amber-300 font-serif">R</span>T
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Rajpoot Traders — Security Verification</h2>
          <p className="text-xs text-slate-400 font-urdu">Authenticating user session & role permissions...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Security Barrier (Not logged in)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl" />

        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto text-rose-400 shadow-xl">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest bg-rose-900/60 text-rose-300 px-3 py-1 rounded-full border border-rose-700">
                Security Barrier • Authentication Required
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Sign In Required
            </h1>
            <p className="text-xs text-slate-300 font-urdu leading-relaxed">
              Please sign in with your authorized credentials to access the Rajpoot Traders management portal.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-center">
            <UrduSpeaker
              customText="سیکیورٹی الرٹ۔ راجپوت ٹریڈرز کے سسٹم میں بغیر لاگ اِن داخلہ ممنوع ہے۔ براہ کرم پہلے لاگ اِن کریں۔"
              size="sm"
              showLabel
            />
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>Go to Sign In Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-1">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Back to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Branch License Suspended Check
  if (currentTenant.status === "SUSPENDED") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <AlertOctagon className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Branch License Suspended</h2>
          <p className="text-xs text-slate-400 font-urdu leading-relaxed">
            The portal license for branch ({currentTenant.name}) has been suspended. Please contact Super Admin Usama Rajpoot (musama4288921@gmail.com).
          </p>
          <button onClick={logout} className="px-4 py-2 bg-slate-800 text-xs rounded-xl font-bold">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 4. Role-Based Access Control (RBAC) Route Check
  const accessCheck = checkRouteAccess(pathname);
  if (!accessCheck.allowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/90 border border-rose-800 flex items-center justify-center mx-auto text-rose-400 shadow-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-rose-900/60 text-rose-300 px-3 py-1 rounded-full border border-rose-700">
              Access Restricted • 403 Forbidden
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Access Restricted
            </h1>
            <p className="text-xs text-rose-300 font-urdu leading-relaxed">
              {accessCheck.reason || "Your current user role does not have authorization to view this section."}
            </p>
          </div>

          {/* Current User Role Identity */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Active User:</span>
              <strong className="text-white">{currentUser.name}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Your Role:</span>
              <span className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-bold text-[10px]">
                {currentUser.role}
              </span>
            </div>
            {accessCheck.requiredRole && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 text-[11px]">Required Role:</span>
                <span className="text-emerald-400 font-bold text-[11px] font-urdu">
                  {accessCheck.requiredRole}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <UrduSpeaker
              customText="معذرت، آپ کے پاس اس سیکشن تک رسائی کے اختیارات نہیں ہیں۔ براہ کرم اپنے مجاز ڈیش بورڈ پر واپس جائیں۔"
              size="sm"
              showLabel
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/portal"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={logout}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authorized Portal Shell
  return (
    <div className="flex min-h-screen bg-slate-100">
      <PortalSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader onMenuToggle={() => setMobileDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 lg:pb-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
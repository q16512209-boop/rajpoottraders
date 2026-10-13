"use client";

import React, { useState, useEffect } from "react";
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
  Bell,
  Check,
  X,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { QuickRecoveryModal } from "@/components/recovery/QuickRecoveryModal";
import { ConcessionRequest } from "@/lib/db/types";
import { subscribeToSyncStatus, SyncStatus } from "@/lib/db/live-sync";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function PortalHeader({ onMenuToggle }: HeaderProps) {
  const { currentUser, currentTenant, availableTenants, switchTenant } = useAuth();
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [quickRecoveryOpen, setQuickRecoveryOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ connected: true, isSyncing: false });

  // Owner Notification Center State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [concessions, setConcessions] = useState<ConcessionRequest[]>(() => {
    if (!currentTenant) return [];
    return store.getConcessionRequests(currentTenant.id).filter((c) => c.status === "PENDING_APPROVAL");
  });

  useEffect(() => {
    const unsub = subscribeToSyncStatus((s) => setSyncStatus(s));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentTenant) return;
    const updateList = () => {
      setConcessions(
        store.getConcessionRequests(currentTenant.id).filter((c) => c.status === "PENDING_APPROVAL")
      );
    };
    updateList();
    window.addEventListener("storage", updateList);
    return () => window.removeEventListener("storage", updateList);
  }, [currentTenant]);

  const handleApprove = async (requestId: string) => {
    if (!currentUser) return;
    try {
      store.approveConcessionRequest({
        requestId,
        reviewer: currentUser,
      });

      try {
        await fetch("/api/concessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
          },
          body: JSON.stringify({
            action: "APPROVE",
            requestId,
            reviewerName: currentUser.name,
            reviewerId: currentUser.id,
            userRole: currentUser.role,
          }),
        });
      } catch (e) {}

      setConcessions((prev) => prev.filter((c) => c.id !== requestId));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve concession");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!currentUser) return;
    try {
      store.rejectConcessionRequest({
        requestId,
        reviewer: currentUser,
      });

      try {
        await fetch("/api/concessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
          },
          body: JSON.stringify({
            action: "REJECT",
            requestId,
            reviewerName: currentUser.name,
            reviewerId: currentUser.id,
            userRole: currentUser.role,
          }),
        });
      } catch (e) {}

      setConcessions((prev) => prev.filter((c) => c.id !== requestId));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject concession");
    }
  };

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

          {/* Live DB Syncing Loader Indicator */}
          {syncStatus.isSyncing && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500 text-amber-950 rounded-xl text-xs font-black animate-pulse shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span className="hidden sm:inline font-urdu">کلاؤڈ سنک ہو رہا ہے...</span>
            </div>
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

          {/* Owner Notification Bell for Concession / Maafi Requests */}
          {(currentUser.role === "OWNER" || isSuperAdmin) && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-xl border transition-all ${
                  concessions.length > 0
                    ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Concession / Maafi Requests Notification"
              >
                <Bell className="w-4 h-4" />
                {concessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {concessions.length}
                  </span>
                )}
              </button>

              {/* Concessions Dropdown Tray */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-black text-slate-900 text-sm">
                        Concession Requests (معافی کی درخواستیں)
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      {concessions.length} Pending
                    </span>
                  </div>

                  {concessions.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 space-y-1">
                      <Check className="w-6 h-6 mx-auto text-emerald-500" />
                      <p className="font-bold text-slate-700">Koi pending darkhwast nahi hai.</p>
                      <p className="text-[11px] font-urdu">تمام کسٹمرز اور اقساط اپ ٹو ڈیٹ ہیں۔</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {concessions.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                  #{req.khataNumber}
                                </span>
                                <span>{req.customerName}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-urdu">
                                فیلڈ آفیسر: <strong className="text-slate-800">{req.requestedBy}</strong>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Maafi / Discount</span>
                              <strong className="text-sm font-black text-rose-700 font-mono">
                                {formatPKR(req.discountAmount)}
                              </strong>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] flex justify-between font-mono">
                            <span>Total: {formatPKR(req.totalPrice)}</span>
                            <span className="text-emerald-700 font-bold">Paid: {formatPKR(req.totalPaid)}</span>
                            <span className="text-rose-600 font-bold">Bal: {formatPKR(req.remainingBalance)}</span>
                          </div>

                          <div className="text-[11px] text-slate-600 font-urdu bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                            <strong>وجہ:</strong> {req.reason}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-[11px] border border-rose-200 transition-colors"
                            >
                              ❌ Reject
                            </button>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-[11px] shadow transition-colors"
                            >
                              ✅ Approve Concession
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-2 text-center">
                    <Link
                      href="/portal/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      View All Concessions & Audit History →
                    </Link>
                  </div>
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
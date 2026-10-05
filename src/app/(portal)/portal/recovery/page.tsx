"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatPhone, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Printer,
  DollarSign,
  MessageSquare,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  Navigation,
  ArrowRight,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { IPTPLog, OfflineCollectionItem } from "@/lib/db/types";
import {
  OFFLINE_QUEUE_KEY,
  syncOfflineQueueToMongo,
  subscribeToSyncStatus,
} from "@/lib/db/live-sync";

export default function RecoveryPortalPage() {
  const { currentTenant, currentUser } = useAuth();
  const [plans, setPlans] = useState(() => store.getPlans(currentTenant?.id));
  const [ptpLogs, setPtpLogs] = useState(() => store.getPTPLogs(currentTenant?.id));
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");

  // Offline Buffer State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Pay Modal State
  const [payModalPlan, setPayModalPlan] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>("");

  // PTP Modal State
  const [ptpModalPlan, setPtpModalPlan] = useState<any>(null);
  const [ptpDate, setPtpDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [ptpAmount, setPtpAmount] = useState<number>(0);
  const [ptpReason, setPtpReason] = useState<IPTPLog["reason"]>("SALARY_DELAY");
  const [ptpNotes, setPtpNotes] = useState<string>("");

  // Messages & Slips
  const [msg, setMsg] = useState<{
    type: "success" | "error" | "offline";
    text: string;
    receiptId?: string;
    phone?: string;
    customerName?: string;
    ptpReminderText?: string;
    isOfflineSlip?: boolean;
    clientUUID?: string;
    amount?: number;
  } | null>(null);

  const loadOfflineQueue = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY) || localStorage.getItem("rt_offline_queue");
      if (raw) setOfflineQueue(JSON.parse(raw));
      else setOfflineQueue([]);
    } catch (e) {
      setOfflineQueue([]);
    }
  };

  // Connectivity Listeners & Local Storage Offline Queue
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    loadOfflineQueue();

    const unsub = subscribeToSyncStatus(() => {
      loadOfflineQueue();
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsub();
    };
  }, []);

  if (!currentUser || !currentTenant) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const sortedPlans = [...plans]
    .filter((p) => p.areaZone === selectedRoute || selectedRoute === "ALL")
    .sort((a, b) => {
      const aPtp = ptpLogs.find((ptp) => ptp.contractId === a.id && ptp.status === "PENDING");
      const bPtp = ptpLogs.find((ptp) => ptp.contractId === b.id && ptp.status === "PENDING");
      if (aPtp && !bPtp) return -1;
      if (!aPtp && bPtp) return 1;
      return 0;
    });

  // 1-Click Offline Sync Action
  const handleSyncOffline = async () => {
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueueToMongo(store);
      setPlans([...store.getPlans(currentTenant.id)]);
      loadOfflineQueue();
      setMsg({
        type: res.success ? "success" : "error",
        text: res.message,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: `Sync Failed: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Payment Collect Modal
  const handleOpenCollect = (p: any, isFull: boolean = true) => {
    setPayModalPlan(p);
    const nextInst = p.schedule.find((s: any) => s.status !== "PAID") || p.schedule[0];
    const due = nextInst ? nextInst.totalDue - (nextInst.amountPaid || 0) : p.monthlyInstallment;
    setPayAmount(isFull ? due : Math.round(due / 2));
    setPayNotes("");
    setMsg(null);
  };

  // Open PTP Modal
  const handleOpenPTP = (p: any) => {
    setPtpModalPlan(p);
    const nextInst = p.schedule.find((s: any) => s.status !== "PAID") || p.schedule[0];
    setPtpAmount(nextInst ? nextInst.totalDue : 0);
    setPtpNotes("");
    setMsg(null);
  };

  // Confirm Payment (Online or Offline-First)
  const handleConfirmCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalPlan || payAmount <= 0) return;

    const officerId = currentUser.id || "usr_recovery";
    const planId = payModalPlan.id;
    const clientUUID = `OFFLINE-${officerId}-${planId}-${Date.now()}`;

    if (!isOnline) {
      // Offline Emergency Buffer Handler
      const offlineItem = {
        clientUUID,
        tempId: clientUUID,
        planId: payModalPlan.id,
        planNumber: payModalPlan.planNumber,
        customerName: payModalPlan.customerName,
        customerPhone: payModalPlan.customerPhone,
        amount: Number(payAmount),
        collectedAt: new Date().toISOString(),
        collectedBy: currentUser.id,
        officerName: currentUser.name,
        notes: payNotes || "Field collection (Offline mode)",
        synced: false,
        paymentMethod: "CASH",
        offlineReceiptHash: clientUUID,
      };

      const updatedQueue = [...offlineQueue, offlineItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      localStorage.setItem("rt_offline_queue", JSON.stringify(updatedQueue));

      setMsg({
        type: "offline",
        text: `Offline وصولی محفوظ کر لی گئی۔ انٹرنیٹ آنے پر کلاؤڈ پر منتقل کریں۔`,
        receiptId: clientUUID,
        phone: payModalPlan.customerPhone,
        customerName: payModalPlan.customerName,
        isOfflineSlip: true,
        clientUUID,
        amount: Number(payAmount),
      });
      setPayModalPlan(null);
      return;
    }

    // Online Collection via Direct Live Path
    const nextInst = payModalPlan.schedule.find((s: any) => s.status !== "PAID") || payModalPlan.schedule[0];
    if (!nextInst) return;

    try {
      const res = store.recordInstallmentPayment({
        planId: payModalPlan.id,
        installmentNo: nextInst.installmentNo,
        amountPaid: Number(payAmount),
        collectedBy: currentUser.name,
        collectorRole: "FIELD_RECOVERY",
        notes: payNotes || "Field collection by recovery officer",
      });

      setPlans([...store.getPlans(currentTenant.id)]);
      setMsg({
        type: "success",
        text: `وصولی کامیاب: ${formatPKR(payAmount)} کیش بیگ میں شامل ہو گئی۔ رسید #${res.receiptId}`,
        receiptId: res.receiptId,
        phone: payModalPlan.customerPhone,
        customerName: payModalPlan.customerName,
        amount: Number(payAmount),
      });
      setPayModalPlan(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log field collection" });
    }
  };

  // Confirm PTP Log
  const handleConfirmPTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptpModalPlan) return;

    try {
      const createdPtp = store.logPTP({
        planId: ptpModalPlan.id,
        promisedDate: ptpDate,
        expectedAmount: Number(ptpAmount),
        reason: ptpReason,
        notes: ptpNotes,
        officerId: currentUser.id,
        officerName: currentUser.name,
      });

      setPtpLogs([...store.getPTPLogs(currentTenant.id)]);
      setPlans([...store.getPlans(currentTenant.id)]);
      setMsg({
        type: "success",
        text: `PTP وعدہ تاریخ محفوظ کر لی گئی: ${formatDate(ptpDate)} برائے ${formatPKR(ptpAmount)}.`,
        phone: ptpModalPlan.customerPhone,
        customerName: ptpModalPlan.customerName,
        ptpReminderText: `محترم ${ptpModalPlan.customerName} صاحب، راجپوت ٹریڈرز کی قسط کا وعدہ بتاریخ ${formatDate(ptpDate)} رقم ${formatPKR(ptpAmount)} نوٹ کر لیا گیا ہے۔ شکریہ۔`,
      });
      setPtpModalPlan(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log PTP" });
    }
  };

  return (
    <div className="space-y-5 pb-20 max-w-2xl mx-auto">
      {/* 1. TOP CONNECTIVITY & GPS STATUS BAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isOnline ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide">
                {isOnline ? "GPS & Cloud Online ✓" : "Offline Mode (Device Storage)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Officer: {currentUser.name} ({currentUser.assignedRouteZone || "All Routes"})
            </p>
          </div>
        </div>

        <Link
          href="/portal/recovery/route-sheet"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Route Sheet</span>
        </Link>
      </div>

      {/* 2. FLASHING 1-CLICK OFFLINE SYNC BANNER */}
      {offlineQueue.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-xl border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white text-emerald-900 rounded-xl font-black text-sm">
              {offlineQueue.length}
            </div>
            <div>
              <h4 className="font-black text-sm">Pending Offline Records Ready to Sync</h4>
              <p className="text-xs text-emerald-100 font-urdu">
                انٹرنیٹ موجود ہے۔ 1-کلک سے لائیو MongoDB پر منتقل کریں۔
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-700 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : `🔄 Sync Pending Offline Data (${offlineQueue.length})`}</span>
          </button>
        </div>
      )}

      {/* 3. NOTIFICATION & RECEIPT SLIP PREVIEW */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold space-y-2 shadow-md ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : msg.type === "offline"
              ? "bg-amber-50 border-amber-300 text-amber-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {msg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : msg.type === "offline" ? (
                <FileCheck className="w-5 h-5 text-amber-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              <span>{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs">
              ✕
            </button>
          </div>

          {/* Offline Acknowledgment Slip */}
          {msg.isOfflineSlip && (
            <div className="bg-white border border-amber-300 rounded-xl p-3 text-slate-800 space-y-1 font-mono text-[11px]">
              <div className="text-center font-black border-b border-amber-200 pb-1 text-amber-900">
                [Offline Recorded Receipt]
              </div>
              <div className="flex justify-between pt-1">
                <span>Customer:</span>
                <span className="font-bold">{msg.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-800">{formatPKR(msg.amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Client UUID:</span>
                <span className="text-[10px] text-slate-500">{msg.clientUUID?.slice(0, 22)}...</span>
              </div>
              <div className="text-center text-[10px] text-amber-700 pt-1">
                ⚠️ Recorded offline on device buffer. Will automatically upload on cloud sync.
              </div>
            </div>
          )}

          {msg.ptpReminderText && (
            <div className="pt-2 flex gap-2">
              <a
                href={`sms:${msg.phone}?body=${encodeURIComponent(msg.ptpReminderText)}`}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send SMS to Kharedar</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* 4. ROUTE SELECTOR BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <span>Select Assigned Route / Zone</span>
        </label>
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="w-full bg-slate-50 border-2 border-emerald-600 rounded-xl px-3 py-3 text-sm font-black text-slate-900 focus:outline-none"
        >
          <option value="ALL">All Routes ({plans.length} Total Customers)</option>
          <option value="Route-A (Gulberg / Model Town)">Route-A (Gulberg / Model Town)</option>
          <option value="Route-B (Johar Town / Faisal Town)">Route-B (Johar Town / Faisal Town)</option>
          <option value="محلہ رحمن آباد و مسلم بازار چنیوٹ">محلہ رحمن آباد و مسلم بازار چنیوٹ</option>
          <option value="لاہور روڈ و کچہری بازار چنیوٹ">لاہور روڈ و کچہری بازار چنیوٹ</option>
          <option value="جھنگ روڈ و فیصل آباد روڈ چنیوٹ">جھنگ روڈ و فیصل آباد روڈ چنیوٹ</option>
        </select>
      </div>

      {/* 5. ONE-THUMB CLIENT RECOVERY CARDS */}
      <div className="space-y-4">
        {sortedPlans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No pending clients on this route!</h4>
            <p className="text-xs text-slate-500 font-urdu">اس روٹ پر تمام وصولیاں مکمل ہیں۔</p>
          </div>
        ) : (
          sortedPlans.map((plan) => {
            const nextPending = plan.schedule.find((s: any) => s.status !== "PAID") || plan.schedule[0];
            const isOverdue = nextPending && nextPending.dueDate < todayStr && nextPending.status !== "PAID";
            const isDueToday = nextPending && nextPending.dueDate === todayStr;
            const activePtp = ptpLogs.find((ptp) => ptp.contractId === plan.id && ptp.status === "PENDING");
            const dueAmount = nextPending ? nextPending.totalDue - (nextPending.amountPaid || 0) : plan.monthlyInstallment;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 p-5 shadow-sm space-y-4 transition-all ${
                  activePtp
                    ? "border-amber-400 bg-amber-50/10"
                    : isOverdue
                    ? "border-rose-400 bg-rose-50/10"
                    : "border-slate-200 hover:border-emerald-500"
                }`}
              >
                {/* Header: Name, Khata, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {plan.customerName}
                      </h3>
                      {plan.khataNumber && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-full text-[10px]">
                          کھاتہ #{plan.khataNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {plan.productTitle} • <span className="font-mono text-[10px] text-slate-400">{plan.planNumber}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      activePtp
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : isOverdue
                        ? "bg-rose-100 text-rose-900 border-rose-300"
                        : "bg-emerald-100 text-emerald-900 border-emerald-300"
                    }`}
                  >
                    {activePtp ? "PTP ACTIVE" : isOverdue ? "OVERDUE" : isDueToday ? "DUE TODAY" : "ACTIVE"}
                  </span>
                </div>

                {/* Amount & Due Row */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Next Installment</span>
                    <strong className="text-base font-black text-slate-900">{formatPKR(dueAmount)}</strong>
                    <span className="text-[10px] text-slate-500 block">Due: {formatDate(nextPending?.dueDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Short Arrears (بقایا)</span>
                    <strong className={`text-base font-black ${plan.accumulatedShortArrears > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {formatPKR(plan.accumulatedShortArrears)}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">Zone: {plan.areaZone}</span>
                  </div>
                </div>

                {/* Active PTP Note */}
                {activePtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      <strong>Promised Date:</strong> {formatDate(activePtp.promisedDate)} ({formatPKR(activePtp.expectedAmount)})
                    </span>
                    <span className="text-[10px] font-bold bg-amber-200/80 px-2 py-0.5 rounded">PTP</span>
                  </div>
                )}

                {/* 1-Tap Quick Action Buttons (One-Thumb Optimized) */}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {/* 1-Tap Phone Call */}
                  <a
                    href={`tel:${plan.customerPhone}`}
                    className="py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Phone className="w-5 h-5 text-blue-700" />
                    <span>Call Now</span>
                  </a>

                  {/* 1-Tap Google Maps */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${plan.gpsLocation?.lat || 31.7200},${plan.gpsLocation?.lng || 72.9789}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Navigation className="w-5 h-5 text-emerald-700" />
                    <span>Directions</span>
                  </a>

                  {/* 1-Tap PTP Promise */}
                  <button
                    onClick={() => handleOpenPTP(plan)}
                    className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Clock className="w-5 h-5 text-amber-700" />
                    <span>Log PTP</span>
                  </button>
                </div>

                {/* Primary Large 1-Tap Payment Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenCollect(plan, true)}
                    className="py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Receive Full ({formatPKR(dueAmount)})</span>
                  </button>
                  <button
                    onClick={() => handleOpenCollect(plan, false)}
                    className="py-3.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs sm:text-sm rounded-xl transition-all"
                  >
                    <span>Receive Short / Partial</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. PAYMENT COLLECTION MODAL */}
      {payModalPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Record Field Payment
                </h3>
                <p className="text-xs text-slate-500 font-urdu">
                  {payModalPlan.customerName} ({payModalPlan.planNumber})
                </p>
              </div>
              <button
                onClick={() => setPayModalPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCollect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cash Collected Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-emerald-600 rounded-xl text-xl font-black text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Field Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full on spot / Received at shop..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">Destination Bag:</span>
                  <span>{currentUser.name} (Field In-Transit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Mode:</span>
                  <span>{isOnline ? "Online Live Save" : "Offline Storage Buffer"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalPlan(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md"
                >
                  {isOnline ? "Confirm Payment" : "Save Offline Slip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PTP PROMISE MODAL */}
      {ptpModalPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Log Promise to Pay (PTP)
                </h3>
                <p className="text-xs text-slate-500 font-urdu">
                  وعدہ تاریخ و رقم کا اندراج: {ptpModalPlan.customerName}
                </p>
              </div>
              <button
                onClick={() => setPtpModalPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Promised Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Promised Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Delay
                </label>
                <select
                  value={ptpReason}
                  onChange={(e: any) => setPtpReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="SALARY_DELAY">تنخواہ میں تاخیر (Salary Delay)</option>
                  <option value="MEDICAL_EMERGENCY">طبی ایمرجنسی / بیماری (Medical Emergency)</option>
                  <option value="OUT_OF_CITY_TRAVEL">شہر سے باہر سفر (Out of City Travel)</option>
                  <option value="FAMILY_ISSUE">گھریلو مجبوری (Family Issue)</option>
                  <option value="OTHER">دیگر وجہ (Other Reason)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPtpModalPlan(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  Save PTP Promise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
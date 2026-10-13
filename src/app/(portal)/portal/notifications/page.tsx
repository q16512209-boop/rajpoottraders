"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatDateTime, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { ConcessionRequest } from "@/lib/db/types";

export default function NotificationsPage() {
  const { currentTenant, currentUser } = useAuth();
  const [requests, setRequests] = useState<ConcessionRequest[]>(() =>
    store.getConcessionRequests(currentTenant?.id)
  );
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isOwnerOrSuperAdmin =
    currentUser?.role === "OWNER" || currentUser?.role === "SUPER_ADMIN";

  const refreshData = () => {
    if (currentTenant) {
      setRequests([...store.getConcessionRequests(currentTenant.id)]);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentTenant]);

  if (!currentUser || !currentTenant) return null;

  const handleApprove = async (req: ConcessionRequest) => {
    if (!isOwnerOrSuperAdmin) {
      setMsg({ type: "error", text: "صرف دکان کے مالک کو معافی منظور کرنے کی اجازت ہے۔" });
      return;
    }

    if (
      !confirm(
        `کیا آپ واقعی کھاتہ #${req.khataNumber} (${req.customerName}) کی Rs. ${req.discountAmount.toLocaleString()} رعایت منظور کرنا چاہتے ہیں؟\nاس سے کھاتہ مکمل کلئیر ہو جائے گا اور کیش دراز میں کوئی جعلی رقم درج نہیں ہو گی۔`
      )
    ) {
      return;
    }

    setActionLoadingId(req.id);
    try {
      store.approveConcessionRequest({
        requestId: req.id,
        reviewer: currentUser,
      });

      // Synchronize with backend API
      try {
        await fetch("/api/concessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
            "x-user-business-id": currentTenant.id,
          },
          body: JSON.stringify({
            action: "APPROVE",
            requestId: req.id,
            reviewerId: currentUser.id,
            reviewerName: currentUser.name,
            userRole: currentUser.role,
            businessId: currentTenant.id,
          }),
        });
      } catch (e) {}

      refreshData();
      setMsg({
        type: "success",
        text: `کھاتہ #${req.khataNumber} (${req.customerName}) کی Rs. ${req.discountAmount.toLocaleString()} رعایت منظور کر دی گئی ہے۔ کھاتہ مکمل کلئیر ہو گیا۔`,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to approve concession." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req: ConcessionRequest) => {
    if (!isOwnerOrSuperAdmin) {
      setMsg({ type: "error", text: "صرف دکان کے مالک کو درخواست مسترد کرنے کی اجازت ہے۔" });
      return;
    }

    const rejectionReason = prompt(
      `درخواست مسترد کرنے کی وجہ لکھیں (کھاتہ #${req.khataNumber} - ${req.customerName}):`,
      "مالک نے رعایت کی درخواست منظور نہیں کی۔ مکمل رقم وصول کی جائے۔"
    );

    if (rejectionReason === null) return;

    setActionLoadingId(req.id);
    try {
      store.rejectConcessionRequest({
        requestId: req.id,
        reviewer: currentUser,
        rejectionReason: rejectionReason || "Rejected by shop owner",
      });

      try {
        await fetch("/api/concessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
            "x-user-business-id": currentTenant.id,
          },
          body: JSON.stringify({
            action: "REJECT",
            requestId: req.id,
            rejectionReason,
            reviewerId: currentUser.id,
            reviewerName: currentUser.name,
            userRole: currentUser.role,
            businessId: currentTenant.id,
          }),
        });
      } catch (e) {}

      refreshData();
      setMsg({
        type: "success",
        text: `کھاتہ #${req.khataNumber} کی رعایت مسترد کر دی گئی۔ عملے کو مطلع کر دیا گیا ہے۔`,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to reject concession." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = requests.filter((r) => {
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    const q = search.toLowerCase().trim();
    const matchSearch =
      q === "" ||
      r.customerName.toLowerCase().includes(q) ||
      (r.khataNumber && r.khataNumber.toLowerCase().includes(q)) ||
      r.customerPhone.includes(q) ||
      r.requestedBy.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING_APPROVAL").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full">
              Audit & Approvals
            </span>
            <UrduSpeaker
              customText="رعایت و معافی کی درخواستیں اور آڈٹ ٹریل۔ صرف دکان کا مالک منظوری دے سکتا ہے۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-urdu">
            معافی و رعایت کی درخواستیں (Concession Approvals)
          </h1>
          <p className="text-xs text-slate-300 font-urdu">
            فیلڈ ریکوری افسران اور سیلز عملے کی طرف سے موصولہ رعایت کی تصدیق اور مکمل آڈٹ رجسٹر۔
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-2xl text-xs font-black font-urdu">
            ⏳ {pendingCount} زیرِ التوا درخواستیں
          </span>
        </div>
      </div>

      {/* Financial Fidelity Callout */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-950 space-y-1">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>مالیاتی شفافیت اور 100% حقیقی کیش بیلنس شیٹ اصول:</span>
        </div>
        <p className="font-urdu leading-relaxed text-emerald-900">
          معافی منظور ہونے پر کھاتہ "رعایت پر مکمل کلئیر (CLOSED_WITH_DISCOUNT)" بن جاتا ہے اور بقایا اقساط بند ہو جاتی ہیں۔
          <strong>کیش دراز اور ریکوری بیگ میں کوئی فرضی رقم جمع نہیں ہوتی</strong>، صرف خریدار سے موصول شدہ حقیقی کیش ہی کیش بک میں برقرار رہتا ہے۔
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-sm ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-urdu">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="کھاتہ #، گاہک کا نام، فون، یا عملے کا نام..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600 font-urdu"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { key: "ALL", label: "تمام", count: requests.length },
            { key: "PENDING_APPROVAL", label: "زیرِ التوا", count: pendingCount },
            { key: "APPROVED", label: "منظور شدہ", count: approvedCount },
            { key: "REJECTED", label: "مسترد شدہ", count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === tab.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterStatus === tab.key ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-800"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">کوئی درخواست موجود نہیں ہے</h4>
            <p className="text-xs text-slate-500 font-urdu">
              فلٹر کے مطابق کوئی معافی یا رعایت کی درخواست موصول نہیں ہوئی۔
            </p>
          </div>
        ) : (
          filtered.map((req) => {
            const isPending = req.status === "PENDING_APPROVAL";
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl border-2 p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
                  isPending
                    ? "border-amber-400 bg-amber-50/20"
                    : isApproved
                    ? "border-emerald-300"
                    : "border-slate-200 opacity-80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black font-mono text-xs rounded-xl shadow-sm">
                        کھاتہ #{req.khataNumber}
                      </span>
                      <h3 className="text-base font-black text-slate-900 font-urdu">
                        {req.customerName}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatPhone(req.customerPhone)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-urdu">
                      درخواست گزار: <strong>{req.requestedBy}</strong> ({req.officerRole}) • بتاریخ: {formatDateTime(req.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black font-urdu self-start border ${
                      isPending
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : isApproved
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-rose-100 text-rose-900 border-rose-300"
                    }`}
                  >
                    {isPending ? "⏳ زیرِ التوا (Pending)" : isApproved ? "✅ منظور شدہ (Approved)" : "❌ مسترد (Rejected)"}
                  </span>
                </div>

                {/* Financial Details Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">کل قیمت</span>
                    <strong className="text-slate-900 text-sm font-black">{formatPKR(req.totalPrice)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">کل موصولی</span>
                    <strong className="text-emerald-700 text-sm font-black">{formatPKR(req.totalPaid)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">موجودہ بقایا</span>
                    <strong className="text-rose-700 text-sm font-black">{formatPKR(req.remainingBalance)}</strong>
                  </div>
                  <div className="bg-amber-100/70 p-2 rounded-xl border border-amber-300">
                    <span className="text-[10px] text-amber-900 uppercase font-bold block">مطلوبہ رعایت</span>
                    <strong className="text-amber-900 text-sm font-black">{formatPKR(req.discountAmount)}</strong>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 text-xs font-urdu space-y-1">
                  <span className="font-bold text-slate-700">درخواست کی وجہ / عملے کے ریمارکس:</span>
                  <p className="text-slate-800 leading-relaxed">{req.reason}</p>
                </div>

                {/* Review status note */}
                {isApproved && (
                  <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs text-emerald-900 font-urdu flex items-center justify-between">
                    <span>
                      منظور کنندہ: <strong>{req.reviewedBy}</strong> بتاریخ: {formatDateTime(req.reviewedAt)}
                    </span>
                    <span className="font-bold">کھاتہ رعایت پر کلئیر ہو چکا ہے۔</span>
                  </div>
                )}

                {isRejected && (
                  <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 text-xs text-rose-900 font-urdu space-y-1">
                    <div>
                      مسترد کنندہ: <strong>{req.reviewedBy}</strong> بتاریخ: {formatDateTime(req.reviewedAt)}
                    </div>
                    <div>
                      <strong>وجہِ مستردگی:</strong> {req.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Actions: Owner Approve / Reject or Link to Khata */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <Link
                    href={`/portal/plans/${req.planId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 font-urdu"
                  >
                    <span>کھاتہ تفصیل اور ڈائری دیکھیں</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isPending && isOwnerOrSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(req)}
                        disabled={actionLoadingId === req.id}
                        className="px-4 py-2 bg-slate-100 hover:bg-rose-100 text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                      >
                        ❌ مسترد کریں
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={actionLoadingId === req.id}
                        className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>{actionLoadingId === req.id ? "منظور ہو رہا ہے..." : "✅ رعایت منظور کریں"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

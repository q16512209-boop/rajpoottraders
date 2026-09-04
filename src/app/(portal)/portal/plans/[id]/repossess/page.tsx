"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { formatPKR, formatDate, formatCNIC } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Package,
  Star,
  UserCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from "lucide-react";

export default function RepossessPlanPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, currentTenant } = useAuth();
  const planId = params.id as string;

  const plan = store.getPlanById(planId);
  const officers = store.getUsers(currentTenant.id).filter((u) => u.role === "FIELD_RECOVERY" || u.role === "BRANCH_MANAGER");

  const [seizedDate, setSeizedDate] = useState(new Date().toISOString().split("T")[0]);
  const [conditionRating, setConditionRating] = useState<number>(3);
  const [notes, setNotes] = useState("Body condition normal with minor scratches. Screen intact, battery functional.");
  const [officerId, setOfficerId] = useState(officers[0]?.id || currentUser?.id || "usr_rec_bilal");
  const [witnessName, setWitnessName] = useState("");
  const [resaleValuation, setResaleValuation] = useState<number>(
    plan ? Math.round(plan.cashPrice * 0.65) : 80000
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;
  if (!plan) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
        Contract not found.
      </div>
    );
  }

  const totalPaid = plan.schedule.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const badDebtWrittenOff = Math.max(0, plan.totalFinanced - totalPaid);
  const selectedOfficer = officers.find((o) => o.id === officerId) || currentUser;

  const handleConfirmRepossess = (e: React.FormEvent) => {
    e.preventDefault();
    if (resaleValuation <= 0) {
      alert("Please provide a valid resale valuation.");
      return;
    }

    if (!confirm(`Are you sure you want to REPOSSESS product for ${plan.customerName}? Plan will be marked as DEFAULTED_REPOSSESSED and item will be moved to Refurbished Stock.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      store.repossessPlan({
        planId: plan.id,
        seizedDate,
        conditionRating,
        notes,
        officerId: selectedOfficer.id,
        officerName: selectedOfficer.name,
        witnessName: witnessName || "Local Showroom Witness",
        resaleValuation,
        actorId: currentUser.id,
      });

      alert("Item successfully repossessed and transferred to Refurbished Stock!");
      router.push(`/portal/plans/${plan.id}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      <Link
        href={`/portal/plans/${plan.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Plan Details</span>
      </Link>

      {/* Header Alert Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-800/40 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-rose-900/80 text-rose-200 px-3 py-1 rounded-full border border-rose-700">
              Contract Repossession & Asset Recovery Protocol
            </span>
            <UrduSpeaker customText="نادہندہ معاہدے کی ضبطگی۔ سامان واپس لے کر ری فربشڈ اسٹاک میں درج کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Product Repossession & Asset Recovery
          </h1>
          <p className="text-xs sm:text-sm text-rose-200/90 font-urdu leading-relaxed">
            Legal repossession of asset upon permanent customer default and loss adjustment
          </p>
        </div>

        <div className="p-3 bg-rose-900/40 border border-rose-700/60 rounded-2xl text-center self-start md:self-auto">
          <span className="text-[10px] text-rose-300 block font-mono uppercase">Plan Number</span>
          <strong className="text-base font-mono font-bold text-white">{plan.planNumber}</strong>
        </div>
      </div>

      <form onSubmit={handleConfirmRepossess} className="space-y-6">
        {/* Contract & Default Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            1. Contract Default Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Customer</span>
              <strong className="text-slate-900 font-bold block">{plan.customerName}</strong>
              <span className="text-slate-400 font-mono text-[10px]">{formatCNIC(plan.customerCnic)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Product & Serial</span>
              <strong className="text-slate-900 font-bold block truncate">{plan.productTitle}</strong>
              <span className="text-slate-400 font-mono text-[10px]">IMEI: {plan.imeiSerial}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Total Paid So Far</span>
              <strong className="text-emerald-700 font-bold text-sm">{formatPKR(totalPaid)}</strong>
              <span className="text-slate-400 text-[10px]">of {formatPKR(plan.totalFinanced)}</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-700 font-bold block text-[11px]">Bad Debt Write-Off</span>
              <strong className="text-rose-800 font-black text-sm">{formatPKR(badDebtWrittenOff)}</strong>
              <span className="text-rose-600 text-[10px]">Write-Off</span>
            </div>
          </div>
        </div>

        {/* Repossession Physical Inspection Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            2. Seizure & Physical Condition Inspection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Official Seizure Date *
              </label>
              <input
                type="date"
                required
                value={seizedDate}
                onChange={(e) => setSeizedDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono outline-none focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Recovery Officer In-Charge *
              </label>
              <select
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-rose-600"
              >
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Physical Condition Rating *
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setConditionRating(rating)}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1 font-bold text-xs transition-colors ${
                      conditionRating === rating
                        ? "bg-amber-500 text-white border-amber-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rating} Star</span>
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {conditionRating === 1 && "1: Severe Damage / Requires Repair"}
                {conditionRating === 2 && "2: Heavily Used / Scratches"}
                {conditionRating === 3 && "3: Fair / Average Condition"}
                {conditionRating === 4 && "4: Very Good / Clean Condition"}
                {conditionRating === 5 && "5: Like New / Mint Condition"}
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Witness Name / Reference
              </label>
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                placeholder="Local Showroom Supervisor / Area Witness"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-rose-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                Physical Inspection & Damage Audit Notes *
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note any scratches, missing charger/accessories, battery health, or engine sound..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-rose-600"
              />
            </div>
          </div>
        </div>

        {/* Refurbished Resale Valuation Box */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">
              3. Refurbished Inventory Re-Stocking
            </h2>
          </div>

          <p className="text-xs text-slate-300 font-urdu leading-relaxed">
            This product will automatically be added to inventory as Refurbished / Used Stock for resale.
          </p>

          <div className="max-w-xs">
            <label className="block text-slate-300 font-bold mb-1 text-xs">
              Resale Valuation Price (Rs.) *
            </label>
            <input
              type="number"
              required
              value={resaleValuation}
              onChange={(e) => setResaleValuation(Number(e.target.value))}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-lg font-black text-amber-300 font-mono outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Confirm Repossession & Update Inventory</span>
          </button>
        </div>
      </form>
    </div>
  );
}
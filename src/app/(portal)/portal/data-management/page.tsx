"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldCheck,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default function DataManagementPage() {
  const { currentTenant } = useAuth();
  const [isClean, setIsClean] = useState(() => store.isCleanMode());
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleResetToClean = () => {
    if (confirm("Are you sure you want to clear all demo data and start with a fresh clean production database?")) {
      store.resetToCleanProduction(currentTenant.id);
      setIsClean(true);
      setMsg({
        type: "success",
        text: "Clean Production Slate Activated! All sample demo data removed. You can now register real customers or import from Excel.",
      });
    }
  };

  const handleRestoreDemo = () => {
    if (confirm("Restore sample Pakistani demo dataset (smartphones, ACs, motorbikes, dual guarantors)?")) {
      store.resetToDemoData();
      setIsClean(false);
      setMsg({
        type: "success",
        text: "Sample demo dataset restored successfully.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30">
            Database Controller & Production Setup
          </span>
          <UrduSpeaker guideKey="CLEAN_DATA" size="sm" showLabel />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Production Live Mode vs Demo Data Controller
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
          ڈیمو ڈیٹا صاف کر کے راجپوت ٹریڈرز کا اصل کاروباری ڈیٹا درج کرنے کے لیے یہاں سے کنٹرول کریں
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Production Mode Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Option A: Start Fresh Clean Mode */}
        <div className="bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-8 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Recommended for Live Shop
              </span>
              <Trash2 className="w-5 h-5 text-emerald-700" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Start Fresh (Clean Production Slate)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Wipes all dummy customers, mock installments, and test expenses. Sets your wallets to Rs. 0 ready for real showroom and field recovery operations.
            </p>
            <p className="text-xs font-urdu font-semibold text-emerald-800">
              تمام فرضی ڈیٹا ختم کر کے اپنے اصلی گاہکوں کا نیا ریکارڈ شروع کریں
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleResetToClean}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Clear Demo Data & Activate Live Mode
            </button>
          </div>
        </div>

        {/* Option B: Restore Sample Demo Dataset */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Sandbox Mode
              </span>
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Restore Sample Demo Data
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Loads comprehensive sample Pakistani records (Haier Inverter AC, Honda CD70, 5kW Solar, dual guarantors, short arrears test cases).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleRestoreDemo}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
            >
              Restore Sample Demo Records
            </button>
          </div>
        </div>
      </div>

      {/* Migration Next Step */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-emerald-950">
            Have Existing Customer Lists in Excel or Notebooks?
          </h3>
          <p className="text-xs text-emerald-800">
            Use our bulk Excel importer to upload your existing ledger sheets in 30 seconds.
          </p>
        </div>
        <Link
          href="/portal/import"
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow whitespace-nowrap transition-colors"
        >
          Open Excel Bulk Importer →
        </Link>
      </div>
    </div>
  );
}
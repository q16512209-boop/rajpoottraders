"use client";

import React, { useState } from "react";
import { Calculator, ArrowRight, ShieldCheck, Sparkles, Check, HelpCircle } from "lucide-react";
import { formatPKR } from "@/lib/formatters";
import { calculateInstallmentBreakdown } from "@/lib/calculations";
import Link from "next/link";

interface Props {
  initialPrice?: number;
  initialDownPayment?: number;
  productName?: string;
}

export function InstallmentCalculator({
  initialPrice = 165000,
  initialDownPayment = 35000,
  productName,
}: Props) {
  const [cashPrice, setCashPrice] = useState<number>(initialPrice);
  const [downPayment, setDownPayment] = useState<number>(initialDownPayment);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [markupRate, setMarkupRate] = useState<number>(24);

  const breakdown = calculateInstallmentBreakdown(cashPrice, downPayment, durationMonths, markupRate);

  const durationOptions = [3, 6, 12, 18, 24];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Calculator className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {productName ? `Installment Plan for ${productName}` : "Easy Monthly Installment Calculator"}
              </h3>
              <p className="text-xs text-emerald-200">
                راجپوت ٹریڈرز کا شفاف اور آسان اقساط کیلکولیٹر
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 border border-emerald-500/40 text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Instant Approval
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 p-6 sm:p-8 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cash Price Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800">
                Item Cash Price / Package Worth
              </label>
              <span className="text-base font-extrabold text-emerald-700">
                {formatPKR(cashPrice)}
              </span>
            </div>
            <input
              type="range"
              min={20000}
              max={1500000}
              step={5000}
              value={cashPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCashPrice(val);
                if (downPayment > val * 0.7) {
                  setDownPayment(Math.round(val * 0.25));
                }
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-semibold mt-1">
              <span>Rs. 20,000</span>
              <span>Rs. 500,000</span>
              <span>Rs. 1,500,000</span>
            </div>
          </div>

          {/* Advance / Down Payment */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-bold text-slate-800">
                  Advance / Down Payment
                </label>
                <span className="text-xs text-slate-500">
                  ({Math.round((downPayment / cashPrice) * 100)}%)
                </span>
              </div>
              <span className="text-base font-extrabold text-emerald-700">
                {formatPKR(downPayment)}
              </span>
            </div>
            <input
              type="range"
              min={Math.round(cashPrice * 0.15)}
              max={Math.round(cashPrice * 0.6)}
              step={1000}
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-semibold mt-1">
              <span>Min 15%: {formatPKR(cashPrice * 0.15)}</span>
              <span>Standard 25%: {formatPKR(cashPrice * 0.25)}</span>
              <span>Max 60%: {formatPKR(cashPrice * 0.6)}</span>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2.5">
              Installment Duration (Tenure)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {durationOptions.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setDurationMonths(months)}
                  className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                    durationMonths === months
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-md scale-[1.02]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {months} Mo
                </button>
              ))}
            </div>
          </div>

          {/* Trust Guarantees Checklist */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Official Stamp Paper legal agreement with dual guarantor protection</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No bank credit card required • Instant verification within 24 hours</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Automatic Arrears Rebalancing Engine for flexible short payments</span>
            </div>
          </div>
        </div>

        {/* Breakdown Output Summary Box */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex-1 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Estimated Monthly Obligation
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-emerald-800 tracking-tight">
                  {formatPKR(breakdown.monthlyInstallment)}
                </span>
                <span className="text-xs font-bold text-slate-500">/ month</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Payable for {durationMonths} consecutive months
              </p>
            </div>

            {/* Metric Row Items */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Financed Principal:</span>
                <span className="font-bold text-slate-900">{formatPKR(breakdown.financedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Fixed Total Markup ({breakdown.markupRatePct}%):</span>
                <span className="font-bold text-emerald-700">+{formatPKR(breakdown.totalMarkup)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Contract Value:</span>
                <span className="font-bold text-slate-900">{formatPKR(breakdown.totalPayable + breakdown.downPayment)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-800 font-extrabold">
                <span>Advance Required Today:</span>
                <span className="text-emerald-700">{formatPKR(breakdown.downPayment)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <Link
                href={`/portal/plans/new?price=${cashPrice}&down=${downPayment}&months=${durationMonths}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all group"
              >
                <span>Initiate Application Contract</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href={`https://wa.me/923008472910?text=Hello%20Rajpoot%20Traders,%20I%20am%20interested%20in%20an%20installment%20plan%20for%20Rs.%20${cashPrice}%20with%20Rs.%20${downPayment}%20advance%20for%20${durationMonths}%20months.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                <span>Inquire on Official WhatsApp (+92 300 8472910)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

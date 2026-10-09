"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { Printer, ArrowLeft, Filter, MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function PrintRouteSheetPage() {
  const { currentTenant, currentUser } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");

  if (!currentUser || !currentTenant) return null;

  const allPlans = store.getPlans(currentTenant.id);
  const customers = store.getCustomers(currentTenant.id);
  const routes = store.getRouteZones(currentTenant.id);

  // Filter plans
  const filteredPlans = allPlans.filter((p) => {
    if (selectedRoute === "ALL") return true;
    return p.areaZone === selectedRoute;
  });

  // Calculate aggregates
  let totalFinanced = 0;
  let totalRecovered = 0;
  filteredPlans.forEach((plan) => {
    totalFinanced += plan.totalFinanced || 0;
    const paidInSchedule = (plan.schedule || []).reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    totalRecovered += paidInSchedule + (plan.downPayment || 0);
  });
  const totalOutstanding = Math.max(0, totalFinanced - totalRecovered);

  // Chunk plans into pages of 18 rows
  const ROWS_PER_PAGE = 18;
  const planPages: (typeof filteredPlans)[] = [];
  for (let i = 0; i < filteredPlans.length; i += ROWS_PER_PAGE) {
    planPages.push(filteredPlans.slice(i, i + ROWS_PER_PAGE));
  }

  // If no plans, provide 1 empty page placeholder
  if (planPages.length === 0) {
    planPages.push([]);
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-2 sm:px-6 font-sans text-slate-900">
      {/* 1. NO-PRINT TOP CONTROL BAR */}
      <div className="no-print max-w-7xl mx-auto mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>واپس ڈیش بورڈ</span>
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900">
              چنیوٹ ڈائری فیلڈ ریکوری رجسٹر (A4 Landscape Ledger)
            </h1>
            <p className="text-[11px] text-slate-500 font-urdu">
              18 قطار فی صفحہ • بازاری روٹ فلٹر • پرنٹ پروٹیکشن
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Route Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-transparent font-black text-slate-900 outline-none"
            >
              <option value="ALL">تمام روٹس و کھاتے ({allPlans.length})</option>
              {routes.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>پرنٹ A4 لینڈ سکیپ رجسٹر</span>
          </button>
        </div>
      </div>

      {/* 2. PRINT STYLE EMBED */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }
          html, body {
            background: white !important;
            color: #0f172a !important;
            font-size: 9.5px !important;
            line-height: 1.15 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }
          .ledger-sheet-page {
            height: 192mm !important;
            max-height: 192mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            margin-bottom: 0 !important;
            padding: 4mm 6mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            padding: 2.5px 3.5px !important;
            border: 1px solid #334155 !important;
          }
        }
      `}</style>

      {/* 3. MULTI-PAGE CHUNKED RENDER */}
      <div className="max-w-7xl mx-auto space-y-8">
        {planPages.map((pageRows, pageIdx) => {
          const isLastPage = pageIdx === planPages.length - 1;

          return (
            <div
              key={pageIdx}
              className="ledger-sheet-page bg-white border border-slate-300 shadow-xl p-6 mx-auto rounded-xl flex flex-col justify-between page-break-after"
              style={{ minHeight: "192mm" }}
            >
              <div>
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-2 mb-2 flex justify-between items-end">
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight font-serif">
                      {currentTenant.brandHeader}
                    </h2>
                    <p className="text-xs font-urdu font-black text-emerald-800">
                      چنیوٹ ڈائری فیلڈ ریکوری رجسٹر • روزانہ وصولی و بقایا جات شیٹ
                    </p>
                    <p className="text-[10px] text-slate-600">
                      برانچ: {currentTenant.name} ({currentTenant.city || "چنیوٹ"}) • تاریخ: {formatDate(new Date())}
                    </p>
                  </div>

                  <div className="text-right text-[11px] font-sans">
                    <p className="font-bold">
                      <span className="text-slate-500 font-urdu">روٹ / بازار: </span>
                      <strong className="text-emerald-900">{selectedRoute === "ALL" ? "تمام چنیوٹ بازار" : selectedRoute}</strong>
                    </p>
                    <p className="font-bold">
                      <span className="text-slate-500 font-urdu">ریکوری آفیسر: </span>
                      <strong>{currentUser.name}</strong>
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold rounded text-[10px] mt-0.5 border border-slate-300">
                      صفحہ {pageIdx + 1} از {planPages.length + 1}
                    </span>
                  </div>
                </div>

                {/* Ledger Table (Exact 18 Rows) */}
                <table className="w-full text-left text-[10px] border border-slate-900 border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[9px] border-b border-slate-900">
                      <th className="border border-slate-900 p-1 w-14 text-center">کھاتہ #</th>
                      <th className="border border-slate-900 p-1 w-44">خریدار و فون</th>
                      <th className="border border-slate-900 p-1 w-48">پتہ / دکان / پروڈکٹ</th>
                      <th className="border border-slate-900 p-1 w-28 text-right">کل رقم و پیشگی</th>
                      <th className="border border-slate-900 p-1 w-24 text-center">ہفتہ 1 (قسط | بقایا)</th>
                      <th className="border border-slate-900 p-1 w-24 text-center">ہفتہ 2 (قسط | بقایا)</th>
                      <th className="border border-slate-900 p-1 w-24 text-center">ہفتہ 3 (قسط | بقایا)</th>
                      <th className="border border-slate-900 p-1 w-24 text-center">ہفتہ 4 (قسط | بقایا)</th>
                      <th className="border border-slate-900 p-1 w-28 text-right">نیٹ بقایا</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((plan, rIdx) => {
                      const cust = customers.find((c) => c.id === plan.customerId);
                      const paidInSchedule = (plan.schedule || []).reduce(
                        (sum, s) => sum + (s.amountPaid || 0),
                        0
                      );
                      const planTotalPaid = paidInSchedule + (plan.downPayment || 0);
                      const planRemaining = Math.max(0, (plan.totalFinanced || 0) - planTotalPaid);

                      return (
                        <tr key={plan.id} className="border-b border-slate-400 leading-tight">
                          {/* 1. Khata # */}
                          <td className="border border-slate-800 p-1 text-center font-mono font-black text-slate-950">
                            #{plan.khataNumber || plan.planNumber}
                          </td>

                          {/* 2. Customer Name & Phone (Strict 2-Line) */}
                          <td className="border border-slate-800 p-1">
                            <strong className="block font-black text-slate-950 truncate max-w-[170px]">
                              {plan.customerName} {cust?.fatherName ? `(ولد ${cust.fatherName})` : ""}
                            </strong>
                            <span className="font-mono text-[9px] text-slate-700 block">
                              {formatPhone(plan.customerPhone)}
                            </span>
                          </td>

                          {/* 3. Address / Shop & Product (Strict 2-Line) */}
                          <td className="border border-slate-800 p-1">
                            <span className="block text-slate-900 truncate max-w-[190px] font-medium">
                              {cust?.address || plan.areaZone}
                            </span>
                            <span className="block text-[9px] text-emerald-900 font-bold truncate max-w-[190px]">
                              {plan.productTitle} {plan.imeiSerial ? `(${plan.imeiSerial})` : ""}
                            </span>
                          </td>

                          {/* 4. Total & Down Payment (Strict 2-Line) */}
                          <td className="border border-slate-800 p-1 text-right">
                            <span className="block font-black text-slate-950 font-mono">
                              کل: {formatPKR(plan.totalFinanced)}
                            </span>
                            <span className="block text-[9px] text-slate-600 font-mono">
                              پیشگی: {formatPKR(plan.downPayment)}
                            </span>
                          </td>

                          {/* 5. Week 1 Grid Box */}
                          <td className="border border-slate-800 p-1 text-center bg-slate-50/40">
                            <span className="block text-[9px] text-slate-400 font-mono">قسط: _____</span>
                            <span className="block text-[8px] text-slate-400 font-mono">بقایا: _____</span>
                          </td>

                          {/* 6. Week 2 Grid Box */}
                          <td className="border border-slate-800 p-1 text-center bg-slate-50/40">
                            <span className="block text-[9px] text-slate-400 font-mono">قسط: _____</span>
                            <span className="block text-[8px] text-slate-400 font-mono">بقایا: _____</span>
                          </td>

                          {/* 7. Week 3 Grid Box */}
                          <td className="border border-slate-800 p-1 text-center bg-slate-50/40">
                            <span className="block text-[9px] text-slate-400 font-mono">قسط: _____</span>
                            <span className="block text-[8px] text-slate-400 font-mono">بقایا: _____</span>
                          </td>

                          {/* 8. Week 4 Grid Box */}
                          <td className="border border-slate-800 p-1 text-center bg-slate-50/40">
                            <span className="block text-[9px] text-slate-400 font-mono">قسط: _____</span>
                            <span className="block text-[8px] text-slate-400 font-mono">بقایا: _____</span>
                          </td>

                          {/* 9. Net Balance */}
                          <td className="border border-slate-800 p-1 text-right font-mono font-black">
                            <span className={planRemaining > 0 ? "text-rose-900" : "text-emerald-900"}>
                              {formatPKR(planRemaining)}
                            </span>
                            <span className="block text-[8px] font-urdu font-bold text-slate-500">
                              {planRemaining <= 0 ? "کلئیر ✓" : "جاری"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Pad empty rows to ensure exactly 18 rows on page to prevent gaps */}
                    {Array.from({ length: Math.max(0, ROWS_PER_PAGE - pageRows.length) }).map((_, emptyIdx) => (
                      <tr key={`empty-${emptyIdx}`} className="border-b border-slate-300 text-slate-300">
                        <td className="border border-slate-300 p-1 text-center font-mono text-[9px]">-</td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                        <td className="border border-slate-300 p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Page Footer */}
              <div className="pt-2 border-t border-slate-400 flex justify-between items-center text-[10px] text-slate-700">
                <span className="font-urdu">
                  راجپوت ٹریڈرز چنیوٹ • رجسٹرڈ فیلڈ ریکوری لیجر شیٹ
                </span>
                <div className="space-x-8 font-urdu">
                  <span>دستخط ریکوری آفیسر: __________________</span>
                  <span>دستخط برانچ منیجر: __________________</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* 4. FINAL PAGE: EXECUTIVE SUMMARY SHEET */}
        <div
          className="ledger-sheet-page bg-white border border-slate-300 shadow-xl p-8 mx-auto rounded-xl flex flex-col justify-between page-break-after"
          style={{ minHeight: "192mm" }}
        >
          <div className="space-y-6">
            {/* Summary Title */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
                  Executive Recovery Summary Audit
                </span>
                <h2 className="text-xl font-black uppercase text-slate-950 mt-1 font-serif">
                  {currentTenant.brandHeader}
                </h2>
                <p className="text-xs font-urdu font-bold text-slate-700">
                  فیلڈ ریکوری اور کھاتہ جات کا فائنل آڈٹ و تصدیقی گوشوارہ
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">تاریخ: {formatDate(new Date())}</p>
                <p className="text-slate-600 font-urdu">صفحہ {planPages.length + 1} (فائنل سمری)</p>
              </div>
            </div>

            {/* Big Boxes Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Box 1: Total Khatas Audited */}
              <div className="p-6 bg-slate-50 border-2 border-slate-400 rounded-2xl space-y-2 text-center">
                <span className="text-xs uppercase font-black text-slate-600 block">
                  کل آڈٹ شدہ کھاتے (Total Khatas)
                </span>
                <div className="text-4xl font-black text-slate-950 font-mono">
                  {filteredPlans.length}
                </div>
                <p className="text-[11px] text-slate-500 font-urdu">
                  منتخب روٹ: {selectedRoute === "ALL" ? "تمام چنیوٹ بازار" : selectedRoute}
                </p>
              </div>

              {/* Box 2: Total Received (سبز باکس) */}
              <div className="p-6 bg-emerald-50 border-2 border-emerald-600 rounded-2xl space-y-2 text-center">
                <span className="text-xs uppercase font-black text-emerald-900 block font-urdu text-sm">
                  کل موصول شدہ رقم (Total Received)
                </span>
                <div className="text-3xl font-black text-emerald-900 font-mono">
                  {formatPKR(totalRecovered)}
                </div>
                <p className="text-[11px] text-emerald-700 font-urdu">
                  سبز باکس: ڈاؤن پیمنٹ بمع تمام وصول شدہ اقساط
                </p>
              </div>

              {/* Box 3: Total Market Pending (سرخ باکس) */}
              <div className="p-6 bg-rose-50 border-2 border-rose-600 rounded-2xl space-y-2 text-center">
                <span className="text-xs uppercase font-black text-rose-900 block font-urdu text-sm">
                  مارکیٹ کل بقایا (Total Outstanding)
                </span>
                <div className="text-3xl font-black text-rose-900 font-mono">
                  {formatPKR(totalOutstanding)}
                </div>
                <p className="text-[11px] text-rose-700 font-urdu">
                  سرخ باکس: مارکیٹ کے ذمہ واجب الوصول نیٹ بقایا
                </p>
              </div>
            </div>

            {/* Breakdown Audit Notes */}
            <div className="p-5 bg-slate-50 border border-slate-300 rounded-2xl space-y-2 text-xs">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                اہم ہدایات برائے ریکوری آفیسر و برانچ منیجر:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-urdu leading-relaxed">
                <li>تمام موصول شدہ اقساط کی رسید فوری طور پر گاہک کو موقع پر تھرمل یا لائیو ایس ایم ایس کے ذریعے فراہم کی جائے۔</li>
                <li>ہر ہفتہ کی شام کو فیلڈ میں موصول شدہ کیش کاؤنٹر دراز میں جمع کروا کے ہینڈ اوور کی الیکٹرانک تصدیق کروائی جائے۔</li>
                <li>کسی بھی گاہک کی طرف سے 3 اقساط لگاتار لیٹ ہونے کی صورت میں ڈیفالٹر وارننگ جاری کی جائے گی۔</li>
              </ul>
            </div>
          </div>

          {/* Verification Signature Stamps */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
            <div className="p-4 border border-dashed border-slate-400 rounded-2xl text-center space-y-6">
              <span className="text-slate-500 font-urdu block">ریکوری آفیسر تصدیق و دستخط:</span>
              <div className="h-10 border-b border-slate-400 mx-8"></div>
              <p className="font-mono font-bold text-slate-800">{currentUser.name} ({currentUser.role})</p>
            </div>

            <div className="p-4 border border-dashed border-slate-400 rounded-2xl text-center space-y-6">
              <span className="text-slate-500 font-urdu block">دکان مالک / برانچ منیجر مہر و دستخط:</span>
              <div className="h-10 border-b border-slate-400 mx-8"></div>
              <p className="font-mono font-bold text-slate-800">{currentTenant.ownerName} (مالک راجپوت ٹریڈرز)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
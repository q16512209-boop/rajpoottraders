"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/db/store";
import { calculateInstallmentBreakdown } from "@/lib/calculations";
import { formatPKR, formatCNIC } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

function NewPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant } = useAuth();

  const customers = store.getCustomers(currentTenant.id);
  const products = store.getProducts(currentTenant.id);

  const initialCustId = searchParams.get("cust") || customers[0]?.id || "";
  const initialPrice = Number(searchParams.get("price")) || (products[0]?.cashPrice || 165000);
  const initialDown = Number(searchParams.get("down")) || Math.round(initialPrice * 0.25);
  const initialMonths = Number(searchParams.get("months")) || 12;

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustId);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [imeiSerial, setImeiSerial] = useState(products[0]?.imeiSerialList[0] || "IMEI-2026-9901");
  const [cashPrice, setCashPrice] = useState<number>(initialPrice);
  const [downPayment, setDownPayment] = useState<number>(initialDown);
  const [durationMonths, setDurationMonths] = useState<number>(initialMonths);
  const [markupRate, setMarkupRate] = useState<number>(24);

  const breakdown = calculateInstallmentBreakdown(cashPrice, downPayment, durationMonths, markupRate);

  const handleProductChange = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSelectedProductId(prod.id);
      setCashPrice(prod.cashPrice);
      setDownPayment(Math.round(prod.cashPrice * 0.25));
      setImeiSerial(prod.imeiSerialList[0] || `IMEI-${Date.now()}`);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const product = products.find((p) => p.id === selectedProductId);

    if (!customer || !product) {
      alert("Please select customer and product.");
      return;
    }

    const schedule = [];
    const startDate = new Date();
    for (let i = 1; i <= durationMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);
      schedule.push({
        installmentNo: i,
        dueDate: dueDate.toISOString(),
        principalDue: breakdown.monthlyInstallment,
        lateFee: 0,
        shortArrears: 0,
        totalDue: breakdown.monthlyInstallment,
        amountPaid: 0,
        status: "PENDING" as const,
      });
    }

    const newPlan = store.createPlan({
      tenantId: currentTenant.id,
      customerId: customer.id,
      customerName: customer.fullName,
      customerCnic: customer.cnic,
      customerPhone: customer.phone,
      productId: product.id,
      productTitle: product.title,
      imeiSerial,
      cashPrice,
      downPayment,
      markupRatePct: markupRate,
      totalMarkup: breakdown.totalMarkup,
      totalFinanced: breakdown.totalPayable,
      durationMonths,
      monthlyInstallment: breakdown.monthlyInstallment,
      accumulatedShortArrears: 0,
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      endDate: schedule[schedule.length - 1].dueDate,
      schedule,
      guarantorIds: customer.guarantors.map((g) => g.id),
      recoveryOfficerId: "usr_rec_bilal",
      areaZone: customer.zoneArea,
      contractVerified: true,
    });

    router.push(`/portal/plans/${newPlan.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          New Contract Generation
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          Create Hire-Purchase Installment Plan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated schedule computation, counter down payment receipt, and instant legal stamp preparation.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            1. Select Verified Customer & Stock Asset
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer (Kharedar) *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.isDefaulter ? "FLAGGED DEFAULTER" : "Verified Safe"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product / Package *</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({formatPKR(p.cashPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Dispatched IMEI / Engine Serial *</label>
              <input
                type="text"
                required
                value={imeiSerial}
                onChange={(e) => setImeiSerial(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Duration (Tenure Months) *</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                {[3, 6, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>
                    {m} Months
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            2. Down Payment & Financial Breakdown
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cash Retail Price (PKR)</label>
              <input
                type="number"
                value={cashPrice}
                onChange={(e) => setCashPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (PKR) *</label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Annual Markup Rate (%)</label>
              <input
                type="number"
                value={markupRate}
                onChange={(e) => setMarkupRate(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-emerald-800 font-semibold block">Financed Principal:</span>
              <strong className="text-sm text-slate-900">{formatPKR(breakdown.financedAmount)}</strong>
            </div>
            <div>
              <span className="text-emerald-800 font-semibold block">Total Markup:</span>
              <strong className="text-sm text-emerald-800">+{formatPKR(breakdown.totalMarkup)}</strong>
            </div>
            <div>
              <span className="text-emerald-800 font-semibold block">Total Payable:</span>
              <strong className="text-sm text-slate-900">{formatPKR(breakdown.totalPayable)}</strong>
            </div>
            <div>
              <span className="text-emerald-800 font-semibold block">Monthly EMI Due:</span>
              <strong className="text-base text-emerald-900 font-black">{formatPKR(breakdown.monthlyInstallment)} / mo</strong>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
          >
            <span>Activate Plan & Generate Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading plan form...</div>}>
      <NewPlanForm />
    </Suspense>
  );
}
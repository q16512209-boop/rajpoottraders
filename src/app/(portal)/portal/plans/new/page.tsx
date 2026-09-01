"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/db/store";
import { calculateInstallmentBreakdown } from "@/lib/calculations";
import { formatPKR, formatCNIC } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { GPSLocation } from "@/lib/db/types";
import {
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  Smartphone,
  Calendar,
  DollarSign,
} from "lucide-react";

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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | undefined>(
    selectedCustomer?.gpsLocation || undefined
  );

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

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const c = customers.find((cust) => cust.id === custId);
    if (c && c.gpsLocation) {
      setGpsLocation(c.gpsLocation);
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
      areaZone: gpsLocation?.aiSuggestedZone || customer.zoneArea,
      gpsLocation: gpsLocation || customer.gpsLocation,
      contractVerified: true,
    });

    router.push(`/portal/plans/${newPlan.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Installment Origination
          </span>
          <UrduSpeaker guideKey="NEW_PLAN" size="sm" showLabel />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          Create Hire-Purchase Installment Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-urdu">
          آسان اقساط کا نیا معاہدہ، IMEI مختص کرنا اور AI ریکوری پن لوکیشن
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        {/* Step 1: Customer Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              1. Select Verified Kharedar (کسٹمر منتخب کریں)
            </h2>
            <button
              type="button"
              onClick={() => router.push("/portal/customers/new")}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              + Add New Customer
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Customer List
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} — CNIC: {formatCNIC(c.cnic)} — Phone: {c.phone} ({c.zoneArea})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Product & Serial Allocation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            2. Product Selection & IMEI Allocation (پروڈکٹ و سیریل نمبر)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatPKR(p.cashPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned IMEI / Engine / Serial</label>
              <input
                type="text"
                required
                value={imeiSerial}
                onChange={(e) => setImeiSerial(e.target.value)}
                placeholder="352019900123456"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: AI & GPS Location Pin for Recovery */}
        <MapLocationPicker
          value={gpsLocation}
          onChange={(loc) => setGpsLocation(loc)}
          defaultCity="Lahore"
        />

        {/* Step 4: Financial Calculations */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            3. Financing Terms & Installment Matrix (فنانسنگ کی شرائط)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Cash Price (Rs.)</label>
              <input
                type="number"
                value={cashPrice}
                onChange={(e) => setCashPrice(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Advance Down Payment (Rs.)</label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Duration (Months)</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Annual Markup Rate (%)</label>
              <input
                type="number"
                value={markupRate}
                onChange={(e) => setMarkupRate(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono outline-none"
              />
            </div>
          </div>

          {/* Breakdown Preview Card */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl text-white space-y-3 shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Financed</span>
                <strong className="text-base sm:text-lg font-black text-amber-300">{formatPKR(breakdown.totalPayable)}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Total Profit Markup</span>
                <strong className="text-base sm:text-lg font-black text-emerald-400">{formatPKR(breakdown.totalMarkup)}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Monthly Installment</span>
                <strong className="text-xl sm:text-2xl font-black text-white">{formatPKR(breakdown.monthlyInstallment)}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Tenure Plan</span>
                <strong className="text-base sm:text-lg font-bold text-slate-200">{durationMonths} Months</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm Plan & Generate Legal Stamp (پلان کنفرم کریں)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Plan Form...</div>}>
      <NewPlanForm />
    </Suspense>
  );
}
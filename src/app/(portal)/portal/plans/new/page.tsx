"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/db/store";
import { formatPKR, formatCNIC } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { GPSLocation, InstallmentFrequency } from "@/lib/db/types";
import {
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  Tag,
} from "lucide-react";

function NewPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant, currentUser } = useAuth();

  const customers = store.getCustomers(currentTenant.id);
  const products = store.getProducts(currentTenant.id);

  const initialCustId = searchParams.get("cust") || customers[0]?.id || "";
  const initialProduct = products[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustId);
  const [selectedProductId, setSelectedProductId] = useState(initialProduct?.id || "");
  const [khataNumber, setKhataNumber] = useState("");
  const [salesmanName, setSalesmanName] = useState(currentUser?.name || "ضہیم (Zaheem)");

  const [productTitle, setProductTitle] = useState(initialProduct?.title || "استری (Heavy Weight Electric Iron)");
  const [imeiSerial, setImeiSerial] = useState(initialProduct?.imeiSerialList[0] || "SN-IST-0001");
  const [cashPrice, setCashPrice] = useState<number>(initialProduct?.cashPrice || 5800);
  const [totalFinanced, setTotalFinanced] = useState<number>(initialProduct?.installmentPrice || 6800);
  const [downPayment, setDownPayment] = useState<number>(initialProduct?.defaultDownPayment || 500);

  // Frequency & Schedule Day
  const [installmentFrequency, setInstallmentFrequency] = useState<InstallmentFrequency>(initialProduct?.defaultFrequency || "WEEKLY");
  const [collectionDayName, setCollectionDayName] = useState("ہفتہ (Saturday)");
  const [collectionIntervalDays, setCollectionIntervalDays] = useState<number>(7);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(initialProduct?.defaultInstallmentAmount || 500);
  const [totalInstallmentsCount, setTotalInstallmentsCount] = useState<number>(initialProduct?.defaultTotalInstallments || 13);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProductTitle(prod.title);
      setCashPrice(prod.cashPrice);
      setTotalFinanced(prod.installmentPrice || prod.cashPrice * 1.2);
      setDownPayment(prod.defaultDownPayment || 500);
      setMonthlyInstallment(prod.defaultInstallmentAmount || 500);
      setInstallmentFrequency(prod.defaultFrequency || "WEEKLY");
      setTotalInstallmentsCount(prod.defaultTotalInstallments || 13);
      setCollectionIntervalDays(prod.defaultFrequency === "WEEKLY" ? 7 : (prod.defaultFrequency === "TEN_DAYS" ? 10 : 30));
      setImeiSerial(prod.imeiSerialList[0] || `SN-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);

    if (!customer) {
      alert("براہ کرم خریدار / گاہک منتخب کریں۔");
      return;
    }

    const schedule = [];
    const baseDate = new Date(startDate);
    const interval = collectionIntervalDays || (installmentFrequency === "WEEKLY" ? 7 : (installmentFrequency === "TEN_DAYS" ? 10 : 30));

    for (let i = 1; i <= totalInstallmentsCount; i++) {
      const d = new Date(baseDate);
      if (installmentFrequency === "WEEKLY" || installmentFrequency === "TEN_DAYS" || installmentFrequency === "FIFTEEN_DAYS") {
        d.setDate(d.getDate() + (i * interval));
      } else {
        d.setMonth(d.getMonth() + i);
      }

      schedule.push({
        installmentNo: i,
        dueDate: d.toISOString().split("T")[0],
        principalDue: monthlyInstallment,
        lateFee: 0,
        shortArrears: 0,
        totalDue: monthlyInstallment,
        amountPaid: 0,
        status: "PENDING" as const,
      });
    }

    const plan = store.createPlan({
      tenantId: currentTenant.id,
      khataNumber: khataNumber || undefined,
      customerId: customer.id,
      customerName: customer.fullName,
      customerCnic: customer.cnic,
      customerPhone: customer.phone,
      salesmanName,
      productId: selectedProductId || `prod_${Date.now()}`,
      productTitle,
      imeiSerial,
      cashPrice,
      downPayment,
      markupRatePct: Math.round(((totalFinanced - cashPrice) / cashPrice) * 100) || 15,
      totalMarkup: Math.max(0, totalFinanced - cashPrice),
      totalFinanced,
      durationMonths: totalInstallmentsCount,
      totalInstallmentsCount,
      installmentFrequency,
      collectionIntervalDays: interval,
      collectionDayName,
      monthlyInstallment,
      accumulatedShortArrears: 0,
      status: "ACTIVE",
      startDate,
      endDate: schedule[schedule.length - 1]?.dueDate || startDate,
      schedule,
      guarantorIds: customer.guarantors.map((g) => g.id),
      areaZone: customer.zoneArea,
      contractVerified: true,
    });

    router.push(`/portal/plans/${plan.id}`);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30">
              New Installment Contract
            </span>
            <UrduSpeaker customText="نیا قسط پلان تیار کریں۔ پروڈکٹ منتخب کریں اور ہفتہ وار یا ماہانہ شیڈول سیٹ کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            نیا اقساط پلان تیار کریں (Create Installment Plan)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            راجپوت ٹریڈرز چنیوٹ • خریدار، اشیاء، ایڈوانس، قسط کی رقم اور ہفتہ وار شیڈول کا اندراج
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Section 1: Customer & Salesman */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b pb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900 font-urdu">
              1. خریدار کا انتخاب اور سیلز مین (Customer & Salesman)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Customer (خریدار منتخب کریں) *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone}) — {c.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khata Number (کھاتہ نمبر - اختیاری)</label>
              <input
                type="text"
                placeholder="e.g. 6"
                value={khataNumber}
                onChange={(e) => setKhataNumber(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Salesman Name (سیلز مین کا نام) *</label>
              <input
                type="text"
                required
                placeholder="e.g. ضہیم (Zaheem)"
                value={salesmanName}
                onChange={(e) => setSalesmanName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Product Selection & Pricing */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900 font-urdu">
              2. اشیاء کا انتخاب اور قیمت (Product & Pricing)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select from Catalog (کیٹلاگ سے پروڈکٹ منتخب کریں)</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (نقد: {formatPKR(p.cashPrice)} • قسط: {formatPKR(p.installmentPrice || p.cashPrice * 1.2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title (نام اشیاء) *</label>
              <input
                type="text"
                required
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial / IMEI No (اختیاری)</label>
              <input
                type="text"
                value={imeiSerial}
                onChange={(e) => setImeiSerial(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Installment Price (کل قسط قیمت - Rs.) *</label>
              <input
                type="number"
                required
                min={500}
                value={totalFinanced}
                onChange={(e) => setTotalFinanced(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-sm outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 font-urdu block mt-0.5">قابل رعایت / کمی بیشی ممکن (Negotiable)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (ایڈوانس رقم - Rs.) *</label>
              <input
                type="number"
                required
                min={0}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Installment Frequency (قسط کا دورانیہ) *</label>
              <select
                value={installmentFrequency}
                onChange={(e) => {
                  const freq = e.target.value as InstallmentFrequency;
                  setInstallmentFrequency(freq);
                  setCollectionIntervalDays(freq === "WEEKLY" ? 7 : (freq === "TEN_DAYS" ? 10 : 30));
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              >
                <option value="WEEKLY">ہفتہ وار (Weekly — مثلاً 500 ہفتہ)</option>
                <option value="TEN_DAYS">10 روزہ (Every 10 Days)</option>
                <option value="FIFTEEN_DAYS">15 روزہ (Every 15 Days)</option>
                <option value="MONTHLY">ماہانہ (Monthly)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Installment Amount (قسط کی رقم - Rs.) *</label>
              <input
                type="number"
                required
                min={100}
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Installments Count (کل اقساط کی تعداد) *</label>
              <input
                type="number"
                required
                min={1}
                value={totalInstallmentsCount}
                onChange={(e) => setTotalInstallmentsCount(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred Collection Day (قسط کا دن) *</label>
              <select
                value={collectionDayName}
                onChange={(e) => setCollectionDayName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              >
                <option value="ہفتہ (Saturday)">ہفتہ (Saturday)</option>
                <option value="جمعہ (Friday)">جمعہ (Friday)</option>
                <option value="اتوار (Sunday)">اتوار (Sunday)</option>
                <option value="پیر / سوموار (Monday)">پیر / سوموار (Monday)</option>
                <option value="منگل (Tuesday)">منگل (Tuesday)</option>
                <option value="بدھ (Wednesday)">بدھ (Wednesday)</option>
                <option value="جمعرات (Thursday)">جمعرات (Thursday)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            منسوخ کریں
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>پلان بنائیں اور معاہدہ جاری کریں (Create Contract)</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}>
      <NewPlanForm />
    </Suspense>
  );
}

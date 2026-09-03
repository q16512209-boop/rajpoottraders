"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { Product, InstallmentFrequency } from "@/lib/db/types";
import { formatPKR } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Package,
  ShieldCheck,
  Calendar,
  DollarSign,
  UserCheck,
} from "lucide-react";

export default function LegacyCustomerEntryPage() {
  const router = useRouter();
  const { currentTenant, currentUser } = useAuth();
  const products = store.getProducts(currentTenant.id);

  // Khata & Salesman
  const [khataNumber, setKhataNumber] = useState("6");
  const [salesmanName, setSalesmanName] = useState("ضہیم (Zaheem)");

  // Customer Profile
  const [fullName, setFullName] = useState("اکبر علی (Akbar Ali)");
  const [fatherName, setFatherName] = useState("نصرت حسین (Nusrat Hussain)");
  const [cnic, setCnic] = useState("33202-6717585-1");
  const [phone, setPhone] = useState("0333-6717585");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("نصرت کشیدہ کاری، نزد دیسی مسجد، چنیوٹ");
  const [city, setCity] = useState("چنیوٹ (Chiniot)");
  const [zoneArea, setZoneArea] = useState("محلہ رحمن آباد و مسلم بازار چنیوٹ");

  // Guarantors (Guarantor 2 is optional)
  const [g1Name, setG1Name] = useState("محمد اسلم");
  const [g1Phone, setG1Phone] = useState("0300-1122334");
  const [g1Cnic, setG1Cnic] = useState("33202-1234567-1");
  const [g1Relation, setG1Relation] = useState("پڑوسی و کشیدہ کار");

  const [g2Name, setG2Name] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Relation, setG2Relation] = useState("");

  // Product & Khata
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [productTitle, setProductTitle] = useState(products[0]?.title || "استری (Heavy Weight Electric Iron)");
  const [imeiSerial, setImeiSerial] = useState("SN-IST-0006");
  const [totalFinanced, setTotalFinanced] = useState<number>(6800);
  const [downPayment, setDownPayment] = useState<number>(500);
  
  // Frequency & Schedule Day
  const [installmentFrequency, setInstallmentFrequency] = useState<InstallmentFrequency>("WEEKLY");
  const [collectionDayName, setCollectionDayName] = useState("ہفتہ (Saturday)");
  const [collectionIntervalDays, setCollectionIntervalDays] = useState<number>(7);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(500);
  const [totalInstallmentsCount, setTotalInstallmentsCount] = useState<number>(13);
  
  // Past Ledger
  const [monthsAlreadyPaid, setMonthsAlreadyPaid] = useState<number>(5);
  const [totalPaidInPast, setTotalPaidInPast] = useState<number>(4500);
  const [pendingShortArrears, setPendingShortArrears] = useState<number>(0);
  const [nextDueDate, setNextDueDate] = useState<string>("2026-09-05");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  // Handle Product Select
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = products.find((x) => x.id === prodId);
    if (p) {
      setProductTitle(p.title);
      setTotalFinanced(p.installmentPrice || p.cashPrice * 1.2);
      setDownPayment(p.defaultDownPayment || 500);
      setMonthlyInstallment(p.defaultInstallmentAmount || 500);
      setInstallmentFrequency(p.defaultFrequency || "WEEKLY");
      setTotalInstallmentsCount(p.defaultTotalInstallments || 13);
      setCollectionIntervalDays(p.defaultFrequency === "WEEKLY" ? 7 : (p.defaultFrequency === "TEN_DAYS" ? 10 : 30));
    }
  };

  // Auto-calculate remaining balance
  const remainingCount = Math.max(0, totalInstallmentsCount - monthsAlreadyPaid);
  const remainingExpected = Math.max(0, (totalFinanced - downPayment - totalPaidInPast) + pendingShortArrears);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = store.createLegacyKhataCustomer({
        tenantId: currentTenant.id,
        khataNumber,
        salesmanName,
        fullName,
        fatherName,
        cnic,
        phone,
        secondaryPhone: secondaryPhone || undefined,
        address,
        city,
        zoneArea,
        guarantor1Name: g1Name,
        guarantor1Phone: g1Phone,
        guarantor1Cnic: g1Cnic,
        guarantor1Relation: g1Relation,
        guarantor2Name: g2Name || undefined,
        guarantor2Phone: g2Phone || undefined,
        guarantor2Cnic: g2Cnic || undefined,
        guarantor2Relation: g2Relation || undefined,
        productId: selectedProductId || undefined,
        productTitle,
        imeiSerial: imeiSerial || undefined,
        totalFinanced: Number(totalFinanced),
        downPayment: Number(downPayment),
        durationMonths: Number(totalInstallmentsCount),
        totalInstallmentsCount: Number(totalInstallmentsCount),
        installmentFrequency,
        collectionIntervalDays: Number(collectionIntervalDays),
        collectionDayName,
        monthlyInstallment: Number(monthlyInstallment),
        monthsAlreadyPaid: Number(monthsAlreadyPaid),
        totalPaidInPast: Number(totalPaidInPast),
        pendingShortArrears: Number(pendingShortArrears),
        nextDueDate,
        createdBy: currentUser.name,
      });

      setMsg({
        type: "success",
        text: `پرانا کھاتہ #${khataNumber} اور گاہک "${res.customer.fullName}" (${res.plan.planNumber}) کامیابی سے سسٹم میں شامل ہو گیا!`,
      });

      setTimeout(() => {
        router.push(`/portal/plans/${res.plan.id}`);
      }, 1200);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to create legacy record" });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30">
              راجپوت ٹریڈرز (رجسٹرڈ) — چنیوٹ
            </span>
            <UrduSpeaker customText="راجپوت ٹریڈرز محلہ رحمن آباد چنیوٹ۔ پرانے رجسٹرز اور ڈائریوں کا کھاتہ درج کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            رجسٹر کھاتہ فارم — چنیوٹ برانچ (Khata Entry Form)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            محلہ رحمن آباد چنیوٹ • فون: 0311-4813850 • کھاتہ نمبر، سیلز مین کا نام اور ہفتہ وار یا ماہانہ اقساط کا فوری اندراج
          </p>
        </div>

        <Link
          href="/portal/customers"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>تمام کسٹمرز دیکھیں</span>
        </Link>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />}
          <span className="font-urdu text-sm">{msg.text}</span>
        </div>
      )}

      {/* Live Financial Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">کھاتہ نمبر و سیلز مین</span>
          <strong className="text-base font-black text-slate-900 font-urdu">کھاتہ #{khataNumber} • {salesmanName}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">ادا شدہ اقساط</span>
          <strong className="text-base font-black text-emerald-700">{monthsAlreadyPaid} / {totalInstallmentsCount} اقساط</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">کل جمع شدہ رقم (مع ایڈوانس)</span>
          <strong className="text-base font-black text-slate-800">{formatPKR(totalPaidInPast + downPayment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">بقایا رقم (Remaining)</span>
          <strong className="text-base font-black text-amber-900">{formatPKR(remainingExpected)}</strong>
        </div>
      </div>

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Khata Header & Salesman */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              1. کھاتہ نمبر اور سیلز مین کی معلومات (Khata & Salesman)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khata Number (کھاتہ نمبر - رجسٹر کے مطابق) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 6"
                value={khataNumber}
                onChange={(e) => setKhataNumber(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-base outline-none focus:border-emerald-600"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
              <span className="text-[10px] text-slate-400 font-urdu block mt-1">سسٹم اس سیلز مین کا نام کھاتے پر ہمیشہ محفوظ رکھے گا۔</span>
            </div>
          </div>
        </div>

        {/* Section 2: Customer Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              2. نام خریدار اور رہائشی پتہ (Customer Details)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Full Name (خریدار کا نام) *</label>
              <input
                type="text"
                required
                placeholder="e.g. اکبر علی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Father's Name (ولدیت / والد کا نام) *</label>
              <input
                type="text"
                required
                placeholder="e.g. نصرت حسین"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNIC Number (شناختی کارڈ نمبر) *</label>
              <input
                type="text"
                required
                placeholder="33202-6717585-1"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Mobile (کسٹمر نمبر) *</label>
              <input
                type="tel"
                required
                placeholder="0333-6717585"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City (شہر) *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Chiniot Route Zone (چنیوٹ علاقہ / روٹ) *</label>
              <select
                value={zoneArea}
                onChange={(e) => setZoneArea(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              >
                <option value="محلہ رحمن آباد و مسلم بازار چنیوٹ">محلہ رحمن آباد و مسلم بازار چنیوٹ</option>
                <option value="چناب کالونی و لاہور روڈ چنیوٹ">چناب کالونی و لاہور روڈ چنیوٹ</option>
                <option value="جھنگ روڈ و کچہری چنیوٹ">جھنگ روڈ و کچہری چنیوٹ</option>
                <option value="ریلوے روڈ و محلہ عالی چنیوٹ">ریلوے روڈ و محلہ عالی چنیوٹ</option>
                <option value="فیصل آباد روڈ چنیوٹ سرکل">فیصل آباد روڈ چنیوٹ سرکل</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Complete Address (ایڈریس / دکان یا گھر کا پتہ) *</label>
              <input
                type="text"
                required
                placeholder="e.g. نصرت کشیدہ کاری، نزد دیسی مسجد، چنیوٹ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-urdu"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Product, Installment Day & Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              3. نام اشیاء اور قسط کا شیڈول (Product & Collection Schedule)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select from Catalog (کیٹلاگ سے پروڈکٹ منتخب کریں)</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
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
                placeholder="e.g. استری"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Price (کل قیمت - Rs.) *</label>
              <input
                type="number"
                required
                min={500}
                value={totalFinanced}
                onChange={(e) => setTotalFinanced(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-emerald-600"
              />
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
                  setCollectionIntervalDays(freq === "WEEKLY" ? 7 : (freq === "TEN_DAYS" ? 10 : (freq === "FIFTEEN_DAYS" ? 15 : 30)));
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
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

            {/* Collection Day & Cycle */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">کس دن قسط لینے جانا ہے؟ (Collection Day) *</label>
              <select
                value={collectionDayName}
                onChange={(e) => setCollectionDayName(e.target.value)}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 outline-none font-urdu"
              >
                <option value="ہفتہ (Saturday)">ہفتہ (Saturday)</option>
                <option value="جمعہ (Friday)">جمعہ (Friday)</option>
                <option value="اتوار (Sunday)">اتوار (Sunday)</option>
                <option value="پیر / سوموار (Monday)">پیر / سوموار (Monday)</option>
                <option value="منگل (Tuesday)">منگل (Tuesday)</option>
                <option value="بدھ (Wednesday)">بدھ (Wednesday)</option>
                <option value="جمعرات (Thursday)">جمعرات (Thursday)</option>
              </select>
              <span className="text-[10px] text-emerald-700 font-urdu block">
                ریکوری افسر کی روٹ لسٹ اسی دن کے حساب سے بنے گی۔
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">کتنے دن بعد جانا ہے؟ (Cycle Days) *</label>
              <input
                type="number"
                required
                min={1}
                value={collectionIntervalDays}
                onChange={(e) => setCollectionIntervalDays(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-black text-emerald-900 outline-none"
              />
              <span className="text-[10px] text-emerald-700 font-urdu block">مثلاً ہر 7 دن بعد، 10 دن بعد، یا 30 دن بعد۔</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Installments (کل اقساط کی تعداد) *</label>
              <input
                type="number"
                required
                min={1}
                value={totalInstallmentsCount}
                onChange={(e) => setTotalInstallmentsCount(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Historical Entries */}
            <div className="p-4 bg-emerald-100/50 border border-emerald-300 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">پہلے سے ادا شدہ اقساط (Paid in Register) *</label>
              <input
                type="number"
                required
                min={0}
                max={totalInstallmentsCount}
                value={monthsAlreadyPaid}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthsAlreadyPaid(val);
                  setTotalPaidInPast(val * monthlyInstallment);
                }}
                className="w-full p-2.5 bg-white border border-emerald-400 rounded-xl font-black text-emerald-900 text-base font-mono outline-none"
              />
              <span className="text-[10px] text-emerald-800 font-urdu block">مثلاً 5 اقساط پہلے سے ادا شدہ ہیں۔</span>
            </div>

            <div className="p-4 bg-emerald-100/50 border border-emerald-300 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">ماضی میں جمع شدہ رقم (Paid Amount - Rs.) *</label>
              <input
                type="number"
                required
                min={0}
                value={totalPaidInPast}
                onChange={(e) => setTotalPaidInPast(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-emerald-400 rounded-xl font-black text-emerald-900 text-base font-mono outline-none"
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <label className="block font-black text-amber-950">پچھلا شارٹ بقایا (Pending Short Arrears - Rs.)</label>
              <input
                type="number"
                min={0}
                value={pendingShortArrears}
                onChange={(e) => setPendingShortArrears(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-black text-amber-900 text-base font-mono outline-none"
              />
              <span className="text-[10px] text-amber-800 font-urdu block">اگر کوئی قسط ادھوری دی گئی تھی تو شارٹ خودکار جڑ جائے گا۔</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Collection Due Date (اگلی قسط کی تاریخ) *</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Guarantor (2nd is OPTIONAL) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              4. ضامنان کی تفصیلات (ضامن نمبر 2 اختیاری ہے)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Guarantor 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-black text-emerald-800 block text-xs">ضامن نمبر 1 (Guarantor 1 - لازمی) *</span>
              <div>
                <label className="block font-bold text-slate-600 mb-1">ضامن کا نام *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. محمد اسلم"
                  value={g1Name}
                  onChange={(e) => setG1Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold font-urdu"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">موبائل فون نمبر *</label>
                <input
                  type="tel"
                  required
                  placeholder="0300-1122334"
                  value={g1Phone}
                  onChange={(e) => setG1Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">شناختی کارڈ نمبر</label>
                <input
                  type="text"
                  placeholder="33202-1234567-1"
                  value={g1Cnic}
                  onChange={(e) => setG1Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
            </div>

            {/* Guarantor 2 (OPTIONAL) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 block text-xs">ضامن نمبر 2 (اختیاری - Optional)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">ضروری نہیں</span>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">دوسرے ضامن کا نام (اگر ہو)</label>
                <input
                  type="text"
                  placeholder="اختیاری..."
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">موبائل فون نمبر</label>
                <input
                  type="tel"
                  placeholder="اختیاری..."
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">شناختی کارڈ نمبر</label>
                <input
                  type="text"
                  placeholder="اختیاری..."
                  value={g2Cnic}
                  onChange={(e) => setG2Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-urdu">
            کھاتہ جمع ہوتے ہی باقی اقساط فیلڈ ریکوری افسر کی روٹ شیٹ میں دن کے حساب سے لائیو ہو جائیں گی۔
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/portal/customers"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center flex-1 sm:flex-none"
            >
              منسوخ کریں (Cancel)
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "کھاتہ محفوظ ہو رہا ہے..." : "کھاتہ جمع اور لائیو کریں (Save & Activate Khata)"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

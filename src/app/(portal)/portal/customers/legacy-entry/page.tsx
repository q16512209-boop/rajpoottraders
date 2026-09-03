"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Package,
  ShieldCheck,
} from "lucide-react";

export default function LegacyCustomerEntryPage() {
  const router = useRouter();
  const { currentTenant, currentUser } = useAuth();

  // Form State
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Lahore");
  const [zoneArea, setZoneArea] = useState("Route-A (Gulberg / Model Town)");

  // Guarantors
  const [g1Name, setG1Name] = useState("");
  const [g1Phone, setG1Phone] = useState("");
  const [g1Cnic, setG1Cnic] = useState("");
  const [g1Relation, setG1Relation] = useState("Friend / Relative");
  const [g2Name, setG2Name] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Relation, setG2Relation] = useState("Neighbor");

  // Product & Khata
  const [productTitle, setProductTitle] = useState("");
  const [imeiSerial, setImeiSerial] = useState("");
  const [totalFinanced, setTotalFinanced] = useState(120000);
  const [downPayment, setDownPayment] = useState(25000);
  const [durationMonths, setDurationMonths] = useState(12);
  const [monthlyInstallment, setMonthlyInstallment] = useState(10000);
  const [monthsAlreadyPaid, setMonthsAlreadyPaid] = useState(4);
  const [totalPaidInPast, setTotalPaidInPast] = useState(40000);
  const [pendingShortArrears, setPendingShortArrears] = useState(0);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(10);
    if (d < new Date()) d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const remainingMonths = Math.max(0, durationMonths - monthsAlreadyPaid);
  const remainingExpected = remainingMonths * monthlyInstallment + pendingShortArrears;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = store.createLegacyKhataCustomer({
        tenantId: currentTenant.id,
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
        productTitle,
        imeiSerial: imeiSerial || undefined,
        totalFinanced: Number(totalFinanced),
        downPayment: Number(downPayment),
        durationMonths: Number(durationMonths),
        monthlyInstallment: Number(monthlyInstallment),
        monthsAlreadyPaid: Number(monthsAlreadyPaid),
        totalPaidInPast: Number(totalPaidInPast),
        pendingShortArrears: Number(pendingShortArrears),
        nextDueDate,
        createdBy: currentUser.name,
      });

      setMsg({
        type: "success",
        text: `پرانا کھاتہ اور گاہک "${res.customer.fullName}" (${res.plan.planNumber}) کامیابی سے سسٹم میں شامل ہو گیا!`,
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
              Fast Legacy Khata Entry
            </span>
            <UrduSpeaker customText="پرانے گاہکوں اور پرانے کھاتوں کا آسان فارم۔ تفصیلات بھریں اور فوری محفوظ کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            پرانے کسٹمر کا کھاتہ درج کریں (Old Customer Khata Form)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            اگر آپ کے پاس پرانے رجسٹرز یا ڈائریوں کا کھاتہ ہے تو بغیر کسی ایکسل فائل کے اس سادہ فارم کے ذریعے 1 منٹ میں گاہک کا پرانا کھاتہ سسٹم میں لائیو کریں
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
          <span className="text-[10px] font-bold uppercase text-slate-400 block">کل طے شدہ قیمت</span>
          <strong className="text-base font-black text-slate-900">{formatPKR(totalFinanced)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">ماضی میں ادا شدہ اقساط</span>
          <strong className="text-base font-black text-emerald-700">{monthsAlreadyPaid} / {durationMonths} ماہ</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">ماضی میں موصول رقم</span>
          <strong className="text-base font-black text-slate-800">{formatPKR(totalPaidInPast + downPayment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">آئندہ واجب الادا بقایا رقم</span>
          <strong className="text-base font-black text-amber-900">{formatPKR(remainingExpected)}</strong>
        </div>
      </div>

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              1. خریدار / گاہک کی معلومات (Customer Profile)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Full Name (خریدار کا پورا نام) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Aslam"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Father's Name (والد کا نام) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Abdul Rasheed"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNIC Number (شناختی کارڈ نمبر) *</label>
              <input
                type="text"
                required
                placeholder="35202-1234567-1"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone (موبائل فون نمبر) *</label>
              <input
                type="tel"
                required
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Secondary Phone (دوسرا نمبر)</label>
              <input
                type="tel"
                placeholder="0321-7654321"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Area / Route Zone (علاقہ و روٹ) *</label>
              <select
                value={zoneArea}
                onChange={(e) => setZoneArea(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none"
              >
                <option value="Route-A (Gulberg / Model Town)">Route-A (Gulberg / Model Town)</option>
                <option value="Route-B (Johar Town / Faisal Town)">Route-B (Johar Town / Faisal Town)</option>
                <option value="Route-C (Cantt / DHA / Mughalpura)">Route-C (Cantt / DHA / Mughalpura)</option>
                <option value="Route-D (Shahdara / Old Lahore)">Route-D (Shahdara / Old Lahore)</option>
                <option value="Faisalabad City Hub">Faisalabad City Hub</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Complete House / Shop Address (مکمل پتہ) *</label>
              <input
                type="text"
                required
                placeholder="e.g. House #14, Street 2, Main Bazar, Ichhra, Lahore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-urdu"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Product & Historical Khata Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              2. پروڈکٹ اور پرانے کھاتے کا حساب (Product & Historical Khata)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title (پروڈکٹ / سامان کا نام) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Haier Inverter AC 1.5 Ton"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial / IMEI / Engine No (اختیاری)</label>
              <input
                type="text"
                placeholder="e.g. HR-AC-992812"
                value={imeiSerial}
                onChange={(e) => setImeiSerial(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Agreed Contract Price (کل طے شدہ قیمت - Rs.) *</label>
              <input
                type="number"
                required
                min={1000}
                value={totalFinanced}
                onChange={(e) => setTotalFinanced(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (دیا گیا ایڈوانس - Rs.) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Total Plan Months (کل مہینے) *</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={18}>18 Months (1.5 Years)</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Installment (ماہانہ قسط کی رقم - Rs.) *</label>
              <input
                type="number"
                required
                min={500}
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Crucial Historical Fields */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">کتنی اقساط پہلے سے ادا ہو چکیں؟ (Months Already Paid) *</label>
              <input
                type="number"
                required
                min={0}
                max={durationMonths}
                value={monthsAlreadyPaid}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthsAlreadyPaid(val);
                  setTotalPaidInPast(val * monthlyInstallment);
                }}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-black text-emerald-900 text-base font-mono outline-none"
              />
              <span className="text-[11px] text-emerald-700 font-urdu block">
                سسٹم اتنے مہینوں کی اقساط کو خودکار "PAID" نشان زد کر دے گا۔
              </span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">ماضی میں ادا شدہ رقم (Total Paid in Past - Rs.) *</label>
              <input
                type="number"
                required
                min={0}
                value={totalPaidInPast}
                onChange={(e) => setTotalPaidInPast(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-black text-emerald-900 text-base font-mono outline-none"
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <label className="block font-black text-amber-950">پچھلا بقایا شارٹ (Pending Arrears - Rs.)</label>
              <input
                type="number"
                min={0}
                value={pendingShortArrears}
                onChange={(e) => setPendingShortArrears(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-black text-amber-900 text-base font-mono outline-none"
              />
              <span className="text-[11px] text-amber-800 font-urdu block">
                اگر پرانی کسی قسط میں سے کوئی شارٹ باقی ہے تو وہ اگلی قسط میں شامل ہوگا۔
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Installment Due Date (اگلی قسط کی تاریخ) *</label>
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

        {/* Section 3: Guarantors Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              3. ضامنان کی تفصیلات (Guarantors Information)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Guarantor 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-black text-emerald-800 block text-xs">ضامن نمبر 1 (Guarantor 1 - لازمی) *</span>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 1 Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={g1Name}
                  onChange={(e) => setG1Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 1 Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="0300-9876543"
                  value={g1Phone}
                  onChange={(e) => setG1Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 1 CNIC</label>
                <input
                  type="text"
                  placeholder="35201-9876543-1"
                  value={g1Cnic}
                  onChange={(e) => setG1Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
            </div>

            {/* Guarantor 2 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-600 block text-xs">ضامن نمبر 2 (Guarantor 2 - اختیاری)</span>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 2 Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bilal Ahmed"
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 2 Phone</label>
                <input
                  type="tel"
                  placeholder="0312-3456789"
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 2 CNIC</label>
                <input
                  type="text"
                  placeholder="35202-3456789-3"
                  value={g2Cnic}
                  onChange={(e) => setG2Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-urdu">
            فارم جمع کرتے ہی گاہک کا پرانا کھاتہ لائیو ہو جائے گا اور باقی اقساط فیلڈ روٹ شیٹس میں نظر آئیں گی۔
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

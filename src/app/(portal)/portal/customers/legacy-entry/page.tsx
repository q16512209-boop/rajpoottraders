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
  const [salesmanName, setSalesmanName] = useState("Zaheem");

  // Customer Profile
  const [fullName, setFullName] = useState("Akbar Ali");
  const [fatherName, setFatherName] = useState("Nusrat Hussain");
  const [cnic, setCnic] = useState("33202-6717585-1");
  const [phone, setPhone] = useState("0333-6717585");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("Nusrat Embroidery, Near Desi Masjid, Chiniot");
  const [city, setCity] = useState("Chiniot");
  const [zoneArea, setZoneArea] = useState("Mohallah Rehman Abad & Muslim Bazaar, Chiniot");

  // Guarantors (Guarantor 2 is optional)
  const [g1Name, setG1Name] = useState("Muhammad Aslam");
  const [g1Phone, setG1Phone] = useState("0300-1122334");
  const [g1Cnic, setG1Cnic] = useState("33202-1234567-1");
  const [g1Relation, setG1Relation] = useState("Neighbor & Artisan");

  const [g2Name, setG2Name] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Relation, setG2Relation] = useState("");

  // Product & Khata
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [productTitle, setProductTitle] = useState(products[0]?.title || "Heavy Weight Electric Iron");
  const [imeiSerial, setImeiSerial] = useState("SN-IST-0006");
  const [totalFinanced, setTotalFinanced] = useState<number>(6800);
  const [downPayment, setDownPayment] = useState<number>(500);
  
  // Frequency & Schedule Day
  const [installmentFrequency, setInstallmentFrequency] = useState<InstallmentFrequency>("WEEKLY");
  const [collectionDayName, setCollectionDayName] = useState("Saturday");
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
        text: `Legacy Khata #${khataNumber} for customer "${res.customer.fullName}" (${res.plan.planNumber}) successfully added to active records!`,
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
              Rajpoot Traders (Regd.) — Chiniot
            </span>
            <UrduSpeaker customText="راجپوت ٹریڈرز محلہ رحمن آباد چنیوٹ۔ پرانے رجسٹرز اور ڈائریوں کا کھاتہ درج کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Fast Khata Entry Form — Chiniot Branch
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Mohallah Rehman Abad, Chiniot • Tel: 0311-4813850 • Khata Number, Salesman Name, and Collection Schedule
          </p>
        </div>

        <Link
          href="/portal/customers"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View All Customers</span>
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
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Khata # & Salesman</span>
          <strong className="text-base font-black text-slate-900 font-urdu">Khata #{khataNumber} • {salesmanName}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Paid Installments</span>
          <strong className="text-base font-black text-emerald-700">{monthsAlreadyPaid} / {totalInstallmentsCount} Paid</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Collected (with Advance)</span>
          <strong className="text-base font-black text-slate-800">{formatPKR(totalPaidInPast + downPayment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">Remaining Balance</span>
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
              1. Khata Number & Salesman Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khata Number (Manual Register #) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Salesman Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Zaheem"
                value={salesmanName}
                onChange={(e) => setSalesmanName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
              <span className="text-[10px] text-slate-400 font-urdu block mt-1">System records this salesman on the plan for audit transparency.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Customer Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              2. Customer Information & Residence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Akbar Ali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Father's Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nusrat Hussain"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNIC Number *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Customer Mobile Phone *</label>
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
              <label className="block font-bold text-slate-700 mb-1">City (City) *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Chiniot Route Zone (Chiniot Route Zone) *</label>
              <select
                value={zoneArea}
                onChange={(e) => setZoneArea(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              >
                <option value="Mohallah Rehman Abad & Muslim Bazaar, Chiniot">Mohallah Rehman Abad & Muslim Bazaar, Chiniot</option>
                <option value="Chenab Colony & Lahore Road, Chiniot">Chenab Colony & Lahore Road, Chiniot</option>
                <option value="Jhang Road & Katchery, Chiniot">Jhang Road & Katchery, Chiniot</option>
                <option value="Railway Road & Mohallah Aali, Chiniot">Railway Road & Mohallah Aali, Chiniot</option>
                <option value="Faisalabad Road Chiniot Circle">Faisalabad Road Chiniot Circle</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Complete Address (Complete Address) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nusrat Embroidery, Near Desi Masjid, Chiniot"
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
              3. Product Details & Collection Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select from Catalog (Select from Catalog)</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Cash: {formatPKR(p.cashPrice)} • Installment: {formatPKR(p.installmentPrice || p.cashPrice * 1.2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title (Product Title) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Electric Iron or Ceiling Fan"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Price (Total Price - Rs.) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (Down Payment - Rs.) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Installment Frequency (Installment Frequency) *</label>
              <select
                value={installmentFrequency}
                onChange={(e) => {
                  const freq = e.target.value as InstallmentFrequency;
                  setInstallmentFrequency(freq);
                  setCollectionIntervalDays(freq === "WEEKLY" ? 7 : (freq === "TEN_DAYS" ? 10 : (freq === "FIFTEEN_DAYS" ? 15 : 30)));
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              >
                <option value="WEEKLY">Weekly (e.g. Rs. 500/week)</option>
                <option value="TEN_DAYS">Every 10 Days</option>
                <option value="FIFTEEN_DAYS">Every 15 Days</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Installment Amount (Installment Amount - Rs.) *</label>
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
              <label className="block font-black text-emerald-950">Preferred Collection Day *</label>
              <select
                value={collectionDayName}
                onChange={(e) => setCollectionDayName(e.target.value)}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 outline-none font-urdu"
              >
                <option value="Saturday">Saturday</option>
                <option value="Friday">Friday</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
              </select>
              <span className="text-[10px] text-emerald-700 font-urdu block">
                The field recovery route list will be scheduled on this day.
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">Collection Interval (Cycle Days) *</label>
              <input
                type="number"
                required
                min={1}
                value={collectionIntervalDays}
                onChange={(e) => setCollectionIntervalDays(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-black text-emerald-900 outline-none"
              />
              <span className="text-[10px] text-emerald-700 font-urdu block">e.g. Every 7 days (weekly), 10 days, or 30 days (monthly).</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Installments Count *</label>
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
              <label className="block font-black text-emerald-950">Already Paid Installments (in Register) *</label>
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
              <span className="text-[10px] text-emerald-800 font-urdu block">Number of installments already paid in old manual register.</span>
            </div>

            <div className="p-4 bg-emerald-100/50 border border-emerald-300 rounded-2xl space-y-2">
              <label className="block font-black text-emerald-950">Total Past Amount Collected (PKR) *</label>
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
              <label className="block font-black text-amber-950">Previous Short Arrears (PKR)</label>
              <input
                type="number"
                min={0}
                value={pendingShortArrears}
                onChange={(e) => setPendingShortArrears(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-black text-amber-900 text-base font-mono outline-none"
              />
              <span className="text-[10px] text-amber-800 font-urdu block">If any previous installment was partially paid, arrears will auto-add.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Collection Due Date *</label>
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
              4. Guarantors (Guarantor 2 is Optional)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Guarantor 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-black text-emerald-800 block text-xs">Guarantor 1 (Mandatory) *</span>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Aslam"
                  value={g1Name}
                  onChange={(e) => setG1Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold font-urdu"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Mobile Phone Number *</label>
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
                <label className="block font-bold text-slate-600 mb-1">CNIC Number</label>
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
                <span className="font-bold text-slate-600 block text-xs">Guarantor 2 (Optional)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Optional</span>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor 2 Full Name (If any)</label>
                <input
                  type="text"
                  placeholder="Optional..."
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="Optional..."
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">CNIC Number</label>
                <input
                  type="text"
                  placeholder="Optional..."
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
            Remaining installments will be activated instantly on the recovery officer route sheet.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/portal/customers"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center flex-1 sm:flex-none"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Saving Khata..." : "Save & Activate Khata"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

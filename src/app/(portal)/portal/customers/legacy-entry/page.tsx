"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { InstallmentFrequency, GPSLocation, IPlanProductItem } from "@/lib/db/types";
import { formatPKR } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Package,
  ShieldCheck,
  UserCheck,
  MapPin,
  Plus,
  Trash2,
  Calculator,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface ProductLineItem {
  id: string;
  productId?: string;
  title: string;
  imeiSerial: string;
  cashPrice: number;
  installmentPrice: number;
  quantity: number;
}

export default function LegacyCustomerEntryPage() {
  const router = useRouter();
  const { currentTenant, currentUser } = useAuth();
  const products = store.getProducts(currentTenant.id);
  const dynamicRoutes = store.getRouteZones(currentTenant.id);

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
  const [zoneArea, setZoneArea] = useState(dynamicRoutes[0]?.name || "Mohallah Rehman Abad & Muslim Bazaar");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | undefined>(undefined);

  // Guarantors (Guarantor 2 is optional)
  const [g1Name, setG1Name] = useState("Muhammad Aslam");
  const [g1Phone, setG1Phone] = useState("0300-1122334");
  const [g1Cnic, setG1Cnic] = useState("33202-1234567-1");
  const [g1Relation, setG1Relation] = useState("Neighbor & Artisan");

  const [g2Name, setG2Name] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Relation, setG2Relation] = useState("");

  // Multi-Product Line Items
  const initialProduct = products[0];
  const [productItems, setProductItems] = useState<ProductLineItem[]>([
    {
      id: "item_1",
      productId: initialProduct?.id || "p1",
      title: initialProduct?.title || "Heavy Weight Electric Iron",
      imeiSerial: "SN-IST-0006",
      cashPrice: initialProduct?.cashPrice || 5800,
      installmentPrice: initialProduct?.installmentPrice || 6800,
      quantity: 1,
    },
  ]);

  // Frequency & Schedule Day
  const [installmentFrequency, setInstallmentFrequency] = useState<InstallmentFrequency>("WEEKLY");
  const [collectionDayName, setCollectionDayName] = useState("Saturday");
  const [collectionIntervalDays, setCollectionIntervalDays] = useState<number>(7);

  // Core Financial Fields
  const [totalFinanced, setTotalFinanced] = useState<number>(6800);
  const [downPayment, setDownPayment] = useState<number>(500);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(500);
  const [totalInstallmentsCount, setTotalInstallmentsCount] = useState<number>(13);

  // Past & Remaining State (Defaulted to 0 paid so staff can onboard fast and match diary later)
  const [monthsAlreadyPaid, setMonthsAlreadyPaid] = useState<number>(0);
  const [remainingInstallmentsCount, setRemainingInstallmentsCount] = useState<number>(13);
  const [totalPaidInPast, setTotalPaidInPast] = useState<number>(0);
  const [remainingBalance, setRemainingBalance] = useState<number>(6300);
  const [pendingShortArrears, setPendingShortArrears] = useState<number>(0);
  const [nextDueDate, setNextDueDate] = useState<string>("2026-09-05");

  const [showDetailedPastCalc, setShowDetailedPastCalc] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedSuccessRecord, setSavedSuccessRecord] = useState<{ planId: string; planNumber: string; khataNumber: string; customerName: string } | null>(null);

  if (!currentUser) return null;

  // Sync multi-product totals
  const recalculateFromItems = (items: ProductLineItem[]) => {
    const sumInstallment = items.reduce((acc, item) => acc + item.installmentPrice * item.quantity, 0);
    setTotalFinanced(sumInstallment);

    const defCount = totalInstallmentsCount || 13;
    const defDown = Math.round(sumInstallment * 0.1);
    setDownPayment(defDown);
    const balanceFinanced = Math.max(0, sumInstallment - defDown);
    const instAmount = Math.ceil(balanceFinanced / (defCount || 1));
    setMonthlyInstallment(instAmount);

    const paidAmount = monthsAlreadyPaid * instAmount;
    setTotalPaidInPast(paidAmount);
    const remCount = Math.max(0, defCount - monthsAlreadyPaid);
    setRemainingInstallmentsCount(remCount);
    setRemainingBalance(remCount * instAmount + pendingShortArrears);
  };

  const handleAddProductItem = () => {
    const defaultProd = products[productItems.length % products.length] || products[0];
    const newItem: ProductLineItem = {
      id: "item_" + Date.now(),
      productId: defaultProd?.id,
      title: defaultProd?.title || "Orient 56 Inch Ceiling Fan",
      imeiSerial: "SN-" + Date.now().toString().slice(-6),
      cashPrice: defaultProd?.cashPrice || 9500,
      installmentPrice: defaultProd?.installmentPrice || 11500,
      quantity: 1,
    };
    const updated = [...productItems, newItem];
    setProductItems(updated);
    recalculateFromItems(updated);
  };

  const handleRemoveProductItem = (id: string) => {
    if (productItems.length <= 1) {
      alert("At least 1 product item is required in the khata.");
      return;
    }
    const updated = productItems.filter((i) => i.id !== id);
    setProductItems(updated);
    recalculateFromItems(updated);
  };

  const handleUpdateProductItem = (id: string, updates: Partial<ProductLineItem>) => {
    const updated = productItems.map((item) => {
      if (item.id === id) {
        const next = { ...item, ...updates };
        if (updates.productId && updates.productId !== item.productId) {
          const p = products.find((x) => x.id === updates.productId);
          if (p) {
            next.title = p.title;
            next.cashPrice = p.cashPrice;
            next.installmentPrice = p.installmentPrice || p.cashPrice * 1.2;
          }
        }
        return next;
      }
      return item;
    });
    setProductItems(updated);
    recalculateFromItems(updated);
  };

  // --- SMART 2-WAY CALCULATION ENGINE ---
  const handlePaidInstallmentsChange = (paidVal: number) => {
    const safePaid = Math.max(0, Math.min(totalInstallmentsCount, paidVal));
    setMonthsAlreadyPaid(safePaid);

    const safeRem = Math.max(0, totalInstallmentsCount - safePaid);
    setRemainingInstallmentsCount(safeRem);

    const pastPaid = safePaid * monthlyInstallment;
    setTotalPaidInPast(pastPaid);

    const remBal = safeRem * monthlyInstallment + pendingShortArrears;
    setRemainingBalance(remBal);
  };

  const handleRemainingInstallmentsChange = (remVal: number) => {
    const safeRem = Math.max(0, Math.min(totalInstallmentsCount, remVal));
    setRemainingInstallmentsCount(safeRem);

    const safePaid = Math.max(0, totalInstallmentsCount - safeRem);
    setMonthsAlreadyPaid(safePaid);

    const pastPaid = safePaid * monthlyInstallment;
    setTotalPaidInPast(pastPaid);

    const remBal = safeRem * monthlyInstallment + pendingShortArrears;
    setRemainingBalance(remBal);
  };

  const handleTotalInstallmentsChange = (totalCount: number) => {
    const safeTotal = Math.max(1, totalCount);
    setTotalInstallmentsCount(safeTotal);

    const safeRem = Math.max(0, safeTotal - monthsAlreadyPaid);
    setRemainingInstallmentsCount(safeRem);

    const safeFinanced = safeTotal * monthlyInstallment + downPayment;
    setTotalFinanced(safeFinanced);

    setRemainingBalance(safeRem * monthlyInstallment + pendingShortArrears);
  };

  const handleInstallmentAmountChange = (amt: number) => {
    const safeAmt = Math.max(10, amt);
    setMonthlyInstallment(safeAmt);

    const safeFinanced = totalInstallmentsCount * safeAmt + downPayment;
    setTotalFinanced(safeFinanced);

    const pastPaid = monthsAlreadyPaid * safeAmt;
    setTotalPaidInPast(pastPaid);

    const remBal = remainingInstallmentsCount * safeAmt + pendingShortArrears;
    setRemainingBalance(remBal);
  };

  const handleDownPaymentChange = (dp: number) => {
    const safeDp = Math.max(0, dp);
    setDownPayment(safeDp);
    const safeFinanced = totalInstallmentsCount * monthlyInstallment + safeDp;
    setTotalFinanced(safeFinanced);
  };

  const handleShortArrearsChange = (arr: number) => {
    const safeArr = Math.max(0, arr);
    setPendingShortArrears(safeArr);
    setRemainingBalance(remainingInstallmentsCount * monthlyInstallment + safeArr);
  };

  const handleResetForNextCustomer = () => {
    const nextNum = String(Number(khataNumber) + 1 || "");
    setKhataNumber(nextNum);
    setFullName("");
    setFatherName("");
    setCnic("");
    setPhone("");
    setSecondaryPhone("");
    setAddress("");
    setG1Name("");
    setG1Phone("");
    setG1Cnic("");
    setG1Relation("Neighbor");
    setG2Name("");
    setG2Phone("");
    setG2Cnic("");
    setMonthsAlreadyPaid(0);
    setTotalPaidInPast(0);
    setPendingShortArrears(0);
    setSavedSuccessRecord(null);
    setMsg(null);
    setLoading(false);
  };

  const compositeTitle = productItems.map((p) => p.title + (p.quantity > 1 ? " (x" + p.quantity + ")" : "")).join(" + ");
  const compositeSerial = productItems.map((p) => p.imeiSerial || "SN-NA").join(", ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const formattedItems: IPlanProductItem[] = productItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.title,
        imeiSerial: item.imeiSerial,
        quantity: item.quantity,
        cashPrice: item.cashPrice,
        installmentPrice: item.installmentPrice,
        condition: "NEW",
      }));

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
        productId: productItems[0]?.productId || undefined,
        productTitle: compositeTitle || "Product",
        imeiSerial: compositeSerial,
        items: formattedItems,
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

      if (gpsLocation) {
        store.updateCustomerGps(res.customer.id, gpsLocation, address, zoneArea, currentUser.id);
      }

      setSavedSuccessRecord({
        planId: res.plan.id,
        planNumber: res.plan.planNumber,
        khataNumber,
        customerName: res.customer.fullName,
      });
      setLoading(false);
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
            <UrduSpeaker
              customText="راجپوت ٹریڈرز چنیوٹ۔ پرانے کھاتے فوری درج کریں۔ ابھی صرف کسٹمر کی تفصیلات درج کریں، قسطیں بعد میں ڈائری سے میچ کر کے درج کر سکتے ہیں۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            <span>Fast Customer & Khata Onboarding</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            محلہ رحمن آباد، چنیوٹ • رجسٹر کھاتہ نمبر اور کسٹمر پروفائل کا فوری اندراج
          </p>
        </div>

        <Link
          href="/portal/plans"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View All Khatas</span>
        </Link>
      </div>

      {/* POST-SAVE SUCCESS MODAL / CARD */}
      {savedSuccessRecord && (
        <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl border-2 border-emerald-400 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                Successfully Saved & Activated
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Khata #{savedSuccessRecord.khataNumber} for {savedSuccessRecord.customerName}
              </h2>
              <p className="text-xs text-slate-300 font-urdu mt-0.5">
                کھاتہ کامیابی سے محفوظ ہو چکا ہے۔ اب آپ چاہیں تو ڈائری سے قسطیں میچ کریں یا اگلا کھاتہ درج کریں۔
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              href={"/portal/plans/" + savedSuccessRecord.planId}
              className="p-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-slate-950" />
                <div className="text-left">
                  <span className="block font-black text-sm">Match Diary & Record Qistain</span>
                  <span className="block text-[11px] font-urdu font-normal text-slate-900">ڈائری سامنے رکھ کر قسطیں میچ کریں</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={handleResetForNextCustomer}
              className="p-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-emerald-200" />
                <div className="text-left">
                  <span className="block font-black text-sm">+ Add Next Customer Khata</span>
                  <span className="block text-[11px] font-urdu font-normal text-emerald-100">اگلا پرانا کسٹمر درج کریں</span>
                </div>
              </div>
              <RotateCcw className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div
          className={"p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 " + (msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300")}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
          )}
          <span className="font-urdu text-sm">{msg.text}</span>
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Khata Header & Salesman */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900">
                1. Khata Number & Salesman Information
              </h2>
            </div>
            <span className="text-xs font-urdu text-slate-500">ڈائری / رجسٹر کھاتہ نمبر اور سیلز مین</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Manual Khata Number (رجسٹر کھاتہ نمبر) *</label>
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
                placeholder="e.g. Zaheem"
                value={salesmanName}
                onChange={(e) => setSalesmanName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Customer Profile & Live Map */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900">
                2. Customer Profile & Residence Address
              </h2>
            </div>
            <span className="text-xs font-urdu text-slate-500">گاہک کا نام، شناختی کارڈ اور پتہ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Full Name (گاہک کا پورا نام) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Father's Name (والد کا نام) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">CNIC Number (شناختی کارڈ) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Customer Mobile Phone (موبائل نمبر) *</label>
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
              <label className="block font-bold text-slate-700 mb-1">Chiniot Route Zone (روٹ علاقہ) *</label>
              <select
                value={zoneArea}
                onChange={(e) => setZoneArea(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none"
              >
                {dynamicRoutes.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name} ({z.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Complete Address (مکمل رہائشی پتہ) *</label>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{showMapPicker ? "Hide Map Picker" : "Pin Location on Map & Auto-Fill Address"}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Nusrat Embroidery, Near Desi Masjid, Chiniot"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            {showMapPicker && (
              <div className="sm:col-span-3 pt-2">
                <MapLocationPicker
                  value={gpsLocation}
                  onChange={(loc) => {
                    setGpsLocation(loc);
                    if (loc.aiSuggestedZone) setZoneArea(loc.aiSuggestedZone);
                  }}
                  onAddressAutoFill={(autoAddr, zone) => {
                    if (autoAddr) setAddress(autoAddr);
                    if (zone) setZoneArea(zone);
                  }}
                  defaultCity={city}
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Product & Financing */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-700" />
              <div>
                <h2 className="text-base font-black text-slate-900">
                  3. Product & Financing Details
                </h2>
                <span className="text-xs text-slate-500 font-urdu">
                  پروڈکٹ کا نام، قسط کی رقم اور ہفتہ وار شیڈول
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddProductItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add 2nd Product</span>
            </button>
          </div>

          <div className="space-y-4">
            {productItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    Product #{idx + 1}
                  </span>
                  {productItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProductItem(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Catalog Preset</label>
                    <select
                      value={item.productId || ""}
                      onChange={(e) => handleUpdateProductItem(item.id, { productId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (Rs. {(p.installmentPrice || p.cashPrice * 1.2).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={item.title}
                      onChange={(e) => handleUpdateProductItem(item.id, { title: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Serial / IMEI #</label>
                    <input
                      type="text"
                      value={item.imeiSerial}
                      onChange={(e) => handleUpdateProductItem(item.id, { imeiSerial: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Installment Price (Rs.) *</label>
                    <input
                      type="number"
                      min={500}
                      value={item.installmentPrice}
                      onChange={(e) =>
                        handleUpdateProductItem(item.id, { installmentPrice: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Installments (کل قسطیں) *</label>
              <input
                type="number"
                min={1}
                value={totalInstallmentsCount}
                onChange={(e) => handleTotalInstallmentsChange(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Per Installment Amount (قسط کی رقم - Rs.) *</label>
              <input
                type="number"
                min={50}
                value={monthlyInstallment}
                onChange={(e) => handleInstallmentAmountChange(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-emerald-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (پیشگی - Rs.)</label>
              <input
                type="number"
                min={0}
                value={downPayment}
                onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
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
                <option value="Saturday">Saturday (ہفتہ)</option>
                <option value="Friday">Friday (جمعہ)</option>
                <option value="Sunday">Sunday (اتوار)</option>
                <option value="Monday">Monday (سوموار)</option>
                <option value="Tuesday">Tuesday (منگل)</option>
                <option value="Wednesday">Wednesday (بدھ)</option>
                <option value="Thursday">Thursday (جمعرات)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Guarantors (2nd is OPTIONAL) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900">
                4. Guarantors Information (ضامن تفصیلات)
              </h2>
            </div>
            <span className="text-xs font-urdu text-slate-500">پہلا ضامن لازمی، دوسرا ضامن اختیاری ہے</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-black text-emerald-800 block text-xs">
                Guarantor 1 (ضامن نمبر 1 — لازمی) *
              </span>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor Name *</label>
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
                <label className="block font-bold text-slate-600 mb-1">Mobile Phone *</label>
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
                <label className="block font-bold text-slate-600 mb-1">CNIC Number *</label>
                <input
                  type="text"
                  required
                  placeholder="33202-1234567-1"
                  value={g1Cnic}
                  onChange={(e) => setG1Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Relation / Profession *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neighbor / Shopkeeper"
                  value={g1Relation}
                  onChange={(e) => setG1Relation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 block text-xs">
                  Guarantor 2 (ضامن نمبر 2 — اختیاری)
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">Guarantor Name</label>
                <input
                  type="text"
                  placeholder="Optional second guarantor"
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="03xx-xxxxxxx"
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">CNIC Number</label>
                <input
                  type="text"
                  placeholder="33202-xxxxxxx-x"
                  value={g2Cnic}
                  onChange={(e) => setG2Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-base font-black">Save & Activate Khata in Portal</h3>
            <p className="text-xs text-slate-300 font-urdu">
              کھاتہ نمبر #{khataNumber} باقاعدہ رجسٹر ہو جائے گا۔ اس کے بعد ڈائری سامنے رکھ کر قسطیں تصدیق کر سکتے ہیں۔
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Saving Khata...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Khata #{khataNumber}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

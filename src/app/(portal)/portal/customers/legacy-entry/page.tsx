"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { GPSLocation } from "@/lib/db/types";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { subscribeToSyncStatus, SyncStatus } from "@/lib/db/live-sync";
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  MapPin,
  Plus,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  Cloud,
} from "lucide-react";

export default function LegacyCustomerEntryPage() {
  const router = useRouter();
  const { currentTenant, currentUser } = useAuth();
  const dynamicRoutes = store.getRouteZones(currentTenant?.id);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ connected: false, isSyncing: false, pendingQueueCount: 0 });

  useEffect(() => {
    const unsub = subscribeToSyncStatus((s) => setSyncStatus(s));
    return () => unsub();
  }, []);

  // Khata & Salesman
  const [khataNumber, setKhataNumber] = useState("6");
  const [salesmanName, setSalesmanName] = useState("Zaheem");

  // Customer Profile
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Chiniot");
  const [zoneArea, setZoneArea] = useState(dynamicRoutes[0]?.name || "Mohallah Rehman Abad & Muslim Bazaar");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | undefined>(undefined);

  // Guarantor 1 (Mandatory)
  const [g1Name, setG1Name] = useState("");
  const [g1Phone, setG1Phone] = useState("");
  const [g1Cnic, setG1Cnic] = useState("");
  const [g1Relation, setG1Relation] = useState("Neighbor & Artisan");

  // Guarantor 2 (Optional)
  const [g2Name, setG2Name] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Relation, setG2Relation] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedSuccessRecord, setSavedSuccessRecord] = useState<{
    planId: string;
    planNumber: string;
    khataNumber: string;
    customerName: string;
  } | null>(null);

  if (!currentUser) return null;

  const handleResetForNextCustomer = () => {
    const nextNum = String(Number(khataNumber) + 1 || "");
    setKhataNumber(nextNum);
    setFullName("");
    setFatherName("");
    setCnic("");
    setPhone("");
    setSecondaryPhone("");
    setAddress("");
    setGpsLocation(undefined);
    setShowMapPicker(false);
    setG1Name("");
    setG1Phone("");
    setG1Cnic("");
    setG1Relation("Neighbor & Artisan");
    setG2Name("");
    setG2Phone("");
    setG2Cnic("");
    setG2Relation("");
    setSavedSuccessRecord(null);
    setMsg(null);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (!khataNumber || !salesmanName || !fullName || !fatherName || !cnic || !phone || !address || !g1Name || !g1Phone) {
        throw new Error("Please fill in all mandatory fields (Khata #, Salesman, Customer info, and Guarantor 1).");
      }

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
        guarantor1Cnic: g1Cnic || "33202-0000000-0",
        guarantor1Relation: g1Relation || "ضامن",
        guarantor2Name: g2Name || undefined,
        guarantor2Phone: g2Phone || undefined,
        guarantor2Cnic: g2Cnic || undefined,
        guarantor2Relation: g2Relation || undefined,
        productTitle: "جنرل رجسٹر کھاتہ (General Register Khata)",
        imeiSerial: "KHATA-" + khataNumber,
        items: [
          {
            id: "item_gen_" + Date.now(),
            productTitle: "جنرل رجسٹر کھاتہ (General Register Khata)",
            imeiSerial: "KHATA-" + khataNumber,
            quantity: 1,
            cashPrice: 10000,
            installmentPrice: 10000,
            condition: "NEW",
          },
        ],
        totalFinanced: 10000,
        downPayment: 0,
        durationMonths: 20,
        totalInstallmentsCount: 20,
        installmentFrequency: "WEEKLY",
        collectionIntervalDays: 7,
        collectionDayName: "Saturday",
        monthlyInstallment: 500,
        monthsAlreadyPaid: 0,
        totalPaidInPast: 0,
        pendingShortArrears: 0,
        nextDueDate: "2026-09-05",
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
      setMsg({ type: "error", text: err.message || "Failed to create customer khata record" });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Fast Khata Entry • Chiniot</span>
            </span>

            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                syncStatus.connected
                  ? "bg-emerald-900/60 text-emerald-300 border-emerald-500/50"
                  : "bg-amber-900/60 text-amber-300 border-amber-500/50"
              }`}
            >
              {syncStatus.connected ? "🟢 MongoDB Live" : "🟡 Local Buffer (Cloud Pending)"}
            </span>

            <UrduSpeaker
              customText="راجپوت ٹریڈرز چنیوٹ۔ پرانے کھاتے فوری درج کریں۔ ابھی صرف کسٹمر اور ضامن کی تفصیلات درج کریں، قسطیں بعد میں ڈائری سے میچ کر کے درج کر سکتے ہیں۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            <span>Fast Customer & Khata Onboarding</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            محلہ رحمن آباد، چنیوٹ • صرف کسٹمر اور ضامن کا ڈیٹا درج کر کے فوری کھاتہ ایکٹیو کریں۔ قسطیں بعد میں ڈائری سے میچ کریں گے۔
          </p>
        </div>

        <Link
          href="/portal/plans"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto border border-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View All Khatas</span>
        </Link>
      </div>

      {/* POST-SAVE SUCCESS CARD */}
      {savedSuccessRecord && (
        <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl border-2 border-emerald-400 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                  Successfully Saved & Activated
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    syncStatus.connected
                      ? "bg-emerald-800 text-emerald-200"
                      : "bg-amber-800 text-amber-200"
                  }`}
                >
                  {syncStatus.connected ? "☁️ MongoDB Synced" : "💾 Saved in Offline Queue"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Khata #{savedSuccessRecord.khataNumber} for {savedSuccessRecord.customerName}
              </h2>
              <p className="text-xs text-slate-300 font-urdu mt-0.5">
                کھاتہ کامیابی سے محفوظ ہو چکا ہے۔ اب آپ اگلا کھاتہ درج کر سکتے ہیں یا ڈائری سے قسطیں میچ کر سکتے ہیں۔
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={handleResetForNextCustomer}
              className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-emerald-200" />
                <div className="text-left">
                  <span className="block font-black text-sm">+ Add Next Customer Khata</span>
                  <span className="block text-[11px] font-urdu font-normal text-emerald-100">اگلا پرانا کسٹمر کھاتہ درج کریں</span>
                </div>
              </div>
              <RotateCcw className="w-4 h-4 text-emerald-200 group-hover:rotate-45 transition-transform" />
            </button>

            <Link
              href={"/portal/plans/" + savedSuccessRecord.planId}
              className="p-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-slate-950" />
                <div className="text-left">
                  <span className="block font-black text-sm">Match Diary & Record Qistain</span>
                  <span className="block text-[11px] font-urdu font-normal text-slate-900">ڈائری کھول کر قسطیں میچ کریں</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
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

      {/* Main Form */}
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
            <span className="text-xs font-urdu text-slate-500">رجسٹر کھاتہ نمبر اور سیلز مین</span>
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-base outline-none focus:border-emerald-600 focus:bg-white"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-urdu text-sm"
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
            <span className="text-xs font-urdu text-slate-500">گاہک کا نام، شناختی کارڈ، فون اور پتہ</span>
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-urdu text-sm"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white font-urdu text-sm"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-emerald-600 focus:bg-white"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Secondary / WhatsApp Phone (اختیاری)</label>
              <input
                type="tel"
                placeholder="0300-1234567"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-emerald-600 focus:bg-white"
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

            <div className="sm:col-span-3">
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white font-medium"
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

        {/* Section 3: Guarantors Information (Guarantor 2 is OPTIONAL) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900">
                3. Guarantors Information (ضامن تفصیلات)
              </h2>
            </div>
            <span className="text-xs font-urdu text-slate-500">پہلا ضامن لازمی، دوسرا ضامن اختیاری ہے</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Guarantor 1 */}
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
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu font-bold text-slate-900 focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="0300-1122334"
                  value={g1Phone}
                  onChange={(e) => setG1Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Guarantor CNIC *</label>
                <input
                  type="text"
                  required
                  placeholder="33202-1234567-1"
                  value={g1Cnic}
                  onChange={(e) => setG1Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Relation / Occupation</label>
                <input
                  type="text"
                  placeholder="Neighbor & Artisan"
                  value={g1Relation}
                  onChange={(e) => setG1Relation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Guarantor 2 (Optional) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-600 block text-xs">
                Guarantor 2 (ضامن نمبر 2 — اختیاری)
              </span>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Guarantor 2 Name (اختیاری)</label>
                <input
                  type="text"
                  placeholder="Optional 2nd Guarantor"
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Guarantor 2 Phone</label>
                <input
                  type="tel"
                  placeholder="Optional Phone"
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Guarantor 2 CNIC</label>
                <input
                  type="text"
                  placeholder="Optional CNIC"
                  value={g2Cnic}
                  onChange={(e) => setG2Cnic(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Relation / Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Cousin / Shopkeeper"
                  value={g2Relation}
                  onChange={(e) => setG2Relation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-urdu focus:border-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.99]"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>{loading ? "Saving Customer Khata..." : "Save Customer & Activate Khata (کھاتہ محفوظ کریں)"}</span>
          </button>
          <p className="text-center text-xs text-slate-500 mt-2 font-urdu">
            نوٹ: محفوظ کرنے کے بعد آپ کو فوری اگلا کھاتہ درج کرنے کا بٹن مل جائے گا تاکہ تمام کھاتے تیزی سے درج ہو سکیں۔
          </p>
        </div>
      </form>
    </div>
  );
}

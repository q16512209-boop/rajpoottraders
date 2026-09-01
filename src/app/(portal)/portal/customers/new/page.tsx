"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { store } from "@/lib/db/store";
import { encryptField } from "@/lib/crypto/aes";
import { useAuth } from "@/lib/context/auth-context";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { GPSLocation } from "@/lib/db/types";
import {
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Upload,
  MapPin,
  Sparkles,
  Phone,
  User,
  Building,
} from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const { currentTenant } = useAuth();

  // Applicant KYC State
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Lahore");
  const [zoneArea, setZoneArea] = useState("Route-A (Gulberg / Model Town)");
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | undefined>(undefined);

  // Guarantor 1 State
  const [g1Name, setG1Name] = useState("");
  const [g1Father, setG1Father] = useState("");
  const [g1Cnic, setG1Cnic] = useState("");
  const [g1Phone, setG1Phone] = useState("");
  const [g1Relation, setG1Relation] = useState("Brother");
  const [g1Address, setG1Address] = useState("");
  const [g1Work, setG1Work] = useState("");

  // Guarantor 2 State
  const [g2Name, setG2Name] = useState("");
  const [g2Father, setG2Father] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Relation, setG2Relation] = useState("Business Partner / Reference");
  const [g2Address, setG2Address] = useState("");
  const [g2Work, setG2Work] = useState("");

  // Live Defaulter Cross-Check
  const crossCheck = store.checkHouseholdDefaulter(address, cnic, phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !cnic || !phone || !address) {
      alert("Please fill all required customer KYC fields (Full Name, CNIC, Phone, Address).");
      return;
    }

    const newCust = store.createCustomer({
      tenantId: currentTenant.id,
      fullName,
      fatherName,
      cnic: encryptField(cnic),
      phone,
      secondaryPhone,
      address,
      landmark: landmark || (gpsLocation?.address ? `GPS Pin: ${gpsLocation.address}` : "Main Chowk"),
      city,
      zoneArea: gpsLocation?.aiSuggestedZone || zoneArea,
      photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
      gpsLocation,
      guarantors: [
        {
          id: `gua_${Date.now()}_1`,
          fullName: g1Name || "Guarantor 1",
          fatherName: g1Father || "Father",
          cnic: encryptField(g1Cnic || "35202-0000001-1"),
          phone: g1Phone || "0300-1111111",
          relation: g1Relation,
          address: g1Address || address,
          workplace: g1Work || "Business",
          landmark: "Lahore",
        },
        {
          id: `gua_${Date.now()}_2`,
          fullName: g2Name || "Guarantor 2",
          fatherName: g2Father || "Father",
          cnic: encryptField(g2Cnic || "35201-0000002-2"),
          phone: g2Phone || "0300-2222222",
          relation: g2Relation,
          address: g2Address || address,
          workplace: g2Work || "Corporate",
          landmark: "Lahore",
        },
      ],
    });

    router.push(`/portal/plans/new?cust=${newCust.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            KYC Onboarding Protocol
          </span>
          <UrduSpeaker guideKey="CUSTOMER_KYC" size="sm" showLabel />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          New Customer & Dual Guarantors Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-urdu">
          خریدار اور دو ضامنان کی تصدیق، نادہندہ چیک اور AI لائیو جی پی ایس لوکیشن
        </p>
      </div>

      {/* Household Defaulter Radar Alert */}
      {crossCheck.hasDefaulterMatch && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-900 space-y-2 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Household Defaulter Radar Alert (نادہندہ الرٹ)
            </h3>
          </div>
          <p className="text-xs leading-relaxed font-urdu">
            {crossCheck.warningFlags.join(" • ")}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Customer Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              1. Kharedar Personal Details (خریدار کی ذاتی معلومات)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name (مکمل نام) *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Muhammad Tariq"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Father / Husband Name (والد کا نام)</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Muhammad Ramzan"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">CNIC Number (قومی شناختی کارڈ) *</label>
              <input
                type="text"
                required
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="35201-1234567-1"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Primary Mobile (موبائل نمبر) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Secondary / WhatsApp Phone</label>
              <input
                type="tel"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                placeholder="0321-7654321"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">City (شہر)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Physical Residential Address (مکمل رہائشی پتہ) *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House 42, St 7, Block C, Model Town, Lahore"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nearest Landmark (قریبی مشہور جگہ)</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near Model Town Central Mosque / Goga Pan Shop"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI & GPS Interactive Pin Location */}
        <MapLocationPicker
          value={gpsLocation}
          onChange={(loc) => {
            setGpsLocation(loc);
            if (loc.aiSuggestedZone) setZoneArea(loc.aiSuggestedZone);
          }}
          defaultCity={city}
        />

        {/* Section 3: Dual Guarantors */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              2. Dual Guarantors Protocol (دو ضامنان کی تصدیق)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Guarantor 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider block">
                Guarantor 1 (ضامن اول - قریبی رشتہ دار)
              </span>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={g1Name}
                  onChange={(e) => setG1Name(e.target.value)}
                  placeholder="Shahid Iqbal"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">CNIC</label>
                <input
                  type="text"
                  value={g1Cnic}
                  onChange={(e) => setG1Cnic(e.target.value)}
                  placeholder="35202-9876543-1"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={g1Phone}
                  onChange={(e) => setG1Phone(e.target.value)}
                  placeholder="0300-7654321"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Relation (رشتہ)</label>
                <input
                  type="text"
                  value={g1Relation}
                  onChange={(e) => setG1Relation(e.target.value)}
                  placeholder="Real Brother"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Guarantor 2 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider block">
                Guarantor 2 (ضامن دوم - کاروباری یا سرکاری ریفرنس)
              </span>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  placeholder="Kamran Butt"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">CNIC</label>
                <input
                  type="text"
                  value={g2Cnic}
                  onChange={(e) => setG2Cnic(e.target.value)}
                  placeholder="35201-5554443-2"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  placeholder="0322-8889990"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Workplace / Business</label>
                <input
                  type="text"
                  value={g2Work}
                  onChange={(e) => setG2Work(e.target.value)}
                  placeholder="Al-Madina Traders / Business Partner"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            ← Cancel
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Save KYC & Proceed to Plan (محفوظ کریں اور پلان بنائیں)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
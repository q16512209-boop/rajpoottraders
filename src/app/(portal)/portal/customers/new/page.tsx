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
  const [city, setCity] = useState("Chiniot");
  const [zoneArea, setZoneArea] = useState("Mohallah Rehman Abad & Muslim Bazaar, Chiniot");
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | undefined>(undefined);

  // Guarantor 1 State (Mandatory)
  const [g1Name, setG1Name] = useState("");
  const [g1Father, setG1Father] = useState("");
  const [g1Cnic, setG1Cnic] = useState("");
  const [g1Phone, setG1Phone] = useState("");
  const [g1Relation, setG1Relation] = useState("Brother / Relative");
  const [g1Address, setG1Address] = useState("");
  const [g1Work, setG1Work] = useState("");

  // Guarantor 2 State (OPTIONAL)
  const [g2Name, setG2Name] = useState("");
  const [g2Father, setG2Father] = useState("");
  const [g2Cnic, setG2Cnic] = useState("");
  const [g2Phone, setG2Phone] = useState("");
  const [g2Relation, setG2Relation] = useState("Neighbor / Business Reference");
  const [g2Address, setG2Address] = useState("");
  const [g2Work, setG2Work] = useState("");

  // Live Defaulter Cross-Check
  const crossCheck = store.checkHouseholdDefaulter(address, cnic, phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !cnic || !phone || !address) {
      alert("Please enter customer basic details (Name, CNIC, Phone, Address).");
      return;
    }

    const guarantorsList = [
      {
        id: `gua_${Date.now()}_1`,
        fullName: g1Name || "Guarantor 1",
        fatherName: g1Father || "Father",
        cnic: encryptField(g1Cnic || "33202-0000001-1"),
        phone: g1Phone || "0300-1111111",
        relation: g1Relation,
        address: g1Address || address,
        workplace: g1Work || "Business",
        landmark: "Chiniot",
      },
    ];

    if (g2Name && g2Name.trim().length > 0) {
      guarantorsList.push({
        id: `gua_${Date.now()}_2`,
        fullName: g2Name,
        fatherName: g2Father || "Father",
        cnic: encryptField(g2Cnic || "33202-0000002-2"),
        phone: g2Phone || "0300-2222222",
        relation: g2Relation,
        address: g2Address || address,
        workplace: g2Work || "Corporate",
        landmark: "Chiniot",
      });
    }

    const newCust = store.createCustomer({
      tenantId: currentTenant.id,
      fullName,
      fatherName,
      cnic: encryptField(cnic),
      phone,
      secondaryPhone,
      address,
      landmark: landmark || (gpsLocation?.address ? `GPS Pin: ${gpsLocation.address}` : "Near Landmark / Bazaar"),
      city,
      zoneArea: gpsLocation?.aiSuggestedZone || zoneArea,
      photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
      gpsLocation,
      guarantors: guarantorsList,
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
          Customer & Guarantor KYC Verification, Defaulter Radar & Live GPS Location
        </p>
      </div>

      {/* Household Defaulter Radar Alert */}
      {crossCheck.hasDefaulterMatch && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-900 space-y-2 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Household Defaulter Radar Alert
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
              1. Customer Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
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
              <label className="block text-slate-700 font-bold mb-1">Father / Husband Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Muhammad Ramzan"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">CNIC Number *</label>
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
              <label className="block text-slate-700 font-bold mb-1">Primary Mobile Phone *</label>
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
              <label className="block text-slate-700 font-bold mb-1">City (City)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Chiniot"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Physical Residential Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nusrat Embroidery, Near Desi Masjid, Chiniot"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-urdu"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nearest Landmark</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Masjid / Chowk"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-urdu"
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
              2. Guarantors Information (Guarantor 2 is Optional)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Guarantor 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider block">
                Guarantor 1 (Mandatory) *
              </span>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={g1Name}
                  onChange={(e) => setG1Name(e.target.value)}
                  placeholder="Muhammad Aslam"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">CNIC</label>
                <input
                  type="text"
                  value={g1Cnic}
                  onChange={(e) => setG1Cnic(e.target.value)}
                  placeholder="33202-9876543-1"
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
                <label className="block text-slate-700 font-bold mb-1">Relationship</label>
                <input
                  type="text"
                  value={g1Relation}
                  onChange={(e) => setG1Relation(e.target.value)}
                  placeholder="e.g. Brother / Neighbor"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>
            </div>

            {/* Guarantor 2 (OPTIONAL) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider block">
                  Guarantor 2 (Optional)
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Optional</span>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name (If any)</label>
                <input
                  type="text"
                  value={g2Name}
                  onChange={(e) => setG2Name(e.target.value)}
                  placeholder="Optional..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">CNIC</label>
                <input
                  type="text"
                  value={g2Cnic}
                  onChange={(e) => setG2Cnic(e.target.value)}
                  placeholder="Optional..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={g2Phone}
                  onChange={(e) => setG2Phone(e.target.value)}
                  placeholder="Optional..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Relationship</label>
                <input
                  type="text"
                  value={g2Relation}
                  onChange={(e) => setG2Relation(e.target.value)}
                  placeholder="Optional..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none font-urdu"
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
            <span>Save Customer & Create Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
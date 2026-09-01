"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { store } from "@/lib/db/store";
import { encryptField } from "@/lib/crypto/aes";
import { useAuth } from "@/lib/context/auth-context";
import { UserCheck, ShieldAlert, CheckCircle2, ArrowRight, Upload, MapPin } from "lucide-react";

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
      alert("Please fill all required customer KYC fields.");
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
      landmark,
      city,
      zoneArea,
      photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
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
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          KYC Onboarding Protocol
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          Register Customer & Dual Guarantors (Zamin)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated live verification with AES-256 cryptographic vault and Defaulter Cross-Check Radar.
        </p>
      </div>

      {/* Live Defaulter Alert Box */}
      {crossCheck.hasDefaulterMatch && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 text-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Defaulter Radar Match Detected!</span>
          </div>
          <p className="text-xs">
            {crossCheck.warningFlags.join(" • ")}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Customer Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            1. Applicant (Kharedar) Personal Data
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name (As on CNIC) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hafiz Muhammad Usman"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Father / Husband Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Siddique"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CNIC Number (13 Digits) *</label>
              <input
                type="text"
                required
                placeholder="35202-1849201-3"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="0322-9876543"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Residential House Address (As per Utility Bill) *</label>
              <input
                type="text"
                required
                placeholder="e.g. House 24, Street 7, Block G, Gulberg III"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Landmark / Nearest Location</label>
              <input
                type="text"
                placeholder="e.g. Near Gourmet Bakers"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Route Area</label>
              <select
                value={zoneArea}
                onChange={(e) => setZoneArea(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Route-A (Gulberg / Model Town)">Route-A (Gulberg / Model Town)</option>
                <option value="Route-B (Johar Town / Iqbal Town)">Route-B (Johar Town / Iqbal Town)</option>
                <option value="Route-C (Shadman / Samanabad)">Route-C (Shadman / Samanabad)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Dual Guarantors (Zamin 1 & 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            2. Dual Guarantor (Zamin) Legal Undertakings
          </h2>

          {/* Guarantor 1 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase text-emerald-800">
              Guarantor 1 (Zamin Awal - Blood Relative)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                placeholder="Full Name"
                value={g1Name}
                onChange={(e) => setG1Name(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg font-semibold"
              />
              <input
                type="text"
                placeholder="CNIC (35202-XXXXXXX-X)"
                value={g1Cnic}
                onChange={(e) => setG1Cnic(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
              />
              <input
                type="text"
                placeholder="Mobile (0300-XXXXXXX)"
                value={g1Phone}
                onChange={(e) => setG1Phone(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Relationship (e.g. Real Brother)"
                value={g1Relation}
                onChange={(e) => setG1Relation(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Workplace / Job Title"
                value={g1Work}
                onChange={(e) => setG1Work(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg sm:col-span-2"
              />
            </div>
          </div>

          {/* Guarantor 2 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase text-emerald-800">
              Guarantor 2 (Zamin Dom - Commercial / Reference)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                placeholder="Full Name"
                value={g2Name}
                onChange={(e) => setG2Name(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg font-semibold"
              />
              <input
                type="text"
                placeholder="CNIC (35201-XXXXXXX-X)"
                value={g2Cnic}
                onChange={(e) => setG2Cnic(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
              />
              <input
                type="text"
                placeholder="Mobile (0333-XXXXXXX)"
                value={g2Phone}
                onChange={(e) => setG2Phone(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Relationship (e.g. Uncle / Partner)"
                value={g2Relation}
                onChange={(e) => setG2Relation(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Workplace / Shop Name"
                value={g2Work}
                onChange={(e) => setG2Work(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg sm:col-span-2"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
          >
            <span>Save KYC & Proceed to Plan Creation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
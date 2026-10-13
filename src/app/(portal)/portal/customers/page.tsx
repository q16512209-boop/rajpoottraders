"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatCNIC, formatDate, formatPhone } from "@/lib/formatters";
import { encryptField, decryptField, maskCnic } from "@/lib/crypto/aes";
import { useAuth } from "@/lib/context/auth-context";
import { Customer, GPSLocation } from "@/lib/db/types";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import {
  Edit2,
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  UserCheck,
  ExternalLink,
  Filter,
  Upload,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function CustomersPage() {
  const { currentTenant, currentUser } = useAuth();
  const [customers, setCustomers] = useState(() => store.getCustomers(currentTenant.id));
  const dynamicRoutes = store.getRouteZones(currentTenant.id);

  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [showFullCnic, setShowFullCnic] = useState<Record<string, boolean>>({});

  // GPS Update Modal
  const [selectedCustForGps, setSelectedCustForGps] = useState<Customer | null>(null);
  const [editGpsLoc, setEditGpsLoc] = useState<GPSLocation | undefined>(undefined);
  const [editAddr, setEditAddr] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Customer Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustId, setEditCustId] = useState("");
  const [editKhataNumber, setEditKhataNumber] = useState<string>("");
  const [editFullName, setEditFullName] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editCnic, setEditCnic] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSecondaryPhone, setEditSecondaryPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [editCity, setEditCity] = useState("Chiniot");
  const [editZoneArea, setEditZoneArea] = useState("");
  const [editIsDefaulter, setEditIsDefaulter] = useState(false);
  const [editDefaulterReason, setEditDefaulterReason] = useState("");

  // Guarantors edit state
  const [editG1Name, setEditG1Name] = useState("");
  const [editG1Father, setEditG1Father] = useState("");
  const [editG1Phone, setEditG1Phone] = useState("");
  const [editG1Cnic, setEditG1Cnic] = useState("");
  const [editG1Relation, setEditG1Relation] = useState("ضامن");
  const [editG1Address, setEditG1Address] = useState("");

  const [editG2Name, setEditG2Name] = useState("");
  const [editG2Father, setEditG2Father] = useState("");
  const [editG2Phone, setEditG2Phone] = useState("");
  const [editG2Cnic, setEditG2Cnic] = useState("");
  const [editG2Relation, setEditG2Relation] = useState("");
  const [editG2Address, setEditG2Address] = useState("");

  const toggleCnicVisibility = (id: string) => {
    setShowFullCnic((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = customers.filter((c) => {
    const rawCnic = decryptField(c.cnic);
    const q = search.toLowerCase();
    const matchesSearch =
      c.fullName.toLowerCase().includes(q) ||
      (c.khataNumber !== undefined && c.khataNumber !== null && String(c.khataNumber).includes(q)) ||
      rawCnic.includes(q) ||
      c.phone.includes(q) ||
      c.address.toLowerCase().includes(q);
    const matchesRoute = selectedRoute === "ALL" || c.zoneArea === selectedRoute;
    return matchesSearch && matchesRoute;
  });

  const handleOpenGpsModal = (c: Customer) => {
    setSelectedCustForGps(c);
    setEditGpsLoc(c.gpsLocation);
    setEditAddr(c.address);
  };

  const handleSaveCustomerGps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForGps || !editGpsLoc) return;
    try {
      store.updateCustomerGps(selectedCustForGps.id, editGpsLoc, editAddr);
      setCustomers([...store.getCustomers(currentTenant.id)]);
      setSelectedCustForGps(null);
      setMsg({
        type: "success",
        text: `GPS location updated successfully for ${selectedCustForGps.fullName}!`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update GPS" });
    }
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditCustId(c.id);
    setEditKhataNumber(c.khataNumber !== undefined && c.khataNumber !== null ? String(c.khataNumber) : "");
    setEditFullName(c.fullName);
    setEditFatherName(c.fatherName || "");
    const rawCnic = decryptField(c.cnic);
    setEditCnic(rawCnic !== "[ENCRYPTED DATA]" && rawCnic !== "N/A" ? rawCnic : (c.cnic || ""));
    setEditPhone(c.phone);
    setEditSecondaryPhone(c.secondaryPhone || "");
    setEditAddress(c.address);
    setEditLandmark(c.landmark || "");
    setEditCity(c.city || "Chiniot");
    setEditZoneArea(c.zoneArea || (dynamicRoutes[0]?.name || ""));
    setEditIsDefaulter(c.isDefaulter || false);
    setEditDefaulterReason(c.defaulterReason || "");

    const g1 = c.guarantors && c.guarantors[0];
    if (g1) {
      setEditG1Name(g1.fullName);
      setEditG1Father(g1.fatherName || "");
      setEditG1Phone(g1.phone || "");
      const g1DecCnic = decryptField(g1.cnic);
      setEditG1Cnic(g1DecCnic !== "[ENCRYPTED DATA]" && g1DecCnic !== "N/A" ? g1DecCnic : (g1.cnic || ""));
      setEditG1Relation(g1.relation || "ضامن");
      setEditG1Address(g1.address || "");
    } else {
      setEditG1Name("");
      setEditG1Father("");
      setEditG1Phone("");
      setEditG1Cnic("");
      setEditG1Relation("ضامن");
      setEditG1Address("");
    }

    const g2 = c.guarantors && c.guarantors[1];
    if (g2) {
      setEditG2Name(g2.fullName);
      setEditG2Father(g2.fatherName || "");
      setEditG2Phone(g2.phone || "");
      const g2DecCnic = decryptField(g2.cnic);
      setEditG2Cnic(g2DecCnic !== "[ENCRYPTED DATA]" && g2DecCnic !== "N/A" ? g2DecCnic : (g2.cnic || ""));
      setEditG2Relation(g2.relation || "پڑوسی");
      setEditG2Address(g2.address || "");
    } else {
      setEditG2Name("");
      setEditG2Father("");
      setEditG2Phone("");
      setEditG2Cnic("");
      setEditG2Relation("");
      setEditG2Address("");
    }

    setShowEditModal(true);
    setMsg(null);
  };

  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editCustId) return;

    try {
      const guarantorsList: any[] = [];
      if (editG1Name.trim()) {
        guarantorsList.push({
          id: `gua_${editCustId}_1`,
          fullName: editG1Name.trim(),
          fatherName: editG1Father.trim() || "",
          phone: editG1Phone.trim(),
          cnic: editG1Cnic.trim() ? encryptField(editG1Cnic.trim()) : "N/A",
          relation: editG1Relation.trim() || "ضامن",
          address: editG1Address.trim() || editAddress,
          workplace: "کاروبار / ذاتی",
          landmark: editLandmark || "Chiniot",
        });
      }

      if (editG2Name.trim()) {
        guarantorsList.push({
          id: `gua_${editCustId}_2`,
          fullName: editG2Name.trim(),
          fatherName: editG2Father.trim() || "",
          phone: editG2Phone.trim(),
          cnic: editG2Cnic.trim() ? encryptField(editG2Cnic.trim()) : "N/A",
          relation: editG2Relation.trim() || "پڑوسی",
          address: editG2Address.trim() || editAddress,
          workplace: "کاروبار",
          landmark: editLandmark || "Chiniot",
        });
      }

      const updated = store.updateCustomer(currentUser, editCustId, {
        khataNumber: editKhataNumber.trim() ? Number(editKhataNumber) : undefined,
        fullName: editFullName.trim(),
        fatherName: editFatherName.trim(),
        cnic: editCnic.trim() ? encryptField(editCnic.trim()) : "N/A",
        phone: editPhone.trim(),
        secondaryPhone: editSecondaryPhone.trim(),
        address: editAddress.trim(),
        landmark: editLandmark.trim(),
        city: editCity.trim(),
        zoneArea: editZoneArea.trim(),
        guarantors: guarantorsList.length > 0 ? guarantorsList : undefined,
        isDefaulter: editIsDefaulter,
        defaulterReason: editIsDefaulter ? editDefaulterReason.trim() : undefined,
      });

      setCustomers([...store.getCustomers(currentTenant.id)]);
      setShowEditModal(false);
      setMsg({
        type: "success",
        text: `گاہک "${updated.fullName}" کا ریکارڈ (کھاتہ #${updated.khataNumber || "N/A"}) کامیابی سے اپ ڈیٹ ہو گیا!`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update customer" });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              KYC Vault & Defaulter Radar
            </span>
            <UrduSpeaker customText="گاہکوں کا مکمل ریکارڈ، شناختی کارڈ والٹ، ضامنان کی تفصیلات اور لائیو جی پی ایس پن لوکیشن۔" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Customer Records & Dual Guarantors (Zamin)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Encrypted with AES-256-GCM at rest with automated cross-check on shared residential addresses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/portal/customers/legacy-entry"
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow transition-all border border-amber-400"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Fast Old Khata Entry</span>
          </Link>

          <Link
            href="/portal/customers/new"
            className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>Register New Customer</span>
          </Link>
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Search & Route Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by name, decrypted CNIC, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none w-full md:w-auto"
          >
            <option value="ALL">All Route Zones</option>
            {dynamicRoutes.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500 whitespace-nowrap">
          Showing {filtered.length} Customer Profiles
        </div>
      </div>

      {/* Customers Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800">Filhal koi record mojood nahi hai.</h3>
            <p className="text-xs text-slate-500 font-urdu">
              فی الحال کوئی ریکارڈ موجود نہیں ہے۔ نیا کسٹمر شامل کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              href="/portal/customers/new"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Naya Customer Shamil Karein</span>
            </Link>
            <Link
              href="/portal/import"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Excel Bulk Migration</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
          const rawCnic = decryptField(c.cnic);
          const isRevealed = !!showFullCnic[c.id];

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between ${
                c.isDefaulter ? "border-2 border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      c.isDefaulter
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {c.isDefaulter ? "DEFAULTER FLAGGED" : `Risk Score: ${c.riskScore}/100 (Safe)`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Registered: {formatDate(c.createdAt)}
                  </span>
                </div>

                {/* Profile Information & Khata Number */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{c.fullName}</h3>
                    <p className="text-xs text-slate-500">S/O {c.fatherName || "N/A"}</p>
                  </div>
                  {c.khataNumber !== undefined && c.khataNumber !== null ? (
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-xl text-xs border border-amber-400 shadow-sm shrink-0">
                      📖 کھاتہ #{c.khataNumber}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 font-semibold rounded-lg text-[10px]">
                      No Khata #
                    </span>
                  )}
                </div>

                {/* Encrypted CNIC & Visibility Toggle */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans font-bold">AES-256 CNIC:</span>
                    <strong className="text-slate-900">
                      {isRevealed ? formatCNIC(rawCnic) : maskCnic(rawCnic)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCnicVisibility(c.id)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"
                    title={isRevealed ? "Hide CNIC" : "Decrypt & Reveal CNIC"}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Contact & Address */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatPhone(c.phone)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address}, {c.city}</span>
                  </div>
                </div>

                {/* GPS Status & Map Link */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] truncate max-w-[140px]">
                      {c.gpsLocation?.lat ? `${c.gpsLocation.lat.toFixed(4)}, ${c.gpsLocation.lng.toFixed(4)}` : "No GPS Pin"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenGpsModal(c)}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg text-[11px] transition-colors"
                  >
                    Pin / Update GPS
                  </button>
                </div>

                {/* Dual Guarantor Mini Count */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Dual Guarantors:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {c.guarantors.length} Verified Zamin
                  </span>
                </div>

                {c.defaulterReason && (
                  <div className="p-2.5 bg-rose-100/70 border border-rose-300 rounded-xl text-[11px] text-rose-900 leading-snug">
                    <strong className="block">Defaulter Alert:</strong>
                    {c.defaulterReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditCustomer(c)}
                  className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  title="گاہک کی معلومات، کھاتہ نمبر، شناختی کارڈ اور ضامن ایڈٹ کریں"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <Link
                  href={`/portal/plans/new?cust=${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  <span>Create Installment Plan</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* MODAL: Update Customer GPS Location */}
      {selectedCustForGps && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Live Geolocation Assistant
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Pin GPS for {selectedCustForGps.fullName}</h3>
              </div>
              <button onClick={() => setSelectedCustForGps(null)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerGps} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Interactive Map Location Picker</label>
                <MapLocationPicker
                  value={editGpsLoc}
                  onChange={(loc) => setEditGpsLoc(loc)}
                  onAddressAutoFill={(addr) => {
                    if (addr) setEditAddr(addr);
                  }}
                  defaultCity={selectedCustForGps.city || "Chiniot"}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Address & Landmark</label>
                <input
                  type="text"
                  required
                  value={editAddr}
                  onChange={(e) => setEditAddr(e.target.value)}
                  placeholder="e.g. Mohallah Rehman Abad, Street #3, Near Desi Masjid, Chiniot"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedCustForGps(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Location Pin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Edit Customer & Khata # */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Full Customer & Khata Editor
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  گاہک ریکارڈ و کھاتہ نمبر میں ترمیم کریں
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="space-y-6 text-xs">
              {/* 1. KHATA # & PRIMARY IDENTITY */}
              <div className="bg-amber-50/70 border-2 border-amber-300 p-4 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-amber-950 font-black text-sm">
                      📖 Physical Register Khata # / کھاتہ نمبر
                    </label>
                    <p className="text-[11px] text-amber-800 font-urdu">
                      دکان کے فزیکل رجسٹر یا ڈائری کا کھاتہ نمبر درج کریں (مثلاً: 14، 43، 118)
                    </p>
                  </div>
                  <input
                    type="number"
                    value={editKhataNumber}
                    onChange={(e) => setEditKhataNumber(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full sm:w-44 p-3 bg-white border-2 border-amber-400 rounded-xl font-black text-slate-900 text-base outline-none focus:border-amber-600 shadow-inner"
                  />
                </div>
              </div>

              {/* 2. PERSONAL DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1">
                  1. ذاتی تفصیلات و رابطے (Personal Information)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name / گاہک کا نام *</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Father / Husband Name / ولدیت</label>
                    <input
                      type="text"
                      value={editFatherName}
                      onChange={(e) => setEditFatherName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CNIC / شناختی کارڈ نمبر</label>
                    <input
                      type="text"
                      value={editCnic}
                      onChange={(e) => setEditCnic(e.target.value)}
                      placeholder="35201-1234567-1 (اختیاری)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Mobile Phone / موبائل نمبر *</label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Secondary / WhatsApp Phone</label>
                    <input
                      type="tel"
                      value={editSecondaryPhone}
                      onChange={(e) => setEditSecondaryPhone(e.target.value)}
                      placeholder="0321-7654321"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">City / شہر</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Address / رہائشی پتہ *</label>
                    <input
                      type="text"
                      required
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Landmark / قریبی مشہور جگہ</label>
                    <input
                      type="text"
                      value={editLandmark}
                      onChange={(e) => setEditLandmark(e.target.value)}
                      placeholder="Near Desi Masjid / Main Bazaar"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Route / Zone (علاقہ و بازار) *</label>
                  <select
                    value={editZoneArea}
                    onChange={(e) => setEditZoneArea(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    {dynamicRoutes.map((r) => (
                      <option key={r.id} value={r.name}>
                        📍 {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. DUAL GUARANTORS (ZAMIN) */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1">
                  2. ضامنان کی تفصیلات (Dual Guarantors / Zamin)
                </h4>

                {/* Guarantor 1 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ضامن اول (Guarantor 1)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">نام ضامن</label>
                      <input
                        type="text"
                        value={editG1Name}
                        onChange={(e) => setEditG1Name(e.target.value)}
                        placeholder="Zamin Name"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ولدیت</label>
                      <input
                        type="text"
                        value={editG1Father}
                        onChange={(e) => setEditG1Father(e.target.value)}
                        placeholder="Father Name"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">موبائل نمبر</label>
                      <input
                        type="tel"
                        value={editG1Phone}
                        onChange={(e) => setEditG1Phone(e.target.value)}
                        placeholder="0300-0000000"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">شناختی کارڈ</label>
                      <input
                        type="text"
                        value={editG1Cnic}
                        onChange={(e) => setEditG1Cnic(e.target.value)}
                        placeholder="CNIC (Optional)"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رشتہ / تعلق</label>
                      <input
                        type="text"
                        value={editG1Relation}
                        onChange={(e) => setEditG1Relation(e.target.value)}
                        placeholder="Brother / Relative"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">پتہ و کاروبار</label>
                      <input
                        type="text"
                        value={editG1Address}
                        onChange={(e) => setEditG1Address(e.target.value)}
                        placeholder="Address"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Guarantor 2 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>ضامن دوم (Guarantor 2 - اختیاری)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">نام ضامن دوم</label>
                      <input
                        type="text"
                        value={editG2Name}
                        onChange={(e) => setEditG2Name(e.target.value)}
                        placeholder="Zamin 2 Name"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">موبائل نمبر</label>
                      <input
                        type="tel"
                        value={editG2Phone}
                        onChange={(e) => setEditG2Phone(e.target.value)}
                        placeholder="0300-0000000"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رشتہ / تعلق</label>
                      <input
                        type="text"
                        value={editG2Relation}
                        onChange={(e) => setEditG2Relation(e.target.value)}
                        placeholder="Neighbor / Reference"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. DEFAULTER RADAR OVERRIDE */}
              <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-black text-rose-900 text-xs">
                  <input
                    type="checkbox"
                    checked={editIsDefaulter}
                    onChange={(e) => setEditIsDefaulter(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>اس گاہک کو ڈیفالٹر / نادہندہ (Blacklisted Defaulter) نشان زد کریں</span>
                </label>
                {editIsDefaulter && (
                  <input
                    type="text"
                    value={editDefaulterReason}
                    onChange={(e) => setEditDefaulterReason(e.target.value)}
                    placeholder="ڈیفالٹ کی وجہ درج کریں (مثلاً: سابقہ قسط نادہندہ)"
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-rose-900 outline-none"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  منسوخ کریں (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>محفوظ کریں (Save Changes)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
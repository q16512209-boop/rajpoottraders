"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatCNIC, formatDate, formatPhone } from "@/lib/formatters";
import { decryptField, maskCnic } from "@/lib/crypto/aes";
import { useAuth } from "@/lib/context/auth-context";
import { Customer, GPSLocation } from "@/lib/db/types";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import {
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
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function CustomersPage() {
  const { currentTenant } = useAuth();
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

  const toggleCnicVisibility = (id: string) => {
    setShowFullCnic((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = customers.filter((c) => {
    const rawCnic = decryptField(c.cnic);
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      rawCnic.includes(search) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase());
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

                {/* Profile Information */}
                <div>
                  <h3 className="text-base font-black text-slate-900">{c.fullName}</h3>
                  <p className="text-xs text-slate-500">S/O {c.fatherName}</p>
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

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={`/portal/plans/new?cust=${c.id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  <span>Create Installment Plan</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

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
    </div>
  );
}
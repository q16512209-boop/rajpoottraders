"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { Tenant } from "@/lib/db/types";
import { formatPhone, formatDate } from "@/lib/formatters";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Power,
  ExternalLink,
  MapPin,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  Store,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function BusinessManagerPage() {
  const { currentUser, currentTenant, switchTenant } = useAuth();
  const [businesses, setBusinesses] = useState<Tenant[]>(() => store.getBusinesses());
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Faisalabad");
  const [address, setAddress] = useState("");
  const [customHeader, setCustomHeader] = useState("");

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return (
      <div className="p-8 text-center text-rose-600 font-bold bg-white rounded-3xl border border-rose-200">
        اس صفحے تک رسائی صرف پلیٹ فارم سوپر ایڈمن (Super Admin) کے پاس ہے۔
      </div>
    );
  }

  const refreshList = () => {
    setBusinesses([...store.getBusinesses()]);
  };

  const filteredBusinesses = businesses.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      b.name.toLowerCase().includes(q) ||
      b.ownerName.toLowerCase().includes(q) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      b.contact.includes(q)
    );
  });

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = store.toggleBusinessStatus(id);
      refreshList();
      setMsg({
        type: "success",
        text: `Business status changed to ${res.status}.`,
      });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update status." });
    }
  };

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim() || !phone.trim()) {
      setMsg({ type: "error", text: "Please fill all required fields." });
      return;
    }

    try {
      const newBiz = store.createBusiness({
        name: name.trim(),
        slug: slug.trim() || undefined,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim() || undefined,
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || `${city} Main Market`,
        customHeader: customHeader.trim() || undefined,
      });

      refreshList();
      setShowModal(false);
      setName("");
      setSlug("");
      setOwnerName("");
      setOwnerEmail("");
      setPhone("");
      setAddress("");
      setCustomHeader("");

      setMsg({
        type: "success",
        text: `کامیابی: نیا کاروبار "${newBiz.name}" رجسٹر ہو گیا اور ایڈمن لاگ ان تیار ہے۔`,
      });
      setTimeout(() => setMsg(null), 6000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to register business." });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-purple-700/80 text-purple-100 px-3 py-0.5 rounded-full border border-purple-500/30">
              Super Admin Multi-Tenant Platform
            </span>
            <UrduSpeaker customText="تمام کاروباری شاپس اور مالکان کا مکمل کنٹرول اور برانڈنگ مینجمنٹ۔" size="sm" />
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-400" />
            Registered Businesses & Multi-Tenant Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu">
            تمام آزاد شاپس، شو رومز اور فرنچائزز کی تفصیل، وائٹ لیبل برانڈنگ اور کسٹمر ڈیٹا آئسولیشن۔
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register New Shop / Business</span>
        </button>
      </div>

      {/* Message Toast */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. SEARCH & STATS BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business name, owner, city, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span className="px-3 py-1.5 bg-slate-100 rounded-xl">
            Total Shops: {businesses.length}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
            Active: {businesses.filter((b) => b.status === "ACTIVE").length}
          </span>
        </div>
      </div>

      {/* 3. BUSINESS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBusinesses.map((biz) => {
          const isCurrentActive = currentTenant.id === biz.id;
          const bizPlans = store.getPlans(biz.id);
          const bizCustomers = store.getCustomers(biz.id);

          return (
            <div
              key={biz.id}
              className={`bg-white rounded-3xl border-2 p-6 shadow-sm space-y-5 transition-all flex flex-col justify-between ${
                isCurrentActive
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-emerald-700 shrink-0" />
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {biz.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      Code: {biz.code} • {biz.city || "Pakistan"}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      biz.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-rose-50 text-rose-800 border-rose-300"
                    }`}
                  >
                    {biz.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700 border border-slate-100 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" /> Owner:
                    </span>
                    <strong className="text-slate-900">{biz.ownerName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> Helpline:
                    </span>
                    <span>{formatPhone(biz.contact)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location:
                    </span>
                    <span className="truncate max-w-[170px] text-right">{biz.address}</span>
                  </div>
                </div>

                {/* Tenant Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Khata Plans</span>
                    <strong className="text-base font-black text-emerald-950">{bizPlans.length}</strong>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-2">
                    <span className="text-[10px] uppercase font-bold text-blue-800 block">KYC Customers</span>
                    <strong className="text-base font-black text-blue-950">{bizCustomers.length}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleToggleStatus(biz.id, e)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    biz.status === "ACTIVE"
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
                  title="Toggle Business Status"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{biz.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                </button>

                {isCurrentActive ? (
                  <span className="px-4 py-2 bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active View
                  </span>
                ) : (
                  <button
                    onClick={() => switchTenant(biz.id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all"
                  >
                    <span>Switch To Shop</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. REGISTER NEW BUSINESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Register New Shop / Business
                  </h3>
                  <p className="text-xs text-slate-500 font-urdu">
                    نیا کاروباری ادارہ، شو روم یا فرنچائز برانچ رجسٹر کریں۔
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Business / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Electronics, Khan Motors..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Faisalabad, Lahore, Chiniot..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Shop Helpline / Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haji Abdul Rasheed"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Owner Email (Optional for Login)
                </label>
                <input
                  type="email"
                  placeholder="owner@business.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Physical Shop / Showroom Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop # 14, Katchery Bazaar, Faisalabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Custom Printable Receipt Header
                </label>
                <input
                  type="text"
                  placeholder="e.g. AL-MADINA ELECTRONICS & APPLIANCES"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 space-y-1">
                <span className="font-bold block">✨ Automated Provisioning:</span>
                <p className="text-[11px] leading-relaxed">
                  Upon registration, an isolated database partition, default owner account (pass: <code>owner123</code>), and multi-wallet accounts will be generated automatically.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md"
                >
                  Register Business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

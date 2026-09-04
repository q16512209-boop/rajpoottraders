"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { IClaimRequest, InstallmentPlan, Customer, Product } from "@/lib/db/types";
import { formatPhone, formatDate, formatPKR } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Search,
  ShieldAlert,
  Wrench,
  RotateCcw,
  FileText,
  UserCheck,
  Check,
  XCircle,
  HelpCircle,
  Filter,
  RefreshCw,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function ClaimsAndReturnsPage() {
  const { currentUser, currentTenant } = useAuth();
  const [claims, setClaims] = useState<IClaimRequest[]>(() => store.getClaimRequests(currentTenant.id));
  const [plans] = useState<InstallmentPlan[]>(() => store.getPlans(currentTenant.id));
  const [products] = useState<Product[]>(() => store.getProducts(currentTenant.id));

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<IClaimRequest | null>(null);

  // Resolution Mode
  const [resolveType, setResolveType] = useState<"SAME_DAY_REPAIR" | "REPLACE_NEW_UNIT" | "RETURN_WAPSI" | "REJECT">("SAME_DAY_REPAIR");
  const [replacementProdId, setReplacementProdId] = useState("");
  const [replacementSerial, setReplacementSerial] = useState("");
  const [defectiveAction, setDefectiveAction] = useState<"SEND_TO_DEFECTIVE_STORE" | "REFURBISH_FOR_RESALE" | "DISCARD_SCRAP">("SEND_TO_DEFECTIVE_STORE");
  const [wapsiCondition, setWapsiCondition] = useState<"USED_REFURBISHED" | "DEFECTIVE_DAMAGED">("DEFECTIVE_DAMAGED");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // New Claim Form State
  const [reqType, setReqType] = useState<IClaimRequest["type"]>("WARRANTY_CLAIM");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [imeiSerial, setImeiSerial] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [physicalConditionNotes, setPhysicalConditionNotes] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const isOwnerOrAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER" || currentUser.role === "BRANCH_MANAGER";

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    if (!planId) return;
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setCustomerName(plan.customerName);
      setCustomerPhone(plan.customerPhone);
      setProductTitle(plan.productTitle);
      setImeiSerial(plan.imeiSerial || "");
    }
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !productTitle || !issueDescription) {
      setMsg({ type: "error", text: "Please fill all required fields." });
      return;
    }

    try {
      const selectedPlan = plans.find((p) => p.id === selectedPlanId);
      store.createClaimRequest({
        tenantId: currentTenant.id,
        type: reqType,
        planId: selectedPlanId || undefined,
        planNumber: selectedPlan?.planNumber,
        customerId: selectedPlan?.customerId,
        customerName,
        customerPhone,
        productTitle,
        imeiSerial,
        issueDescription,
        physicalConditionNotes,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requesterRole: currentUser.role,
      });

      setClaims([...store.getClaimRequests(currentTenant.id)]);
      setShowModal(false);
      // Reset form
      setSelectedPlanId("");
      setCustomerName("");
      setCustomerPhone("");
      setProductTitle("");
      setImeiSerial("");
      setIssueDescription("");
      setPhysicalConditionNotes("");
      setMsg({
        type: "success",
        text: "Claim / Return request has been logged successfully and forwarded for manager review.",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to submit request" });
    }
  };

  const handleOpenResolve = (claim: IClaimRequest) => {
    setSelectedClaim(claim);
    setResolveType("SAME_DAY_REPAIR");
    setReplacementProdId(products[0]?.id || "");
    setReplacementSerial(`NEW-SN-${Date.now().toString().slice(-6)}`);
    setResolutionNotes("");
    setShowResolveModal(true);
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    try {
      if (resolveType === "SAME_DAY_REPAIR") {
        store.resolveClaimOnSpot({
          claimId: selectedClaim.id,
          resolutionNotes: resolutionNotes || "Repaired same-day at showroom / route technician.",
          actor: currentUser,
        });
        setMsg({ type: "success", text: `Claim #${selectedClaim.id} marked as REPAIRED & RESOLVED same-day!` });
      } else if (resolveType === "REPLACE_NEW_UNIT") {
        const prod = products.find((p) => p.id === replacementProdId);
        store.resolveClaimWithReplacement({
          claimId: selectedClaim.id,
          replacementProductId: prod?.id || "prod_new",
          replacementProductTitle: prod?.title || "New Replacement Unit",
          replacementSerial: replacementSerial || `SN-NEW-${Date.now()}`,
          defectiveAction,
          resolutionNotes: resolutionNotes || "Replaced with brand new unit.",
          actor: currentUser,
        });
        setMsg({
          type: "success",
          text: `Claim #${selectedClaim.id} resolved with New Replacement Unit (SN: ${replacementSerial})! Old unit received into defective stock.`,
        });
      } else if (resolveType === "RETURN_WAPSI") {
        store.resolveClaimWithReturnWapsi({
          claimId: selectedClaim.id,
          inventoryCondition: wapsiCondition,
          resolutionNotes: resolutionNotes || "Item returned by customer and contract finalized.",
          actor: currentUser,
        });
        setMsg({ type: "success", text: `Wapsi / Return finalized! Product added to store stock (${wapsiCondition}).` });
      } else if (resolveType === "REJECT") {
        store.updateClaimRequestStatus(selectedClaim.id, "REJECTED", resolutionNotes || "Customer claim rejected due to physical void warranty.", currentUser);
        setMsg({ type: "success", text: `Claim #${selectedClaim.id} marked as REJECTED.` });
      }

      setClaims([...store.getClaimRequests(currentTenant.id)]);
      setShowResolveModal(false);
      setSelectedClaim(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to process resolution" });
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = c.customerPhone.includes(q);
      const matchProd = c.productTitle.toLowerCase().includes(q);
      const matchSerial = (c.imeiSerial || "").toLowerCase().includes(q);
      const matchPlan = (c.planNumber || "").toLowerCase().includes(q);
      return matchName || matchPhone || matchProd || matchSerial || matchPlan;
    }
    return true;
  });

  const getStatusBadge = (status: IClaimRequest["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved / Dispatch</span>
          </span>
        );
      case "RESOLVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Resolved & Closed</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
              Customer Support & Lifecycle
            </span>
            <UrduSpeaker customText="وارنٹی کلیم، سامان واپسی اور تکنیکی مسائل کا باقاعدہ حل۔ ریکوری مین فیلڈ سے درخواست کرے گا اور مالک نئی چیز کا تبادلہ یا دکان پر ریپیئر منظور کر سکتا ہے۔" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-purple-600" />
            Warranty Claims & Item Returns (Wapsi)
          </h1>
          <p className="text-xs text-slate-500">
            Log field fault claims, swap defective appliances with new units, or process item returns into store inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setMsg(null);
          }}
          className="px-5 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File Claim / Return Request</span>
        </button>
      </div>

      {/* Alert Notification */}
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

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Claims</span>
            <strong className="text-2xl font-black text-slate-900">{claims.length}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
            <strong className="text-2xl font-black text-amber-700">
              {claims.filter((c) => c.status === "PENDING_APPROVAL").length}
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Replacements & Wapsi</span>
            <strong className="text-2xl font-black text-blue-700">
              {claims.filter((c) => c.type === "RETURN_WAPSI" || c.resolutionType === "REPLACED_WITH_NEW").length}
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolved & Closed</span>
            <strong className="text-2xl font-black text-emerald-700">
              {claims.filter((c) => c.status === "RESOLVED").length}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search customer, phone, serial/IMEI, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="WARRANTY_CLAIM">Warranty Claim</option>
              <option value="RETURN_WAPSI">Return / Wapsi</option>
              <option value="PRODUCT_ISSUE">Technical Fault</option>
              <option value="DISPUTE">Dispute</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Records List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClaims.map((claim) => (
          <div
            key={claim.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                      #{claim.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-500">
                      {claim.type.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">{claim.customerName}</h3>
                </div>
                {getStatusBadge(claim.status)}
              </div>

              {/* Product & Contract Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Product / Item:</span>
                  <strong className="text-slate-900 font-bold">{claim.productTitle}</strong>
                </div>
                {claim.imeiSerial && (
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400 font-sans">Serial / IMEI:</span>
                    <span className="font-bold text-slate-700">{claim.imeiSerial}</span>
                  </div>
                )}
                {claim.planNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Khata / Contract:</span>
                    <span className="font-mono font-bold text-emerald-800">#{claim.planNumber}</span>
                  </div>
                )}
              </div>

              {/* Fault Description */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Reported Fault Description:
                </span>
                <p className="text-slate-800 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50 font-medium">
                  {claim.issueDescription}
                </p>
              </div>

              {claim.physicalConditionNotes && (
                <p className="text-[11px] text-slate-500 italic">
                  Physical condition: &ldquo;{claim.physicalConditionNotes}&rdquo;
                </p>
              )}

              {/* Resolution Info if resolved */}
              {claim.resolutionNotes && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <span className="text-emerald-900 font-black block">Resolution Decision:</span>
                  <p className="text-emerald-800 font-medium">{claim.resolutionNotes}</p>
                  {claim.replacementSerial && (
                    <span className="text-[10px] font-mono font-bold text-emerald-950 block">
                      New Replacement Unit Serial: {claim.replacementSerial}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                By: <strong>{claim.requestedByName}</strong> • {formatDate(claim.createdAt)}
              </span>

              {isOwnerOrAdmin && claim.status !== "RESOLVED" && claim.status !== "REJECTED" && (
                <button
                  onClick={() => handleOpenResolve(claim)}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Process Resolution</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredClaims.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No claims or return requests found.</p>
            <p className="text-xs text-slate-400">Click &quot;File Claim / Return Request&quot; above to log a new warranty claim or product return.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: File New Claim / Return Request */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                  New Request Form
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">File Warranty Claim / Return</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Request Category *</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  <option value="WARRANTY_CLAIM">Warranty Claim (Fault / Malfunction)</option>
                  <option value="RETURN_WAPSI">Return / Wapsi (Item Return / Cancellation)</option>
                  <option value="PRODUCT_ISSUE">Technical Issue / Physical Fault</option>
                  <option value="DISPUTE">Customer Account / Delivery Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Link to Active Customer Khata (Optional)</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  <option value="">-- Choose Existing Installment Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customerName} — {p.productTitle} (#{p.khataNumber || p.planNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Akbar Ali"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Heavy Iron"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Serial / IMEI (If known)</label>
                  <input
                    type="text"
                    placeholder="SN-123456"
                    value={imeiSerial}
                    onChange={(e) => setImeiSerial(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Fault / Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain exactly what is wrong (e.g. not heating up, motor humming, cooling leakage)..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Physical Condition Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Minor body scratch, seal intact, cable fine..."
                  value={physicalConditionNotes}
                  onChange={(e) => setPhysicalConditionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Comprehensive Claim Resolution (Same-day repair, Replacement with New Serial, Wapsi) */}
      {showResolveModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Manager Resolution Decision
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Resolve Claim #{selectedClaim.id.slice(-6)}</h3>
              </div>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
                <span className="text-purple-900 font-black block">Customer: {selectedClaim.customerName}</span>
                <span className="text-slate-700 block">Product: {selectedClaim.productTitle} (SN: {selectedClaim.imeiSerial || "N/A"})</span>
                <span className="text-slate-500 text-[11px] block">Reported: {selectedClaim.issueDescription}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Resolution Path *</label>
                <select
                  value={resolveType}
                  onChange={(e) => setResolveType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  <option value="SAME_DAY_REPAIR">1. Showroom / On-Route Same-Day Repair (اسی دن مرمت)</option>
                  <option value="REPLACE_NEW_UNIT">2. Replace with Brand New Unit (نئی پروڈکٹ کا تبادلہ)</option>
                  <option value="RETURN_WAPSI">3. Customer Return / Wapsi (سامان واپسی اور کھاتہ کلوز)</option>
                  <option value="REJECT">4. Reject Claim (مسترد کریں)</option>
                </select>
              </div>

              {/* Path 1: Replace New Unit Fields */}
              {resolveType === "REPLACE_NEW_UNIT" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-blue-900 block">New Unit Allocation:</span>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Replacement Product *</label>
                    <select
                      value={replacementProdId}
                      onChange={(e) => setReplacementProdId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.stockQuantity || 0} in stock)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">New Serial / IMEI Number *</label>
                    <input
                      type="text"
                      required
                      value={replacementSerial}
                      onChange={(e) => setReplacementSerial(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none"
                    />
                    <span className="text-[10px] text-blue-700 block mt-0.5">Customer&apos;s active khata serial will automatically update to this new number.</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">What to do with Old Defective Unit? *</label>
                    <select
                      value={defectiveAction}
                      onChange={(e) => setDefectiveAction(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                    >
                      <option value="SEND_TO_DEFECTIVE_STORE">Keep in Shop Defective / Scrap Store (خراب اسٹاک)</option>
                      <option value="REFURBISH_FOR_RESALE">Repair & Refurbish for Second-hand Resale (استعمال شدہ اسٹاک)</option>
                      <option value="DISCARD_SCRAP">Discard as Scrap</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Path 2: Return Wapsi */}
              {resolveType === "RETURN_WAPSI" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-amber-950 block">Returned Inventory Intake:</span>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Store Inventory Condition *</label>
                    <select
                      value={wapsiCondition}
                      onChange={(e) => setWapsiCondition(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                    >
                      <option value="DEFECTIVE_DAMAGED">Defective / Damaged Stock (خراب مال)</option>
                      <option value="USED_REFURBISHED">Used / Refurbished Resale Stock (قابل فروخت استعمال شدہ)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Resolution & Handover Notes *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. New fan handed to Bilal Recovery Officer to deliver to Akbar Ali..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Resolution & Update Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

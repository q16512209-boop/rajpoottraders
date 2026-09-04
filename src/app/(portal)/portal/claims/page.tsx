"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { IClaimRequest, InstallmentPlan, Customer } from "@/lib/db/types";
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
} from "lucide-react";

export default function ClaimsAndReturnsPage() {
  const { currentUser, currentTenant } = useAuth();
  const [claims, setClaims] = useState<IClaimRequest[]>(() => store.getClaimRequests(currentTenant.id));
  const [plans] = useState<InstallmentPlan[]>(() => store.getPlans(currentTenant.id));
  const [customers] = useState<Customer[]>(() => store.getCustomers(currentTenant.id));

  const [showModal, setShowModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<IClaimRequest | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"APPROVED" | "REJECTED" | "RESOLVED">("APPROVED");
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

  const isOwnerOrAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

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

  const handleOpenResolve = (claim: IClaimRequest, action: "APPROVED" | "REJECTED" | "RESOLVED") => {
    setSelectedClaim(claim);
    setResolutionAction(action);
    setResolutionNotes("");
    setShowResolveModal(true);
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    try {
      store.updateClaimRequestStatus(selectedClaim.id, resolutionAction, resolutionNotes, currentUser);
      setClaims([...store.getClaimRequests(currentTenant.id)]);
      setShowResolveModal(false);
      setSelectedClaim(null);
      setMsg({
        type: "success",
        text: `Claim request #${selectedClaim.id} updated to ${resolutionAction}.`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        c.productTitle.toLowerCase().includes(q) ||
        (c.planNumber && c.planNumber.toLowerCase().includes(q)) ||
        (c.imeiSerial && c.imeiSerial.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = claims.filter((c) => c.status === "PENDING_APPROVAL").length;
  const approvedCount = claims.filter((c) => c.status === "APPROVED").length;
  const resolvedCount = claims.filter((c) => c.status === "RESOLVED").length;

  const typeLabels: Record<IClaimRequest["type"], { label: string; color: string; icon: any }> = {
    WARRANTY_CLAIM: { label: "Warranty Claim", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Wrench },
    RETURN_WAPSI: { label: "Return / Wapsi", color: "bg-rose-100 text-rose-800 border-rose-300", icon: RotateCcw },
    PRODUCT_ISSUE: { label: "Technical Issue", color: "bg-blue-100 text-blue-800 border-blue-300", icon: ShieldAlert },
    DISPUTE: { label: "Customer Dispute", color: "bg-purple-100 text-purple-800 border-purple-300", icon: HelpCircle },
  };

  const statusLabels: Record<IClaimRequest["status"], { label: string; color: string }> = {
    PENDING_APPROVAL: { label: "Pending Approval", color: "bg-amber-50 text-amber-800 border-amber-200" },
    APPROVED: { label: "Approved for Replacement", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    REJECTED: { label: "Rejected", color: "bg-rose-50 text-rose-800 border-rose-200" },
    RESOLVED: { label: "Resolved & Closed", color: "bg-slate-100 text-slate-800 border-slate-300" },
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-600 text-amber-100 px-3 py-1 rounded-full border border-amber-500/30">
              Warranty & Returns Portal
            </span>
            <UrduSpeaker
              customText="وارنٹی کلیم اور سامان واپسی کی درخواستوں کا پورٹل۔ فیلڈ ریکوری افسر یا سیلز مین خرابی کی رپورٹ درج کر سکتے ہیں اور مالک اسے فوری منظور یا مسترد کر سکتا ہے۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Warranty Claims & Product Returns (Wapsi)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Log item faults, warranty inspection claims, customer disputes, and voluntary returns from the field with full audit tracking.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File Claim / Return Request</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Requests</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{claims.length}</p>
          <span className="text-[10px] text-slate-500">All recorded field reports</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">{pendingCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Awaiting Owner decision</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{approvedCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Replacement in progress</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved & Closed</span>
            <ShieldAlert className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{resolvedCount}</p>
          <span className="text-[10px] text-slate-500">Completed cases</span>
        </div>
      </div>

      {/* Filters & Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by customer name, phone, serial or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Request Types</option>
              <option value="WARRANTY_CLAIM">Warranty Claims</option>
              <option value="RETURN_WAPSI">Returns / Wapsi</option>
              <option value="PRODUCT_ISSUE">Product Faults</option>
              <option value="DISPUTE">Customer Disputes</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No warranty claims or return requests found matching your filters.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((claim) => {
              const typeCfg = typeLabels[claim.type];
              const statusCfg = statusLabels[claim.status];
              const TypeIcon = typeCfg.icon;

              return (
                <div
                  key={claim.id}
                  className="p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${typeCfg.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        <span>{typeCfg.label}</span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {claim.planNumber && (
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {claim.planNumber}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Filed: {formatDate(claim.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                      <strong className="text-slate-900 text-sm block">{claim.customerName}</strong>
                      <span className="text-slate-600 font-mono">{formatPhone(claim.customerPhone)}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Product & Serial</span>
                      <strong className="text-slate-800 block">{claim.productTitle}</strong>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {claim.imeiSerial ? `Serial: ${claim.imeiSerial}` : "No Serial Tracked"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Logged By</span>
                      <span className="text-slate-800 font-bold block">{claim.requestedByName}</span>
                      <span className="text-[11px] text-slate-500 capitalize">{claim.requesterRole.replace("_", " ")}</span>
                    </div>
                  </div>

                  {/* Issue Box */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                    <span className="text-rose-700 font-bold block text-[11px]">Reported Problem / Reason:</span>
                    <p className="text-slate-800 leading-relaxed">{claim.issueDescription}</p>
                    {claim.physicalConditionNotes && (
                      <p className="text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                        <span className="font-bold">Physical Condition:</span> {claim.physicalConditionNotes}
                      </p>
                    )}
                    {claim.resolutionNotes && (
                      <p className="text-emerald-800 font-semibold text-[11px] pt-1 border-t border-slate-100 bg-emerald-50/50 p-1.5 rounded">
                        <span className="font-bold">Manager Resolution:</span> {claim.resolutionNotes}
                      </p>
                    )}
                  </div>

                  {/* Action Bar for Owner / Super Admin */}
                  {isOwnerOrAdmin && claim.status === "PENDING_APPROVAL" && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenResolve(claim, "REJECTED")}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Request</span>
                      </button>
                      <button
                        onClick={() => handleOpenResolve(claim, "APPROVED")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Replacement</span>
                      </button>
                    </div>
                  )}

                  {isOwnerOrAdmin && claim.status === "APPROVED" && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenResolve(claim, "RESOLVED")}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Resolved & Closed</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: File New Claim / Wapsi Request */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                  New Incident Report
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  File Warranty Claim or Item Return (Wapsi)
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
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
                <label className="block text-slate-700 font-bold mb-1">
                  Select Existing Active Contract (Optional)
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 outline-none"
                >
                  <option value="">-- Choose from active installment plans --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.planNumber} • {p.customerName} ({p.productTitle})
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
                  <label className="block text-slate-700 font-bold mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0333-1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product / Appliance Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Super Asia Washing Machine"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">IMEI / Serial Number</label>
                  <input
                    type="text"
                    placeholder="SN-12345678"
                    value={imeiSerial}
                    onChange={(e) => setImeiSerial(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Detailed Issue Description & Customer Statement *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain exactly what problem occurred with the appliance or why the customer wants to return it..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Physical Condition & Inspection Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clean condition, no body dents, original box intact"
                  value={physicalConditionNotes}
                  onChange={(e) => setPhysicalConditionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none"
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
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Claim Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manager Resolve / Decision */}
      {showResolveModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                Update Status for Claim #{selectedClaim.id}
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Case</span>
                <p className="font-bold text-slate-900">{selectedClaim.customerName} • {selectedClaim.productTitle}</p>
                <p className="text-slate-600">{selectedClaim.issueDescription}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Set Status Decision *</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  <option value="APPROVED">APPROVED (Approve for Replacement / Repair)</option>
                  <option value="REJECTED">REJECTED (Decline Claim)</option>
                  <option value="RESOLVED">RESOLVED (Closed & Settled)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Manager Resolution Remarks *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the rationale or action taken (e.g. New piece dispatched from showroom stock)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl shadow"
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

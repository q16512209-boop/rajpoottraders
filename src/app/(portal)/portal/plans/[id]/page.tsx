"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatDateTime, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  DollarSign,
  Edit3,
  Trash2,
  Send,
  BadgePercent,
  ArrowLeftRight,
  ShieldCheck,
  RotateCcw,
  Calendar,
  Clock,
  UserCheck,
  MapPin,
  ExternalLink,
  Package,
  BookOpen,
  CheckSquare,
  Square,
  Save,
  Plus,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { GPSLocation, InstallmentScheduleItem, Customer, InstallmentPlan } from "@/lib/db/types";

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const { currentTenant, currentUser } = useAuth();
  const [plan, setPlan] = useState(() => store.getPlanById(params.id));
  const allPlans = store.getPlans(currentTenant.id).filter((p) => p.id !== params.id);

  // View Mode: "SCHEDULE" | "DIARY_RECONCILE"
  const [viewMode, setViewMode] = useState<"SCHEDULE" | "DIARY_RECONCILE">("SCHEDULE");

  // GPS Modal State
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | undefined>(plan?.gpsLocation);
  const [custAddressEdit, setCustAddressEdit] = useState(plan?.areaZone || "");

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInstallmentNo, setActiveInstallmentNo] = useState<number>(1);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [customPaidDate, setCustomPaidDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState<string>("");

  // Diary Reconciliation Local State
  const [diaryItems, setDiaryItems] = useState<InstallmentScheduleItem[]>(() => {
    return plan ? JSON.parse(JSON.stringify(plan.schedule)) : [];
  });

  // Khata Correction Modal State (Owner/SuperAdmin Only)
  const [corrModalOpen, setCorrModalOpen] = useState(false);
  const [corrInstNo, setCorrInstNo] = useState<number>(1);
  const [corrAmount, setCorrAmount] = useState<number>(0);
  const [corrStatus, setCorrStatus] = useState<"PAID" | "SHORT_PAID" | "PENDING" | "OVERDUE">("PAID");
  const [corrReason, setCorrReason] = useState<string>("");

  // Transfer Mistaken Payment Modal State (Owner/SuperAdmin Only)
  const [xferModalOpen, setXferModalOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string>(allPlans[0]?.id || "");
  const [xferAmount, setXferAmount] = useState<number>(0);
  const [xferReason, setXferReason] = useState<string>("");

  // Reschedule Due Date Modal (For Recovery Officers & Salesmen)
  const [reschedModalOpen, setReschedModalOpen] = useState(false);
  const [reschedInstNo, setReschedInstNo] = useState<number>(1);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [reschedReason, setReschedReason] = useState<string>("Customer requested reschedule");

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  if (!currentUser) return null;
  if (!plan) return <div className="p-8 text-center font-bold">Plan not found</div>;

  const isOwnerOrSuperAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

  // Associated Customer and Financial Totals
  const customer = store.getCustomers(currentTenant.id).find((c) => c.id === plan.customerId);
  const totalPaidAll = (plan.schedule || []).reduce((acc, curr) => acc + (curr.amountPaid || 0), 0) + (plan.downPayment || 0);
  const remainingBalance = Math.max(0, (plan.totalFinanced || 0) - totalPaidAll - (plan.discountWaived || 0));

  // Edit Khata Modal State (Owner/SuperAdmin Only)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editKhataNo, setEditKhataNo] = useState(plan.khataNumber || "");
  const [editCustomerName, setEditCustomerName] = useState(plan.customerName || "");
  const [editFatherName, setEditFatherName] = useState(customer?.fatherName || "");
  const [editPhone, setEditPhone] = useState(plan.customerPhone || "");
  const [editCnic, setEditCnic] = useState(plan.customerCnic || "");
  const [editAddress, setEditAddress] = useState(customer?.address || plan.areaZone || "");
  const [editAreaZone, setEditAreaZone] = useState(plan.areaZone || "");
  const [editProductTitle, setEditProductTitle] = useState(plan.productTitle || "");
  const [editImeiSerial, setEditImeiSerial] = useState(plan.imeiSerial || "");
  const [editCashPrice, setEditCashPrice] = useState(plan.cashPrice || 0);
  const [editDownPayment, setEditDownPayment] = useState(plan.downPayment || 0);
  const [editTotalFinanced, setEditTotalFinanced] = useState(plan.totalFinanced || 0);
  const [editMonthlyInstallment, setEditMonthlyInstallment] = useState(plan.monthlyInstallment || 0);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Khata Modal State (Owner/SuperAdmin Only)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Concession / Maafi Request Modal State (Recovery Officers & Staff)
  const [concessionModalOpen, setConcessionModalOpen] = useState(false);
  const [concessionDiscountAmount, setConcessionDiscountAmount] = useState<number>(remainingBalance);
  const [concessionReason, setConcessionReason] = useState<string>("Ghareeb bewa / Marzi e Malik");
  const [isSubmittingConcession, setIsSubmittingConcession] = useState(false);

  // Pending concession request for this plan if any
  const pendingConcession = store
    .getConcessionRequests(currentTenant.id)
    .find((r) => r.planId === plan.id && r.status === "PENDING_APPROVAL");

  const handleOpenEdit = () => {
    const cust = store.getCustomers(currentTenant.id).find((c) => c.id === plan.customerId);
    setEditKhataNo(plan.khataNumber || "");
    setEditCustomerName(plan.customerName || "");
    setEditFatherName(cust?.fatherName || "");
    setEditPhone(plan.customerPhone || "");
    setEditCnic(plan.customerCnic || "");
    setEditAddress(cust?.address || plan.areaZone || "");
    setEditAreaZone(plan.areaZone || "");
    setEditProductTitle(plan.productTitle || "");
    setEditImeiSerial(plan.imeiSerial || "");
    setEditCashPrice(plan.cashPrice || 0);
    setEditDownPayment(plan.downPayment || 0);
    setEditTotalFinanced(plan.totalFinanced || 0);
    setEditMonthlyInstallment(plan.monthlyInstallment || 0);
    setEditModalOpen(true);
    setMsg(null);
  };

  const handleSaveEditKhata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrSuperAdmin) return;
    setIsSubmittingEdit(true);
    try {
      const planUpdates: Partial<InstallmentPlan> = {
        khataNumber: editKhataNo.trim(),
        customerName: editCustomerName.trim(),
        customerPhone: editPhone.trim(),
        customerCnic: editCnic.trim(),
        productTitle: editProductTitle.trim(),
        imeiSerial: editImeiSerial.trim(),
        cashPrice: Number(editCashPrice),
        downPayment: Number(editDownPayment),
        totalFinanced: Number(editTotalFinanced),
        monthlyInstallment: Number(editMonthlyInstallment),
        areaZone: editAreaZone.trim(),
      };
      const customerUpdates: Partial<Customer> = {
        fullName: editCustomerName.trim(),
        fatherName: editFatherName.trim(),
        phone: editPhone.trim(),
        cnic: editCnic.trim(),
        address: editAddress.trim(),
        zoneArea: editAreaZone.trim(),
      };

      const res = store.editPlan({
        planId: plan.id,
        planUpdates,
        customerUpdates,
        editorUser: currentUser,
      });

      try {
        await fetch(`/api/plans/${plan.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
            "x-user-business-id": currentTenant.id,
          },
          body: JSON.stringify({
            userRole: currentUser.role,
            businessId: currentTenant.id,
            planUpdates,
            customerUpdates,
          }),
        });
      } catch (apiErr) {}

      setPlan({ ...res.plan });
      setEditModalOpen(false);
      setMsg({
        type: "success",
        text: `Khata #${res.plan.khataNumber || res.plan.planNumber} kamyabi se update ho gaya hai!`,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update khata." });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDeleteKhata = async () => {
    if (!isOwnerOrSuperAdmin) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}?role=${currentUser.role}&businessId=${currentTenant.id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": currentUser.role,
          "x-user-business-id": currentTenant.id,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete Khata");
      }

      store.deletePlan({
        planId: plan.id,
        deleterUser: currentUser,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      router.push("/portal/plans");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Delete failed" });
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleSubmitConcessionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (concessionDiscountAmount <= 0) {
      alert("Discount amount must be greater than 0");
      return;
    }
    setIsSubmittingConcession(true);
    try {
      store.requestConcession({
        planId: plan.id,
        discountAmount: Number(concessionDiscountAmount),
        reason: concessionReason,
        requestedBy: currentUser,
      });

      try {
        await fetch("/api/concessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CREATE",
            planId: plan.id,
            khataNumber: plan.khataNumber || plan.planNumber,
            customerId: plan.customerId,
            customerName: plan.customerName,
            customerPhone: plan.customerPhone,
            totalPrice: plan.totalFinanced,
            totalPaid: totalPaidAll,
            remainingBalance,
            discountAmount: Number(concessionDiscountAmount),
            reason: concessionReason,
            requestedBy: currentUser.name,
            requestedById: currentUser.id,
            officerRole: currentUser.role,
            tenantId: plan.tenantId,
            businessId: plan.businessId || plan.tenantId,
          }),
        });
      } catch (e) {}

      setConcessionModalOpen(false);
      setMsg({
        type: "success",
        text: `Rs. ${concessionDiscountAmount} معافی / رعایت کی درخواست مالک کو منظوری کے لیے بھیج دی گئی ہے۔`,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to submit concession request" });
    } finally {
      setIsSubmittingConcession(false);
    }
  };

  const handleOpenPay = (instNo: number, dueAmount: number, itemDueDate: string) => {
    setActiveInstallmentNo(instNo);
    setPaidAmount(dueAmount);
    setCustomPaidDate(itemDueDate || new Date().toISOString().split("T")[0]);
    setPayNotes("");
    setPayModalOpen(true);
    setMsg(null);
  };

  const handleOpenCorrection = (item: any) => {
    setCorrInstNo(item.installmentNo);
    setCorrAmount(item.amountPaid || 0);
    setCorrStatus(item.status);
    setCorrReason("");
    setCorrModalOpen(true);
    setMsg(null);
  };

  const handleOpenReschedule = (item: any) => {
    setReschedInstNo(item.installmentNo);
    setNewDueDate(item.dueDate);
    setReschedReason("Customer requested reschedule");
    setReschedModalOpen(true);
    setMsg(null);
  };

  const handleOpenTransfer = () => {
    const totalPaid = plan.schedule.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
    setXferAmount(Math.min(plan.monthlyInstallment, totalPaid));
    setXferReason("");
    setXferModalOpen(true);
    setMsg(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = store.recordInstallmentPayment({
        planId: plan.id,
        installmentNo: activeInstallmentNo,
        amountPaid: Number(paidAmount),
        collectedBy: currentUser.name,
        collectorRole: currentUser.role,
        notes: payNotes,
        customPaidDate,
      });
      const updated = store.getPlanById(plan.id)!;
      setPlan({ ...updated });
      setDiaryItems(JSON.parse(JSON.stringify(updated.schedule)));
      setPayModalOpen(false);
      setMsg({
        type: "success",
        text: "Payment recorded successfully for " + customPaidDate + "! " + res.allocation.summary + " (Receipt #" + res.receiptId + ")",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Payment logging failed" });
    }
  };

  const handleDiaryItemChange = (instNo: number, updates: Partial<InstallmentScheduleItem>) => {
    setDiaryItems((prev) =>
      prev.map((item) => {
        if (item.installmentNo === instNo) {
          const next = { ...item, ...updates };
          if (updates.status === "PAID" && !next.amountPaid) {
            next.amountPaid = next.totalDue;
          }
          if (updates.status === "PAID" && !next.paidDate) {
            next.paidDate = next.dueDate;
          }
          return next;
        }
        return item;
      })
    );
  };

  const handleSaveDiaryReconciliation = () => {
    try {
      const entries = diaryItems.map((item) => ({
        installmentNo: item.installmentNo,
        paidDate: item.paidDate,
        amountPaid: Number(item.amountPaid) || 0,
        status: item.status,
        notes: item.notes,
        collectedBy: item.collectedBy || currentUser.name,
      }));

      const updated = store.reconcileKhataFromDiary({
        planId: plan.id,
        entries,
        reconciledBy: currentUser,
      });

      setPlan({ ...updated });
      setDiaryItems(JSON.parse(JSON.stringify(updated.schedule)));
      setViewMode("SCHEDULE");
      setMsg({
        type: "success",
        text: "Physical Diary Reconciliation saved successfully! All installment dates and balances updated.",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to save diary reconciliation." });
    }
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrReason.trim()) {
      alert("Please enter a valid reason for khata correction.");
      return;
    }

    try {
      store.correctInstallmentPayment({
        planId: plan.id,
        installmentNo: corrInstNo,
        newAmountPaid: Number(corrAmount),
        newStatus: corrStatus,
        reason: corrReason,
        editorUser: currentUser,
      });

      const updated = store.getPlanById(plan.id)!;
      setPlan({ ...updated });
      setDiaryItems(JSON.parse(JSON.stringify(updated.schedule)));
      setCorrModalOpen(false);
      setMsg({
        type: "success",
        text: "Khata installment #" + corrInstNo + " corrected successfully! Audit log created.",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.updatePlanNextDueDate({
        planId: plan.id,
        installmentNo: reschedInstNo,
        newDueDate,
        reason: reschedReason,
        updater: currentUser,
      });

      const updated = store.getPlanById(plan.id)!;
      setPlan({ ...updated });
      setDiaryItems(JSON.parse(JSON.stringify(updated.schedule)));
      setReschedModalOpen(false);
      setMsg({
        type: "success",
        text: "Installment #" + reschedInstNo + " due date rescheduled to (" + newDueDate + "). Route sheet updated.",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlanId) {
      alert("Please select destination khata.");
      return;
    }
    if (xferAmount <= 0) {
      alert("Please enter a valid transfer amount.");
      return;
    }
    if (!xferReason.trim()) {
      alert("Please enter a transfer reason for audit trail.");
      return;
    }

    try {
      store.transferKhataPayment({
        fromPlanId: plan.id,
        toPlanId: targetPlanId,
        amount: Number(xferAmount),
        reason: xferReason,
        editorUser: currentUser,
      });

      const updated = store.getPlanById(plan.id)!;
      setPlan({ ...updated });
      setDiaryItems(JSON.parse(JSON.stringify(updated.schedule)));
      setXferModalOpen(false);
      setMsg({
        type: "success",
        text: "Payment of " + formatPKR(xferAmount) + " successfully transferred to Destination Khata! Both ledgers updated.",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleSaveGpsModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpsLocation) {
      alert("Please pin a location on the map first.");
      return;
    }
    try {
      store.updatePlanGps(plan.id, gpsLocation, custAddressEdit, currentUser.id);
      const updated = store.getPlanById(plan.id)!;
      setPlan({ ...updated });
      setGpsModalOpen(false);
      setMsg({
        type: "success",
        text: "Customer & Plan Live GPS Coordinates successfully pinned and updated!",
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update GPS" });
    }
  };

  const totalCollected = plan.schedule.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const paidCount = plan.schedule.filter((s) => s.status === "PAID").length;
  const remainingCount = Math.max(0, plan.schedule.length - paidCount);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30">
              Khata #{plan.khataNumber || plan.planNumber.slice(-4)} • Rajpoot Traders
            </span>
            <span className={"px-3 py-0.5 rounded-full text-[10px] font-bold border " + getStatusBadgeClass(plan.status)}>
              {plan.status}
            </span>
            <UrduSpeaker
              customText={"کھاتہ نمبر " + (plan.khataNumber || "") + "، خریدار " + plan.customerName + "۔ اگر ڈائری کے مطابق تاریخ یا قسط میچ کرنی ہے تو ڈائری میچنگ موڈ استعمال کریں۔"}
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Khata #{plan.khataNumber || "—"} — {plan.customerName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Salesman: <strong className="text-amber-300">{plan.salesmanName || "Zaheem"}</strong> • Phone: {plan.customerPhone} • Product: {plan.productTitle}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Owner-Exclusive Khata Edit & Delete Buttons */}
          {isOwnerOrSuperAdmin && (
            <>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all border border-amber-300"
                title="Sirf Owner aur Super Admin k liye"
              >
                <Edit3 className="w-4 h-4" />
                <span>✏️ Edit Khata / Plan</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition-all border border-rose-500"
                title="Sirf Owner aur Super Admin k liye"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ Delete Khata</span>
              </button>
            </>
          )}

          {/* Concession / Maafi Request Workflow */}
          {pendingConcession ? (
            <span className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400/90 text-slate-950 font-black text-xs rounded-xl border border-amber-300 shadow">
              <Clock className="w-4 h-4 text-slate-950" />
              <span>⏳ Concession Pending: Rs. {pendingConcession.discountAmount}</span>
            </span>
          ) : remainingBalance > 0 && plan.status !== "CLOSED_WITH_DISCOUNT" ? (
            <button
              type="button"
              onClick={() => {
                setConcessionDiscountAmount(remainingBalance);
                setConcessionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-800 hover:bg-teal-700 text-teal-100 border border-teal-500 font-bold text-xs rounded-xl shadow transition-all"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>📩 Request Concession (معافی)</span>
            </button>
          ) : plan.discountWaived && plan.discountWaived > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-emerald-100 border border-emerald-500 font-bold text-xs rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>معافی شدہ: Rs. {plan.discountWaived}</span>
            </span>
          ) : null}

          {plan.status === "ACTIVE" && (
            <>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "SCHEDULE" ? "DIARY_RECONCILE" : "SCHEDULE")}
                className={"flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl shadow transition-all " + (viewMode === "DIARY_RECONCILE" ? "bg-amber-400 text-slate-950 border-2 border-amber-300" : "bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600")}
              >
                <BookOpen className="w-4 h-4" />
                <span>{viewMode === "DIARY_RECONCILE" ? "Exit Diary Match" : "📖 Match with Diary (ڈائری میچنگ)"}</span>
              </button>

              <Link
                href={"/portal/plans/" + plan.id + "/settle"}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                <DollarSign className="w-4 h-4 text-amber-300" />
                <span>Early Settlement & Rebate</span>
              </Link>
            </>
          )}

          <Link
            href={"/portal/print/contract/" + plan.id}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors border border-slate-700"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Print Legal Agreement</span>
          </Link>
          <Link
            href={"/portal/print/receipt/" + plan.id}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Thermal Receipt</span>
          </Link>
        </div>
      </div>

      {msg && (
        <div
          className={"p-4 rounded-xl text-xs font-bold border flex items-center gap-2 " + (msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200")}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="font-urdu leading-relaxed">{msg.text}</span>
        </div>
      )}

      {/* Customer Location & GPS Bar */}
      <div className="bg-emerald-950 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center text-amber-300 font-black shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Assigned Route Zone:</span>
              <strong className="text-sm font-bold text-white">{plan.areaZone || "Chiniot Route"}</strong>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              {plan.gpsLocation?.address ? plan.gpsLocation.address : "GPS location not pinned yet. Click 'Pin / Update GPS' to drop live map pin."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {plan.gpsLocation?.mapUrl && (
            <a
              href={plan.gpsLocation.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-700 transition-colors"
            >
              <span>View Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => setGpsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>Pin Live GPS</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Installment Schedule</span>
          <strong className="text-lg font-black text-slate-900">
            {formatPKR(plan.monthlyInstallment)} {plan.installmentFrequency === "WEEKLY" ? "/ Week" : "/ Month"}
          </strong>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
            {paidCount} / {plan.schedule.length} Paid ({remainingCount} Left)
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Advance Down Payment</span>
          <strong className="text-lg font-bold text-emerald-700">{formatPKR(plan.downPayment)}</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Collected at Contract Start</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Total Collected So Far</span>
          <strong className="text-lg font-black text-emerald-800">{formatPKR(totalCollected + plan.downPayment)}</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Installments + Advance</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Total Financed Value</span>
          <strong className="text-lg font-bold text-slate-900">{formatPKR(plan.totalFinanced)}</strong>
          <span className={"text-[10px] font-bold block mt-0.5 " + (plan.accumulatedShortArrears > 0 ? "text-rose-600" : "text-slate-400")}>
            Short Arrears: {formatPKR(plan.accumulatedShortArrears)}
          </span>
        </div>
      </div>

      {/* Multi-Product Items Breakdown (If contract contains multiple items) */}
      {plan.items && plan.items.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              <span>Contract Products & Serial Registry ({plan.items.length} Items)</span>
            </h3>
            <span className="text-xs text-slate-500 font-urdu">تمام اشیاء کے سیریل نمبرز اور قیمتیں</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plan.items.map((item, idx) => (
              <div key={item.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Item #{idx + 1}
                  </span>
                  <strong className="text-xs font-mono font-bold text-slate-900">
                    {formatPKR(item.installmentPrice * item.quantity)}
                  </strong>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">{item.productTitle}</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>SN: {item.imeiSerial || "N/A"}</span>
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: PHYSICAL DIARY RECONCILIATION */}
      {viewMode === "DIARY_RECONCILE" && (
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/50 rounded-3xl border-2 border-amber-400 p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-700" />
                <h2 className="text-lg font-black text-slate-900">
                  Physical Diary Reconciliation Mode (ڈائری کھاتہ میچنگ موڈ)
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-urdu">
                اپنی فزیکل رجسٹر ڈائری سامنے رکھیں اور ہر قسط کی اصل وصولی کی تاریخ اور رقم درج کریں۔ اگر کسٹمر نے جمعہ کی بجائے ہفتہ کو دی ہو تو تاریخ یہاں تبدیل کریں۔
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("SCHEDULE")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDiaryReconciliation}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save All Diary Entries (تمام اندراج محفوظ کریں)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-amber-200 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-100/60 border-b border-amber-200 text-amber-950 font-black text-[11px]">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Scheduled Date</th>
                  <th className="py-3 px-3">Actual Paid Date (ڈائری تاریخ)</th>
                  <th className="py-3 px-3">Amount Due</th>
                  <th className="py-3 px-3">Amount Paid (وصولی)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Diary Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diaryItems.map((item) => (
                  <tr key={item.installmentNo} className={item.status === "PAID" ? "bg-emerald-50/40" : "hover:bg-slate-50"}>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      Qist #{item.installmentNo}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="date"
                        value={item.paidDate || item.dueDate}
                        onChange={(e) => handleDiaryItemChange(item.installmentNo, { paidDate: e.target.value })}
                        className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {formatPKR(item.totalDue)}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        value={item.amountPaid || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleDiaryItemChange(item.installmentNo, {
                            amountPaid: val,
                            status: val >= item.totalDue ? "PAID" : val > 0 ? "SHORT_PAID" : "PENDING",
                          });
                        }}
                        className="w-24 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-900"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleDiaryItemChange(item.installmentNo, {
                            status: e.target.value as any,
                            amountPaid: e.target.value === "PAID" ? item.totalDue : e.target.value === "PENDING" ? 0 : item.amountPaid,
                          })
                        }
                        className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        <option value="PAID">PAID (وصول)</option>
                        <option value="SHORT_PAID">SHORT (کم)</option>
                        <option value="PENDING">PENDING (باقی)</option>
                        <option value="OVERDUE">OVERDUE (تاخیر)</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="e.g. Promised Friday, paid Saturday"
                        value={item.notes || ""}
                        onChange={(e) => handleDiaryItemChange(item.installmentNo, { notes: e.target.value })}
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-urdu"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDiaryReconciliation}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Khata Ledger</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: STANDARD AMORTIZATION SCHEDULE TABLE */}
      {viewMode === "SCHEDULE" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 font-urdu flex items-center gap-2">
                <span>Installment Ledger Schedule ({plan.schedule.length} Installments)</span>
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-sans font-bold">
                  Collection Day: {plan.collectionDayName || "Saturday"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-urdu">
                Official ledger records, payment collection history, short arrears, and collector audit trail
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("DIARY_RECONCILE")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Match with Diary (ڈائری میچ کریں)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black text-[11px] font-urdu">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Scheduled Due Date</th>
                  <th className="py-3 px-3">Due Amount</th>
                  <th className="py-3 px-3 text-emerald-800">Paid (PKR)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Payment Date / Remarks</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.schedule.map((item) => (
                  <tr key={item.installmentNo} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                      {item.installmentNo}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-bold font-mono">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      {formatPKR(item.totalDue)}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-800 text-sm">
                      {item.amountPaid > 0 ? formatPKR(item.amountPaid) : "-"}
                    </td>
                    <td className="py-3 px-3">
                      <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold border " + getStatusBadgeClass(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {item.paidDate && <span className="font-mono text-emerald-700 font-bold block">Paid: {formatDate(item.paidDate)}</span>}
                      <span>{item.collectedBy ? item.collectedBy + " • " : ""}{item.notes || "-"}</span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      {item.status !== "PAID" && plan.status === "ACTIVE" && (
                        <button
                          onClick={() => handleOpenPay(item.installmentNo, item.totalDue - item.amountPaid, item.dueDate)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Record Qist (قسط وصول)
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenReschedule(item)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                        title="Reschedule Due Date (تبدیلی تاریخ)"
                      >
                        Reschedule
                      </button>

                      {isOwnerOrSuperAdmin && (
                        <button
                          onClick={() => handleOpenCorrection(item)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium border border-amber-200"
                          title="Owner Correction (درستگی کھاتہ)"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay / Record Single Qist Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                Record Payment for Qist #{activeInstallmentNo}
              </h3>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Collection Date (وصولی کی تاریخ) *</label>
                <input
                  type="date"
                  required
                  value={customPaidDate}
                  onChange={(e) => setCustomPaidDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-400 font-urdu block mt-0.5">
                  اگر قسط مقررہ تاریخ کے بعد (مثلاً ہفتہ کو) ملی ہے تو وہی تاریخ منتخب کریں۔
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Received (وصول شدہ رقم - Rs.) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-emerald-900 text-lg outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Diary Note / Remarks (اختیاری نوٹ)</label>
                <input
                  type="text"
                  placeholder="e.g. Customer promised Friday, paid on Saturday"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-urdu outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow"
                >
                  Save Payment (محفوظ کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                Reschedule Installment #{reschedInstNo}
              </h3>
              <button
                onClick={() => setReschedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Due Date *</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Reschedule *</label>
                <input
                  type="text"
                  required
                  value={reschedReason}
                  onChange={(e) => setReschedReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-urdu outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setReschedModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow"
                >
                  Update Due Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Khata Correction Modal */}
      {corrModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                Correct Installment #{corrInstNo} (Owner Access)
              </h3>
              <button
                onClick={() => setCorrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleConfirmCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Paid Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={corrAmount}
                  onChange={(e) => setCorrAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Status *</label>
                <select
                  value={corrStatus}
                  onChange={(e) => setCorrStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="PAID">PAID</option>
                  <option value="SHORT_PAID">SHORT_PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Correction *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrected mistaken collector entry"
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-urdu outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCorrModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Location Modal */}
      {gpsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>Pin Live GPS for {plan.customerName}</span>
              </h3>
              <button
                onClick={() => setGpsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveGpsModal} className="space-y-4 text-xs">
              <MapLocationPicker
                value={gpsLocation}
                onChange={(loc) => setGpsLocation(loc)}
                onAddressAutoFill={(autoAddr, zone) => {
                  if (autoAddr) setCustAddressEdit(autoAddr);
                }}
                defaultCity="Chiniot"
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Street Address</label>
                <input
                  type="text"
                  value={custAddressEdit}
                  onChange={(e) => setCustAddressEdit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setGpsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow"
                >
                  Save GPS Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Owner-Only Edit Khata Modal */}
      {editModalOpen && isOwnerOrSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  <span>Edit Khata & Plan (Owner Exclusive)</span>
                </h3>
                <p className="text-xs text-slate-500 font-urdu">
                  صرف دکان کے مالک کو کھاتہ اور خریدار کی تفصیلات تبدیل کرنے کی اجازت ہے۔
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEditKhata} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khata Number (کھاتہ #) *</label>
                  <input
                    type="text"
                    required
                    value={editKhataNo}
                    onChange={(e) => setEditKhataNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-amber-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Full Name (خریدار کا نام) *</label>
                  <input
                    type="text"
                    required
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Father Name (ولدیت) *</label>
                  <input
                    type="text"
                    required
                    value={editFatherName}
                    onChange={(e) => setEditFatherName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-urdu text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number (موبائل فون) *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNIC (شناختی کارڈ) *</label>
                  <input
                    type="text"
                    required
                    value={editCnic}
                    onChange={(e) => setEditCnic(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bazaar / Area Route *</label>
                  <input
                    type="text"
                    required
                    value={editAreaZone}
                    onChange={(e) => setEditAreaZone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Street Address / Shop Location</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none"
                />
              </div>

              <div className="border-t pt-3">
                <span className="text-[11px] uppercase font-black text-slate-400 block mb-2">
                  Product & Pricing Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={editProductTitle}
                      onChange={(e) => setEditProductTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">IMEI / Serial Number</label>
                    <input
                      type="text"
                      value={editImeiSerial}
                      onChange={(e) => setEditImeiSerial(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cash Price (Rs.)</label>
                    <input
                      type="number"
                      value={editCashPrice}
                      onChange={(e) => setEditCashPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (Rs.)</label>
                    <input
                      type="number"
                      value={editDownPayment}
                      onChange={(e) => setEditDownPayment(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Financed Price (کل رقم - Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={editTotalFinanced}
                      onChange={(e) => setEditTotalFinanced(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Installment Amount (قسط - Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={editMonthlyInstallment}
                      onChange={(e) => setEditMonthlyInstallment(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow transition-all"
                >
                  {isSubmittingEdit ? "Updating..." : "Save Khata Changes (تبدیلیاں محفوظ کریں)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Owner-Only Delete Khata Confirmation Modal */}
      {deleteModalOpen && isOwnerOrSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border-2 border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delete Khata #{plan.khataNumber || plan.planNumber}?
                </h3>
                <p className="text-xs text-slate-500 font-urdu">
                  صرف دکان کے مالک کو کھاتہ ڈیلیٹ کرنے کا اختیار ہے۔
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
              <p className="font-bold">⚠️ خبردار: یہ عمل ناقابل واپسی ہے۔</p>
              <p className="font-urdu leading-relaxed">
                اس کھاتے کا تمام ریکارڈ، اقساط کی ہسٹری اور معاہدہ مستقل طور پر ختم ہو جائے گا۔
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-rose-200 font-mono text-[11px] text-slate-800">
                <div><strong>Khata #:</strong> {plan.khataNumber || plan.planNumber}</div>
                <div><strong>Customer:</strong> {plan.customerName}</div>
                <div><strong>Product:</strong> {plan.productTitle}</div>
                <div><strong>Total Financed:</strong> {formatPKR(plan.totalFinanced)}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel (منسوخ کریں)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKhata}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow transition-all"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Khata (مستقل ڈیلیٹ کریں)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Concession / Maafi Request Modal */}
      {concessionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border-2 border-teal-500">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Request Concession / Maafi (رعایت کی درخواست)
                  </h3>
                  <p className="text-xs text-slate-500 font-urdu">
                    یہ درخواست منظوری کے لیے براہ راست مالک کو جائے گی۔
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConcessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Khata #:</span>
                <span className="font-bold text-slate-900">#{plan.khataNumber || plan.planNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{plan.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Price:</span>
                <span className="font-bold text-slate-900">{formatPKR(plan.totalFinanced)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid So Far:</span>
                <span className="font-bold text-emerald-800">{formatPKR(totalPaidAll)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-slate-700 font-bold">Remaining Balance (بقایا):</span>
                <span className="font-black text-rose-700">{formatPKR(remainingBalance)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitConcessionRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Requested Discount Amount (رعایت کی رقم - Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={remainingBalance}
                  value={concessionDiscountAmount}
                  onChange={(e) => setConcessionDiscountAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border-2 border-teal-600 rounded-xl font-mono font-black text-teal-900 text-lg outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 font-urdu">
                  زیادہ سے زیادہ بقایا رقم ({formatPKR(remainingBalance)}) معاف ہو سکتی ہے۔
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason / Waja for Concession (رعایت کی وجہ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ghareeb bewa / Marzi e Malik / Akhri qist maafi"
                  value={concessionReason}
                  onChange={(e) => setConcessionReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-urdu outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setConcessionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConcession}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{isSubmittingConcession ? "Submitting..." : "Send Request to Owner (درخواست بھیجیں)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC } from "@/lib/formatters";
import { decryptField } from "@/lib/crypto/aes";
import { Printer, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ContractPrintPage({ params }: { params: { id: string } }) {
  const plan = store.getPlanById(params.id);
  if (!plan) return <div className="p-8 text-center font-bold">Plan not found</div>;

  const tenant = store.getTenantById(plan.tenantId) || store.getTenants()[0];
  const customer = store.getCustomerById(plan.customerId);
  const guarantors = customer?.guarantors || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Top No-Print Control Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <Link
          href={`/portal/plans/${plan.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plan Schedule</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Format: Standard Legal Stamp Paper (8.5" x 14")
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Official Agreement</span>
          </button>
        </div>
      </div>

      {/* Stamp Paper Container */}
      <div className="stamp-paper-page bg-white border border-slate-300 shadow-2xl p-8 sm:p-12 mx-auto max-w-4xl font-sans text-slate-900 relative">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <span className="text-6xl font-black rotate-[-35deg] text-emerald-900 uppercase">
            RAJPOOT TRADERS
          </span>
        </div>

        {/* Top Space Reserved for Stamp Paper Head */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl h-44 flex flex-col items-center justify-center text-slate-400 text-xs font-mono text-center p-4 mb-6">
          <strong className="text-slate-600 uppercase font-bold text-sm block">
            Government of Pakistan — E-Stamp Paper Affixation Zone
          </strong>
          <span>(For Rs. 100 / Rs. 500 Non-Judicial E-Stamp Paper Header)</span>
          <span className="text-[10px] text-slate-400 mt-1">
            Contract Ref: {plan.planNumber} • Hash: {plan.tamperProofHash.slice(0, 24)}
          </span>
        </div>

        {/* Official Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6 space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {tenant.brandHeader}
          </h1>
          <p className="text-sm font-urdu font-bold text-emerald-800">
            Hire Purchase Installment Agreement (معاہدہ بیع بالتقسیط)
          </p>
          <p className="text-xs text-slate-600">
            Main Flagship: {tenant.address} • Phone: {tenant.contact}
          </p>
        </div>

        {/* Contract Meta & Parties */}
        <div className="space-y-6 text-xs leading-relaxed text-slate-800">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <strong className="block text-slate-900 text-sm">First Party (Seller / Rajpoot Traders):</strong>
              <p className="font-semibold text-emerald-900">{tenant.name}</p>
              <p>Represented by: Chaudhry Kamran Rajpoot</p>
            </div>
            <div>
              <strong className="block text-slate-900 text-sm">Second Party (Hire-Purchaser / Customer):</strong>
              <p className="font-bold text-slate-900">{plan.customerName} S/O {customer?.fatherName || "—"}</p>
              <p>CNIC: {formatCNIC(decryptField(customer?.cnic || plan.customerCnic))}</p>
              <p>Residence: {customer?.address || plan.areaZone}</p>
              <p>Mobile: {plan.customerPhone}</p>
            </div>
          </div>

          {/* Asset & Financial Terms */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
              1. Asset Description & Financial Schedule
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border">
              <div>
                <span className="text-slate-500 block">Item / Model:</span>
                <strong className="text-slate-900">{plan.productTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Tracked IMEI/Serial:</span>
                <strong className="font-mono text-slate-900">{plan.imeiSerial}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Advance Down Payment:</span>
                <strong className="text-emerald-800">{formatPKR(plan.downPayment)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Monthly Installment:</span>
                <strong className="text-emerald-800 font-black">{formatPKR(plan.monthlyInstallment)} / mo</strong>
              </div>
            </div>
          </div>

          {/* Legal Clauses */}
          <div className="space-y-2 text-justify">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
              2. Terms & Conditions
            </h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-700">
              <li>
                <strong>Ownership Reservation:</strong> The financed asset remains the legal and physical property of <strong>{tenant.name}</strong> until the entire contract value of {formatPKR(plan.totalFinanced)} is settled in full.
              </li>
              <li>
                <strong>Timely Monthly Installments:</strong> The purchaser agrees to pay {formatPKR(plan.monthlyInstallment)} on or before the 10th of every calendar month.
              </li>
              <li>
                <strong>Short Repayment & Arrears Protocol:</strong> In case of partial shortfall, the deficit is rolled into accumulated arrears. However, non-payment of two successive installments empowers the seller to repossess the asset without court notice.
              </li>
              <li>
                <strong>Prohibition of Resale or Transfer:</strong> The purchaser shall not sell, pledge, pawn, or mortgage the item until final clearance certificate (NOC) is issued.
              </li>
            </ol>
          </div>

          {/* Dual Guarantor Undertaking */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
              3. Joint & Several Guarantee Undertaking
            </h3>
            <p className="text-[11px] text-slate-600">
              We, the undersigned dual guarantors, hereby irrevocably guarantee the prompt payment of all dues by the purchaser. In event of default, we are jointly and severally liable to settle the remaining balance.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {guarantors.slice(0, 2).map((g, idx) => (
                <div key={g.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1">
                  <strong className="text-emerald-900 block">Zamin #{idx + 1} ({g.relation}):</strong>
                  <p><strong>Name:</strong> {g.fullName} S/O {g.fatherName}</p>
                  <p><strong>CNIC:</strong> {formatCNIC(decryptField(g.cnic))}</p>
                  <p><strong>Phone:</strong> {g.phone}</p>
                  <p><strong>Workplace:</strong> {g.workplace}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Signature & Thumb Impression Blocks */}
          <div className="pt-8 grid grid-cols-4 gap-4 text-center text-xs">
            <div className="space-y-6">
              <div className="h-16 border-b border-slate-400 border-dashed"></div>
              <span className="font-bold block text-slate-900">Purchaser Signature</span>
              <div className="w-16 h-20 border border-slate-300 mx-auto rounded flex items-center justify-center text-[10px] text-slate-400">
                Thumb Impression
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-16 border-b border-slate-400 border-dashed"></div>
              <span className="font-bold block text-slate-900">Guarantor 1</span>
              <div className="w-16 h-20 border border-slate-300 mx-auto rounded flex items-center justify-center text-[10px] text-slate-400">
                Thumb Impression
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-16 border-b border-slate-400 border-dashed"></div>
              <span className="font-bold block text-slate-900">Guarantor 2</span>
              <div className="w-16 h-20 border border-slate-300 mx-auto rounded flex items-center justify-center text-[10px] text-slate-400">
                Thumb Impression
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-16 border-b border-slate-400 border-dashed"></div>
              <span className="font-bold block text-slate-900">Authorized Signatory (Rajpoot Traders)</span>
              <div className="w-20 h-20 border-2 border-emerald-800 mx-auto rounded-full flex items-center justify-center text-[9px] font-bold text-emerald-800 uppercase p-1">
                Official Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
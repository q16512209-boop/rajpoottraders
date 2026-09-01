import React from 'react';
import { InstallmentCalculator } from '@/components/marketing/InstallmentCalculator';
import { HelpCircle } from 'lucide-react';

export default function CalculatorPage({
  searchParams,
}: {
  searchParams?: { price?: string; down?: string; name?: string };
}) {
  const price = searchParams?.price ? Number(searchParams.price) : 165000;
  const down = searchParams?.down ? Number(searchParams.down) : 35000;
  const name = searchParams?.name ? decodeURIComponent(searchParams.name) : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Official EMI Estimator
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Hire-Purchase & Installment Calculator
        </h1>
        <p className="text-sm text-slate-600">
          Calculate your monthly installment schedule with complete transparency. All plans backed by official Stamp Paper agreements and flexible arrears rebalancing.
        </p>
      </div>

      <InstallmentCalculator initialPrice={price} initialDownPayment={down} productName={name} />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          Installment Approval Requirements & Process
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <strong className="text-slate-900 text-sm block">1. Applicant (Kharedar) KYC</strong>
            <p>Original CNIC & copy, 2 passport photos, latest residential electricity bill, and active mobile number.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <strong className="text-slate-900 text-sm block">2. Dual Guarantors (Zamin 1 & 2)</strong>
            <p>Two verified guarantors (1 blood relative + 1 reputable business reference) with CNIC copies & utility bills.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <strong className="text-slate-900 text-sm block">3. Fast Verification & Handover</strong>
            <p>Physical counter down payment verification, legal stamp agreement signing, and dispatch with tracked IMEI/Serial.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  DollarSign,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ExpenseRecord } from "@/lib/db/types";

export default function ExpensesPage() {
  const { currentTenant, currentUser } = useAuth();
  const [expenses, setExpenses] = useState(() => store.getExpenses(currentTenant.id));
  const wallets = store.getWallets(currentTenant.id);

  const [category, setCategory] = useState<ExpenseRecord["category"]>("PETROL_TRANSPORT");
  const [amount, setAmount] = useState<number>(1500);
  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id || "");
  const [description, setDescription] = useState<string>("");
  const [receiptRef, setReceiptRef] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.recordExpense({
        tenantId: currentTenant.id,
        category,
        amount: Number(amount),
        fromWalletId: fromWalletId || wallets[0].id,
        description,
        loggedBy: currentUser.name,
        receiptRef,
      });

      setExpenses([...store.getExpenses(currentTenant.id)]);
      setMsg({
        type: "success",
        text: `Expense of ${formatPKR(amount)} logged & debited from wallet.`,
      });
      setDescription("");
      setReceiptRef("");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log expense" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Daily Operating Outflows
            </span>
            <UrduSpeaker guideKey="EXPENSE" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Showroom & Field Expenses Logger
          </h1>
          <p className="text-xs text-slate-500 font-urdu">
            Track operational store overheads, fuel, utility bills, and tea/entertainment expenses.
          </p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Log New Outflow / Expense
          </h2>

          <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="PETROL_TRANSPORT">Petrol & Recovery Motorcycle Fuel</option>
                <option value="TEA_REFRESHMENT">Showroom Tea & Refreshment</option>
                <option value="STAFF_SALARY">Staff Daily Advance / Salary</option>
                <option value="SHOP_UTILITIES">Electricity / Shop Utilities</option>
                <option value="OWNER_WITHDRAWAL">Owner Personal Drawdown</option>
                <option value="MISC">Miscellaneous Stationery & Office</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-rose-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Debit From Wallet</label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Bal: {formatPKR(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Reason</label>
              <input
                type="text"
                required
                placeholder="e.g. Fuel for Route-A recovery bike"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-colors"
            >
              Record & Debit Wallet
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Recent Expense Outflow Ledger ({expenses.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Debited Wallet</th>
                  <th className="py-2.5 px-3">Logged By</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{formatDate(exp.date)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{exp.category}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate">{exp.description}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{exp.fromWalletName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{exp.loggedBy}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">
                      -{formatPKR(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

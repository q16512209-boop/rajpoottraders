"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDateTime } from "@/lib/formatters";
import { DollarSign, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { ExpenseRecord } from "@/lib/db/types";

export default function ExpensesPage() {
  const { currentTenant, currentUser } = useAuth();
  const wallets = store.getWallets(currentTenant.id);
  const [expenses, setExpenses] = useState(() => store.getExpenses(currentTenant.id));
  const [category, setCategory] = useState<ExpenseRecord["category"]>("FUEL");
  const [amount, setAmount] = useState<number>(2000);
  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id || "");
  const [description, setDescription] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setMsg({ type: "error", text: "Please enter an expense description" });
      return;
    }
    try {
      const exp = store.recordExpense({
        tenantId: currentTenant.id,
        category,
        amount: Number(amount),
        fromWalletId: fromWalletId || wallets[0].id,
        description,
        loggedBy: currentUser.name,
      });
      setExpenses([...store.getExpenses(currentTenant.id)]);
      setDescription("");
      setMsg({ type: "success", text: `Logged expense of ${formatPKR(amount)} [${category}] and debited wallet.` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log expense" });
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Daily Cash Outflows & Logger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Showroom & Field Operational Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily bike fuel, employee tea/refreshments, utility bills, and owner drawings.
          </p>
        </div>

        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Recorded Outflow</span>
          <span className="text-xl font-black text-slate-900">{formatPKR(totalExpense)}</span>
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
            <Plus className="w-4 h-4 text-emerald-600" />
            Log New Outflow Expense
          </h2>

          <form onSubmit={handleLogExpense} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="FUEL">Bike / Vehicle Fuel Allowance</option>
                <option value="TEA_UTILITIES">Showroom Tea & Refreshments</option>
                <option value="SALARY">Staff Daily / Weekly Wages</option>
                <option value="OWNER_DRAW">Owner Drawings / Personal</option>
                <option value="VENDOR_STOCK">Stock Logistics & Packaging</option>
                <option value="MISC">Miscellaneous Repairs</option>
              </select>
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
                    {w.name} (Balance: {formatPKR(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (PKR)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-rose-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Memo</label>
              <textarea
                rows={2}
                placeholder="e.g. Fuel for Route-A recovery officer Bilal (20 Liters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-colors"
            >
              Record & Debit Wallet
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Recorded Outflow Entries ({expenses.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Debited Wallet</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(exp.date)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {exp.description}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {exp.fromWalletName}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-700">
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
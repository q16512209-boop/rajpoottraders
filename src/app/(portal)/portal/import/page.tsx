"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { parseExcelFile, downloadExcelTemplate, exportPlansToExcel, ImportedCustomerRow } from "@/lib/excel/excel-helper";
import { useAuth } from "@/lib/context/auth-context";
import { formatPKR, formatCNIC } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function ExcelImportPage() {
  const { currentTenant } = useAuth();
  const [parsedRows, setParsedRows] = useState<ImportedCustomerRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setMsg(null);

    try {
      const rows = await parseExcelFile(file);
      setParsedRows(rows);
      setMsg({
        type: "success",
        text: `Successfully parsed ${rows.length} rows from "${file.name}". Review the preview table below and click "Confirm Import".`,
      });
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setMsg({
        type: "error",
        text: "Failed to read Excel file. Please ensure it is a valid .xlsx or .csv spreadsheet.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;

    try {
      const result = store.bulkImportCustomers(parsedRows, currentTenant.id);
      setMsg({
        type: "success",
        text: `Mubarak! Successfully migrated ${result.importedCount} existing customer records and active installment plans into your live database.`,
      });
      setParsedRows([]);
      setFileName("");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to commit import" });
    }
  };

  const handleExportAll = () => {
    const plans = store.getPlans(currentTenant.id);
    exportPlansToExcel(plans);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30">
              Bulk Data Migration Engine
            </span>
            <UrduSpeaker guideKey="IMPORT_EXCEL" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Excel & CSV Customer Import / Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Bulk import existing customer ledgers, active installment plans, and guarantors via Excel (.xlsx / .csv)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample Excel Template</span>
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Live Records (.xlsx)</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-500 p-8 sm:p-12 text-center transition-colors shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
          <Upload className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Upload Existing Customers Spreadsheet (.xlsx, .xls, .csv)
          </h3>
          <p className="text-xs text-slate-500 font-urdu">
            Upload .xlsx or .csv spreadsheet containing customer records and active installment balances.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition-colors">
          <FileSpreadsheet className="w-4 h-4 text-amber-300" />
          <span>{fileName ? `Change File: ${fileName}` : "Choose Excel / CSV File"}</span>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {isProcessing && (
          <p className="text-xs text-emerald-700 font-bold animate-pulse">
            Processing and mapping columns...
          </p>
        )}
      </div>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Preview Imported Customers ({parsedRows.length} Rows Ready)
              </h2>
              <p className="text-xs text-slate-500 font-urdu">
                Review and validate records before saving to production ledger.
              </p>
            </div>

            <button
              onClick={handleCommitImport}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              <span>Confirm & Migrate {parsedRows.length} Customers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="p-2.5 border">#</th>
                  <th className="p-2.5 border">Customer Name</th>
                  <th className="p-2.5 border">Father Name</th>
                  <th className="p-2.5 border">CNIC</th>
                  <th className="p-2.5 border">Phone</th>
                  <th className="p-2.5 border">Address</th>
                  <th className="p-2.5 border">Guarantor 1 (Zamin)</th>
                  <th className="p-2.5 border">Product / Item</th>
                  <th className="p-2.5 border">Monthly Due</th>
                  <th className="p-2.5 border">Arrears</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 border font-mono font-bold">{i + 1}</td>
                    <td className="p-2.5 border font-bold text-slate-900">{r.Customer_Full_Name}</td>
                    <td className="p-2.5 border text-slate-600">{r.Father_Name}</td>
                    <td className="p-2.5 border font-mono text-slate-700">{formatCNIC(r.CNIC)}</td>
                    <td className="p-2.5 border font-mono text-slate-700">{r.Phone}</td>
                    <td className="p-2.5 border text-slate-600 truncate max-w-[160px]">{r.Address}</td>
                    <td className="p-2.5 border text-slate-700">{r.Guarantor_1_Name || "—"}</td>
                    <td className="p-2.5 border font-medium text-slate-800">{r.Product_Item || "—"}</td>
                    <td className="p-2.5 border font-black text-slate-900">{formatPKR(r.Monthly_Installment)}</td>
                    <td className="p-2.5 border font-bold text-rose-700">{formatPKR(r.Pending_Short_Arrears)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { Product, InstallmentFrequency } from "@/lib/db/types";
import { formatPKR } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

export default function PortalProductsPage() {
  const { currentTenant, currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => store.getProducts(currentTenant.id));
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<any>("ELECTRIC_IRONS");
  const [cashPrice, setCashPrice] = useState<number>(5800);
  const [installmentPrice, setInstallmentPrice] = useState<number>(6800);
  const [defaultDownPayment, setDefaultDownPayment] = useState<number>(500);
  const [defaultFrequency, setDefaultFrequency] = useState<InstallmentFrequency>("WEEKLY");
  const [defaultInstallmentAmount, setDefaultInstallmentAmount] = useState<number>(500);
  const [defaultTotalInstallments, setDefaultTotalInstallments] = useState<number>(13);
  const [stockQuantity, setStockQuantity] = useState<number>(20);
  const [warrantySpec, setWarrantySpec] = useState("1 سال وارنٹی");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const isOwnerOrManager = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER" || currentUser.role === "BRANCH_MANAGER";

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProd = store.createProduct(currentUser, {
        tenantId: currentTenant.id,
        title,
        brand: brand || "Rajpoot Standard",
        category,
        cashPrice: Number(cashPrice),
        installmentPrice: Number(installmentPrice),
        defaultDownPayment: Number(defaultDownPayment),
        defaultFrequency,
        defaultInstallmentAmount: Number(defaultInstallmentAmount),
        defaultTotalInstallments: Number(defaultTotalInstallments),
        minDownPaymentPct: Math.round((defaultDownPayment / installmentPrice) * 100) || 10,
        maxTenureMonths: defaultFrequency === "WEEKLY" ? Math.ceil(defaultTotalInstallments / 4) : defaultTotalInstallments,
        imeiSerialList: [`SN-${title.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`],
        specs: { "وارنٹی و تفصیل": warrantySpec },
        inStock: Number(stockQuantity) > 0,
        stockQuantity: Number(stockQuantity),
      });

      setProducts([...store.getProducts(currentTenant.id)]);
      setShowAddModal(false);
      setTitle("");
      setMsg({
        type: "success",
        text: `پروڈکٹ "${newProd.title}" کامیابی سے کیٹلاگ میں شامل کر دی گئی۔ سیلز مین اب پلان میں منتخب کر سکتے ہیں۔`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to create product" });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30">
              Chiniot Products & Inventory
            </span>
            <UrduSpeaker customText="اشیاء اور پروڈکٹس کیٹلاگ۔ مالک نئی پروڈکٹ نقد و قسط قیمت کے ساتھ شامل کر سکتا ہے۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            اشیاء و انوینٹری کیٹلاگ (Products Catalog)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            دکان کے مالک کی طرف سے اشیاء کی نقد قیمت، کل قسط قیمت، ایڈوانس اور ہفتہ وار یا ماہانہ قسط کا باضابطہ اندراج
          </p>
        </div>

        {isOwnerOrManager && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>نئی آئٹم / پروڈکٹ شامل کریں (Add Product)</span>
          </button>
        )}
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />}
          <span className="font-urdu text-sm">{msg.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="پروڈکٹ کا نام یا برانڈ تلاش کریں (مثلاً استری، فین، اے سی)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600 font-urdu"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((prod) => (
          <div key={prod.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-50 text-emerald-900 border border-emerald-200">
                  {prod.category}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  اسٹاک: {prod.stockQuantity || 0} عدد
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {prod.title}
              </h3>
              <p className="text-xs text-slate-500">
                برانڈ: <strong className="text-slate-800">{prod.brand}</strong>
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">نقد قیمت (Cash):</span>
                <strong className="text-slate-900 font-mono font-bold">{formatPKR(prod.cashPrice)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-900 font-bold">کل قسط قیمت (Installment):</span>
                <strong className="text-emerald-700 font-mono font-black text-sm">{formatPKR(prod.installmentPrice || prod.cashPrice * 1.2)}</strong>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px]">
                <span className="text-amber-900 font-semibold">ایڈوانس: {formatPKR(prod.defaultDownPayment || 500)}</span>
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                  {formatPKR(prod.defaultInstallmentAmount || 500)} {prod.defaultFrequency === "WEEKLY" ? "/ ہفتہ" : "/ ماہ"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/portal/plans/new"
                className="w-full text-center py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition-colors"
              >
                نیا اقساط پلان بنائیں (Sell on Installment)
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  New Inventory Item
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  نئی پروڈکٹ / سامان شامل کریں (Add Product)
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title (پروڈکٹ کا نام) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. استری National Heavy Weight یا GFC Ceiling Fan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name (برانڈ / کمپنی) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National / Haier / GFC"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category (کیٹیگری) *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    <option value="ELECTRIC_IRONS">استری (Electric Irons)</option>
                    <option value="FANS">سیلنگ و پیڈسٹل فین (Fans)</option>
                    <option value="HOME_APPLIANCES">گھریلو سامان و واشنگ مشین (Appliances)</option>
                    <option value="AIR_CONDITIONERS">انورٹر اے سی (Inverter ACs)</option>
                    <option value="MOTORBIKES">موٹر سائیکل (Motorbikes)</option>
                    <option value="SMARTPHONES">اسمارٹ فونز (Smartphones)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cash Price (نقد قیمت - Rs.) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={cashPrice}
                    onChange={(e) => setCashPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-900 mb-1">Installment Price (کل قسط قیمت - Rs.) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={installmentPrice}
                    onChange={(e) => setInstallmentPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-black text-emerald-900 text-sm outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-urdu block mt-0.5">قابل رعایت / کمی بیشی ممکن (Negotiable)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Advance (معمول کا ایڈوانس - Rs.) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={defaultDownPayment}
                    onChange={(e) => setDefaultDownPayment(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Installment Frequency (قسط کا دورانیہ) *</label>
                  <select
                    value={defaultFrequency}
                    onChange={(e) => setDefaultFrequency(e.target.value as InstallmentFrequency)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    <option value="WEEKLY">ہفتہ وار (Weekly - مثلاً 500 ہفتہ)</option>
                    <option value="TEN_DAYS">10 روزہ (Every 10 Days)</option>
                    <option value="FIFTEEN_DAYS">15 روزہ (Every 15 Days)</option>
                    <option value="MONTHLY">ماہانہ (Monthly)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Installment Amount (قسط کی رقم - Rs.) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={defaultInstallmentAmount}
                    onChange={(e) => setDefaultInstallmentAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Installments Count (کل اقساط کی تعداد) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={defaultTotalInstallments}
                    onChange={(e) => setDefaultTotalInstallments(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">In-Stock Quantity (موجود تعداد) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warranty & Specs (وارنٹی یا خصوصیات)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 سال وارنٹی"
                    value={warrantySpec}
                    onChange={(e) => setWarrantySpec(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-urdu"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  منسوخ کریں (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>محفوظ کریں (Save Product)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

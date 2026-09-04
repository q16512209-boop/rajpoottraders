"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/db/store";
import { formatPKR, formatCNIC } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { GPSLocation, InstallmentFrequency, IPlanProductItem } from "@/lib/db/types";
import {
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  Tag,
  Plus,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";

interface ProductLineItem {
  id: string;
  productId?: string;
  title: string;
  imeiSerial: string;
  cashPrice: number;
  installmentPrice: number;
  quantity: number;
}

function NewPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant, currentUser } = useAuth();

  const customers = store.getCustomers(currentTenant.id);
  const products = store.getProducts(currentTenant.id);

  const initialCustId = searchParams.get("cust") || customers[0]?.id || "";
  const initialProduct = products[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustId);
  const [khataNumber, setKhataNumber] = useState("");
  const [salesmanName, setSalesmanName] = useState(currentUser?.name || "Zaheem");

  // Multi-Product Line Items
  const [productItems, setProductItems] = useState<ProductLineItem[]>([
    {
      id: "item_1",
      productId: initialProduct?.id || "p1",
      title: initialProduct?.title || "Heavy Weight Electric Iron",
      imeiSerial: initialProduct?.imeiSerialList[0] || "SN-IST-0001",
      cashPrice: initialProduct?.cashPrice || 5800,
      installmentPrice: initialProduct?.installmentPrice || 6800,
      quantity: 1,
    },
  ]);

  // Pricing & Terms
  const [cashPrice, setCashPrice] = useState<number>(initialProduct?.cashPrice || 5800);
  const [totalFinanced, setTotalFinanced] = useState<number>(initialProduct?.installmentPrice || 6800);
  const [downPayment, setDownPayment] = useState<number>(initialProduct?.defaultDownPayment || 500);

  // Frequency & Schedule Day
  const [installmentFrequency, setInstallmentFrequency] = useState<InstallmentFrequency>(
    initialProduct?.defaultFrequency || "WEEKLY"
  );
  const [collectionDayName, setCollectionDayName] = useState("Saturday");
  const [collectionIntervalDays, setCollectionIntervalDays] = useState<number>(7);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(
    initialProduct?.defaultInstallmentAmount || 500
  );
  const [totalInstallmentsCount, setTotalInstallmentsCount] = useState<number>(
    initialProduct?.defaultTotalInstallments || 13
  );
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  const recalculateFromItems = (items: ProductLineItem[]) => {
    const sumCash = items.reduce((acc, item) => acc + item.cashPrice * item.quantity, 0);
    const sumInstallment = items.reduce((acc, item) => acc + item.installmentPrice * item.quantity, 0);
    setCashPrice(sumCash);
    setTotalFinanced(sumInstallment);

    const defDown = Math.round(sumInstallment * 0.1);
    setDownPayment(defDown);
    const balanceFinanced = Math.max(0, sumInstallment - defDown);
    const instAmount = Math.ceil(balanceFinanced / (totalInstallmentsCount || 1));
    setMonthlyInstallment(instAmount);
  };

  const handleAddProductItem = () => {
    const defaultProd = products[productItems.length % products.length] || products[0];
    const newItem: ProductLineItem = {
      id: "item_" + Date.now(),
      productId: defaultProd?.id,
      title: defaultProd?.title || "Orient 56 Inch Ceiling Fan",
      imeiSerial: "SN-" + Date.now().toString().slice(-6),
      cashPrice: defaultProd?.cashPrice || 9500,
      installmentPrice: defaultProd?.installmentPrice || 11500,
      quantity: 1,
    };
    const updated = [...productItems, newItem];
    setProductItems(updated);
    recalculateFromItems(updated);
  };

  const handleRemoveProductItem = (id: string) => {
    if (productItems.length <= 1) {
      alert("At least 1 product item is required in the contract.");
      return;
    }
    const updated = productItems.filter((i) => i.id !== id);
    setProductItems(updated);
    recalculateFromItems(updated);
  };

  const handleUpdateProductItem = (id: string, updates: Partial<ProductLineItem>) => {
    const updated = productItems.map((item) => {
      if (item.id === id) {
        const next = { ...item, ...updates };
        if (updates.productId && updates.productId !== item.productId) {
          const p = products.find((x) => x.id === updates.productId);
          if (p) {
            next.title = p.title;
            next.cashPrice = p.cashPrice;
            next.installmentPrice = p.installmentPrice || p.cashPrice * 1.2;
            next.imeiSerial = p.imeiSerialList[0] || "SN-" + Date.now().toString().slice(-6);
          }
        }
        return next;
      }
      return item;
    });
    setProductItems(updated);
    recalculateFromItems(updated);
  };

  const compositeTitle = productItems.map((p) => p.title + (p.quantity > 1 ? " (x" + p.quantity + ")" : "")).join(" + ");
  const compositeSerial = productItems.map((p) => p.imeiSerial || "SN-NA").join(", ");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);

    if (!customer) {
      alert("Please select a customer first.");
      return;
    }

    const schedule = [];
    const baseDate = new Date(startDate);
    const interval =
      collectionIntervalDays ||
      (installmentFrequency === "WEEKLY" ? 7 : installmentFrequency === "TEN_DAYS" ? 10 : 30);

    for (let i = 1; i <= totalInstallmentsCount; i++) {
      const d = new Date(baseDate);
      if (
        installmentFrequency === "WEEKLY" ||
        installmentFrequency === "TEN_DAYS" ||
        installmentFrequency === "FIFTEEN_DAYS"
      ) {
        d.setDate(d.getDate() + i * interval);
      } else {
        d.setMonth(d.getMonth() + i);
      }

      schedule.push({
        installmentNo: i,
        dueDate: d.toISOString().split("T")[0],
        principalDue: monthlyInstallment,
        lateFee: 0,
        shortArrears: 0,
        totalDue: monthlyInstallment,
        amountPaid: 0,
        status: "PENDING" as const,
      });
    }

    const formattedItems: IPlanProductItem[] = productItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.title,
      imeiSerial: item.imeiSerial,
      quantity: item.quantity,
      cashPrice: item.cashPrice,
      installmentPrice: item.installmentPrice,
      condition: "NEW",
    }));

    const plan = store.createPlan({
      tenantId: currentTenant.id,
      khataNumber: khataNumber || undefined,
      customerId: customer.id,
      customerName: customer.fullName,
      customerCnic: customer.cnic,
      customerPhone: customer.phone,
      salesmanName,
      productId: productItems[0]?.productId || "prod_" + Date.now(),
      productTitle: compositeTitle,
      imeiSerial: compositeSerial,
      items: formattedItems,
      cashPrice,
      downPayment,
      markupRatePct: Math.round(((totalFinanced - cashPrice) / (cashPrice || 1)) * 100) || 15,
      totalMarkup: Math.max(0, totalFinanced - cashPrice),
      totalFinanced,
      durationMonths: totalInstallmentsCount,
      totalInstallmentsCount,
      installmentFrequency,
      collectionIntervalDays: interval,
      collectionDayName,
      monthlyInstallment,
      accumulatedShortArrears: 0,
      status: "ACTIVE",
      startDate,
      endDate: schedule[schedule.length - 1]?.dueDate || startDate,
      schedule,
      guarantorIds: customer.guarantors.map((g) => g.id),
      areaZone: customer.zoneArea,
      contractVerified: true,
    });

    router.push("/portal/plans/" + plan.id);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30">
              New Installment Contract
            </span>
            <UrduSpeaker
              customText="نیا قسط پلان تیار کریں۔ ایک یا زائد پروڈکٹس منتخب کریں اور ہفتہ وار یا ماہانہ شیڈول سیٹ کریں۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Create Installment Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Rajpoot Traders Chiniot • Multi-Product Selection, Down Payment, Installment Amount & Route Schedule
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Section 1: Customer & Salesman */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b pb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900 font-urdu">
              1. Select Customer & Salesman
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-600 font-urdu"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone}) — {c.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khata / Account Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 6"
                value={khataNumber}
                onChange={(e) => setKhataNumber(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Salesman Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Zaheem"
                value={salesmanName}
                onChange={(e) => setSalesmanName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Multi-Product Line Items */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              <div>
                <h2 className="text-base font-black text-slate-900 font-urdu">
                  2. Select Products (Multi-Product Support)
                </h2>
                <span className="text-xs text-slate-500 font-urdu">
                  اگر گاہک ایک وقت میں 2 اشیاء خرید رہا ہے تو نیچے شامل کریں۔
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddProductItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add 2nd Product</span>
            </button>
          </div>

          <div className="space-y-3">
            {productItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    Product Item #{idx + 1}
                  </span>
                  {productItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProductItem(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Catalog Item</label>
                    <select
                      value={item.productId || ""}
                      onChange={(e) => handleUpdateProductItem(item.id, { productId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (Rs. {(p.installmentPrice || p.cashPrice * 1.2).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={item.title}
                      onChange={(e) => handleUpdateProductItem(item.id, { title: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Serial / IMEI #</label>
                    <input
                      type="text"
                      value={item.imeiSerial}
                      onChange={(e) => handleUpdateProductItem(item.id, { imeiSerial: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Installment Price (Rs.) *</label>
                    <input
                      type="number"
                      min={500}
                      value={item.installmentPrice}
                      onChange={(e) =>
                        handleUpdateProductItem(item.id, { installmentPrice: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Financing & Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900 font-urdu">
                3. Financial Schedule & Route Day
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Total Contract: {formatPKR(totalFinanced)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Financed Price (Rs.) *</label>
              <input
                type="number"
                min={500}
                value={totalFinanced}
                onChange={(e) => setTotalFinanced(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Advance Down Payment (Rs.) *</label>
              <input
                type="number"
                min={0}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Installment Frequency *</label>
              <select
                value={installmentFrequency}
                onChange={(e) => {
                  const freq = e.target.value as InstallmentFrequency;
                  setInstallmentFrequency(freq);
                  setCollectionIntervalDays(
                    freq === "WEEKLY" ? 7 : freq === "TEN_DAYS" ? 10 : freq === "FIFTEEN_DAYS" ? 15 : 30
                  );
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none font-urdu"
              >
                <option value="WEEKLY">Weekly (ہفتہ وار e.g. Rs. 500/week)</option>
                <option value="TEN_DAYS">Every 10 Days (ہر 10 دن بعد)</option>
                <option value="FIFTEEN_DAYS">Every 15 Days (ہر 15 دن بعد)</option>
                <option value="MONTHLY">Monthly (ماہانہ)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Installments Count *</label>
              <input
                type="number"
                min={1}
                value={totalInstallmentsCount}
                onChange={(e) => setTotalInstallmentsCount(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Installment Amount (Rs.) *</label>
              <input
                type="number"
                min={50}
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-emerald-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred Route Collection Day *</label>
              <select
                value={collectionDayName}
                onChange={(e) => setCollectionDayName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
              >
                <option value="Saturday">Saturday (ہفتہ)</option>
                <option value="Friday">Friday (جمعہ)</option>
                <option value="Sunday">Sunday (اتوار)</option>
                <option value="Monday">Monday (سوموار)</option>
                <option value="Tuesday">Tuesday (منگل)</option>
                <option value="Wednesday">Wednesday (بدھ)</option>
                <option value="Thursday">Thursday (جمعرات)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-base font-black">Generate & Activate Installment Ledger</h3>
            <p className="text-xs text-slate-300 font-urdu">
              کل قیمت: {formatPKR(totalFinanced)} • پیشگی وصولی: {formatPKR(downPayment)} • قسط: {formatPKR(monthlyInstallment)} ({installmentFrequency})
            </p>
          </div>

          <button
            type="submit"
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Create Plan & Print Form</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading plan form...</div>}>
      <NewPlanForm />
    </Suspense>
  );
}

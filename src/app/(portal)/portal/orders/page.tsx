"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate } from "@/lib/formatters";
import { IFieldOrder, Product, User, WalletAccount } from "@/lib/db/types";
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  Banknote,
  FileSpreadsheet,
  AlertCircle,
  Search,
  ChevronRight,
  Package,
  Phone,
  MapPin,
  XCircle,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FieldOrdersPage() {
  const router = useRouter();
  const { currentUser, currentTenant } = useAuth();
  const [orders, setOrders] = useState<IFieldOrder[]>(() => store.getFieldOrders(currentTenant.id));
  const [products] = useState<Product[]>(() => store.getProducts(currentTenant.id));
  const [staffUsers] = useState<User[]>(() => store.getUsers(currentTenant.id));
  const [wallets] = useState<WalletAccount[]>(() => store.getWallets(currentTenant.id));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Book Order Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [selectedProdId, setSelectedProdId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentPreference, setPaymentPreference] = useState<"CASH" | "INSTALLMENT">("INSTALLMENT");
  const [downPaymentOffer, setDownPaymentOffer] = useState(1500);
  const [orderNotes, setOrderNotes] = useState("");

  // Dispatch Modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IFieldOrder | null>(null);
  const [dispatchOfficerId, setDispatchOfficerId] = useState("");

  // Cash Fulfillment Modal
  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "");

  if (!currentUser) return null;

  const isOwnerOrManager = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER" || currentUser.role === "BRANCH_MANAGER";
  const officers = staffUsers.filter((u) => u.role === "FIELD_RECOVERY" || u.role === "BRANCH_MANAGER");

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.productTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBookOrder = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = products.find((p) => p.id === selectedProdId);
      if (!prod) throw new Error("Please select a valid product from catalog.");

      const newOrder = store.createFieldOrder(currentUser, {
        tenantId: currentTenant.id,
        customerName: custName.trim(),
        customerPhone: custPhone.trim(),
        customerAddress: custAddress.trim(),
        productId: prod.id,
        productTitle: prod.title,
        quantity,
        bookedBy: currentUser.id,
        bookedByName: currentUser.name,
        bookedByRole: currentUser.role,
        paymentPreference,
        downPaymentOffer: paymentPreference === "INSTALLMENT" ? downPaymentOffer : undefined,
        proposedInstallmentFrequency: "WEEKLY",
        notes: orderNotes.trim(),
      });

      setOrders([...store.getFieldOrders(currentTenant.id)]);
      setShowBookModal(false);
      setCustName("");
      setCustPhone("");
      setCustAddress("");
      setOrderNotes("");
      setMsg({ type: "success", text: `Order #${newOrder.orderNumber} booked successfully! Owner notified for dispatch.` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to book order" });
    }
  };

  const handleOpenDispatch = (order: IFieldOrder) => {
    setSelectedOrder(order);
    setDispatchOfficerId(order.bookedBy);
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const officer = staffUsers.find((u) => u.id === dispatchOfficerId);
      store.updateFieldOrderStatus(currentUser, selectedOrder.id, "OUT_FOR_DELIVERY", {
        dispatchedWithOfficerId: officer?.id,
        dispatchedWithOfficerName: officer ? `${officer.name} (${officer.role})` : undefined,
        notes: `Dispatched from Showroom with ${officer?.name || "Delivery Staff"}`,
      });

      setOrders([...store.getFieldOrders(currentTenant.id)]);
      setShowDispatchModal(false);
      setMsg({ type: "success", text: `Order #${selectedOrder.orderNumber} dispatched with ${officer?.name || "officer"}!` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to dispatch order" });
    }
  };

  const handleOpenCashFulfill = (order: IFieldOrder) => {
    setSelectedOrder(order);
    setShowCashModal(true);
  };

  const handleConfirmCashFulfill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = store.fulfillFieldOrderAsCashSale(currentUser, selectedOrder.id, selectedWalletId);
      setOrders([...store.getFieldOrders(currentTenant.id)]);
      setShowCashModal(false);
      setMsg({ type: "success", text: `Order #${selectedOrder.orderNumber} fulfilled as CASH SALE! Receipt #${res.receiptId} issued.` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to fulfill cash order" });
    }
  };

  const handleConvertToInstallment = (order: IFieldOrder) => {
    // Navigate to legacy or new plan creator with pre-filled parameters in query string
    const query = new URLSearchParams({
      name: order.customerName,
      phone: order.customerPhone,
      address: order.customerAddress,
      productId: order.productId,
      downPayment: String(order.downPaymentOffer || 1000),
      orderId: order.id,
    });
    router.push(`/portal/customers/legacy-entry?${query.toString()}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
              Field Booking & Fulfillment
            </span>
            <UrduSpeaker customText="فیلڈ ریکوری مین یا سیلز مین راستے میں کسی بھی گاہک کا نیا آرڈر بک کر سکتا ہے جسے دکان کا مالک ڈسپیچ کرے گا اور ڈیلیوری پر نقد یا قسط میں تبدیل ہو جائے گا۔" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-purple-600" />
            Field Order Bookings & Showroom Dispatch
          </h1>
          <p className="text-xs text-slate-500">
            Book orders on the route, dispatch goods with field staff, and convert into instant cash sales or active installment khatas.
          </p>
        </div>

        <button
          onClick={() => {
            setShowBookModal(true);
            setMsg(null);
          }}
          className="px-5 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Field Order</span>
        </button>
      </div>

      {/* Alert Messages */}
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

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked</span>
            <strong className="text-2xl font-black text-slate-900">{orders.length}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Dispatch</span>
            <strong className="text-2xl font-black text-amber-700">
              {orders.filter((o) => o.status === "BOOKED_PENDING").length}
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Out for Delivery</span>
            <strong className="text-2xl font-black text-blue-700">
              {orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length}
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
            <strong className="text-2xl font-black text-emerald-700">
              {orders.filter((o) => o.status === "DELIVERED_COMPLETED").length}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search order #, customer name, phone, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {["ALL", "BOOKED_PENDING", "OUT_FOR_DELIVERY", "DELIVERED_COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st ? "bg-purple-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {ord.orderNumber}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">{ord.customerName}</h3>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    ord.status === "DELIVERED_COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : ord.status === "OUT_FOR_DELIVERY"
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {ord.status.replace("_", " ")}
                </span>
              </div>

              {/* Product & Payment Preference */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Product Item:</span>
                  <strong className="text-slate-900 font-black">{ord.productTitle} x {ord.quantity}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Payment Type:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded text-[10px] ${
                      ord.paymentPreference === "CASH"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {ord.paymentPreference} {ord.downPaymentOffer ? `(Advance: ${formatPKR(ord.downPaymentOffer)})` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-medium">Booked By:</span>
                  <span className="font-bold">{ord.bookedByName}</span>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono font-bold text-slate-900">{ord.customerPhone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-600 line-clamp-2">{ord.customerAddress}</span>
                </div>
              </div>

              {ord.notes && <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl">&ldquo;{ord.notes}&rdquo;</p>}
            </div>

            {/* Actions for Owner / Officer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
              {ord.status === "BOOKED_PENDING" && isOwnerOrManager && (
                <button
                  onClick={() => handleOpenDispatch(ord)}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Item</span>
                </button>
              )}

              {ord.status === "OUT_FOR_DELIVERY" && (
                <>
                  {ord.paymentPreference === "CASH" ? (
                    <button
                      onClick={() => handleOpenCashFulfill(ord)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Deliver as Cash Sale</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConvertToInstallment(ord)}
                      className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Deliver & Open Khata</span>
                    </button>
                  )}
                </>
              )}

              {ord.status === "DELIVERED_COMPLETED" && (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Delivered & Closed</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
            <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No field orders found.</p>
            <p className="text-xs text-slate-400">Recovery officers and salesmen can book orders while visiting clients on route.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Book New Field Order */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                  Route Order Booking
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Book Customer Field Order</h3>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleBookOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rashid Mahmood"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0301-1234567"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Delivery Address & Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohallah Rehman Abad, Street #3, Chiniot"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Product *</label>
                  <select
                    required
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (Cash: {formatPKR(p.cashPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Preference *</label>
                  <select
                    value={paymentPreference}
                    onChange={(e) => setPaymentPreference(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="INSTALLMENT">Easy Installments (اقساط کھاتہ)</option>
                    <option value="CASH">Full Cash on Delivery (نقد ادائیگی)</option>
                  </select>
                </div>

                {paymentPreference === "INSTALLMENT" && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Offered Down Payment (Rs.)</label>
                    <input
                      type="number"
                      value={downPaymentOffer}
                      onChange={(e) => setDownPaymentOffer(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Order Notes / Delivery Time</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer requested delivery on Saturday afternoon..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Order Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Showroom Dispatch Modal */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                  Showroom Dispatch
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Dispatch Order #{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
                <span className="text-purple-900 font-black block">Customer: {selectedOrder.customerName} ({selectedOrder.customerPhone})</span>
                <span className="text-slate-600 text-xs block">Item: {selectedOrder.productTitle} x {selectedOrder.quantity}</span>
                <span className="text-slate-500 text-[11px] block">Destination: {selectedOrder.customerAddress}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Delivery / Recovery Officer *</label>
                <select
                  required
                  value={dispatchOfficerId}
                  onChange={(e) => setDispatchOfficerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch for Delivery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Cash Fulfillment Modal */}
      {showCashModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Full Cash Delivery
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Record Cash Sale & Receipt</h3>
              </div>
              <button onClick={() => setShowCashModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCashFulfill} className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-emerald-950 font-black block">Customer: {selectedOrder.customerName}</span>
                <span className="text-emerald-900 text-xs block">Item: {selectedOrder.productTitle}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Cash Wallet *</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Balance: {formatPKR(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Cash Sale</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

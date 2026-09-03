"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { User, UserRole } from "@/lib/db/types";
import { formatPhone, formatDate } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  UserPlus,
  Users,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  Bike,
  Sparkles,
  Eye,
  EyeOff,
  Edit3,
  Lock,
  UserCheck,
} from "lucide-react";

export default function UsersManagementPage() {
  const { currentUser, currentTenant, availableTenants, refreshUsers } = useAuth();
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Global Password Visibility Toggle for List
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Add Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FIELD_RECOVERY");
  const [phone, setPhone] = useState("");
  const [tenantId, setTenantId] = useState(currentTenant.id);
  const [routeZone, setRouteZone] = useState("محلہ رحمن آباد و مسلم بازار چنیوٹ");

  // Edit Form State
  const [editUserId, setEditUserId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("FIELD_RECOVERY");
  const [editPhone, setEditPhone] = useState("");
  const [editRouteZone, setEditRouteZone] = useState("محلہ رحمن آباد و مسلم بازار چنیوٹ");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [showEditPass, setShowEditPass] = useState(false);

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const isOwner = currentUser.role === "OWNER";

  if (!isSuperAdmin && !isOwner) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">رسائی کی اجازت نہیں ہے (Access Restricted)</h2>
        <p className="text-xs text-slate-500 font-urdu">صرف سپر ایڈمن یا دکان کے مالکان کو اسٹاف بنانے اور پاس ورڈ دیکھنے کی اجازت ہے۔</p>
      </div>
    );
  }

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleOpenEdit = (user: User) => {
    if (isOwner && user.role === "SUPER_ADMIN") {
      alert("دکان کا مالک سپر ایڈمن کے پاس ورڈ میں ترمیم نہیں کر سکتا۔");
      return;
    }
    setEditUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword(user.password || "");
    setEditRole(user.role);
    setEditPhone(user.phone || "");
    setEditRouteZone(user.assignedRouteZone || "محلہ رحمن آباد و مسلم بازار چنیوٹ");
    setEditStatus(user.status);
    setShowEditPass(false);
    setShowEditModal(true);
    setMsg(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.createUser(currentUser, {
        tenantId,
        name,
        email,
        password,
        role: isSuperAdmin ? "OWNER" : role,
        phone,
        assignedRouteZone: role === "FIELD_RECOVERY" ? routeZone : undefined,
        status: "ACTIVE",
      });

      setUsers([...store.getUsers()]);
      refreshUsers();
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setMsg({
        type: "success",
        text: `نیا اسٹاف ممبر "${name}" بطور (${role}) کامیابی کے ساتھ شامل کر دیا گیا ہے۔ پاس ورڈ: ${password}`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to create user" });
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.updateUser(editUserId, {
        name: editName,
        email: editEmail,
        password: editPassword,
        phone: editPhone,
        role: editRole,
        assignedRouteZone: editRole === "FIELD_RECOVERY" ? editRouteZone : undefined,
        status: editStatus,
      }, currentUser);

      setUsers([...store.getUsers()]);
      refreshUsers();
      setShowEditModal(false);
      setMsg({
        type: "success",
        text: `اسٹاف ممبر "${editName}" کا پاس ورڈ اور کوائف کامیابی سے اپڈیٹ ہو گئے! نیا پاس ورڈ: ${editPassword}`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update user" });
    }
  };

  const handleDeleteUser = (id: string, userName: string) => {
    if (confirm(`کیا آپ واقعی اسٹاف ممبر "${userName}" کو سسٹم سے ہٹانا چاہتے ہیں؟`)) {
      try {
        store.deleteUser(id);
        setUsers([...store.getUsers()]);
        refreshUsers();
        setMsg({ type: "success", text: `اسٹاف ممبر "${userName}" کو سسٹم سے ہٹا دیا گیا ہے۔` });
      } catch (err: any) {
        setMsg({ type: "error", text: err.message });
      }
    }
  };

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-300",
    OWNER: "bg-amber-100 text-amber-800 border-amber-300",
    BRANCH_MANAGER: "bg-blue-100 text-blue-800 border-blue-300",
    FIELD_RECOVERY: "bg-emerald-100 text-emerald-800 border-emerald-300",
    CUSTOMER: "bg-slate-100 text-slate-700 border-slate-300",
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-purple-700 text-purple-100 px-3 py-1 rounded-full border border-purple-500/30">
              Staff & Password Access Control
            </span>
            <UrduSpeaker customText="اسٹاف مینجمنٹ، پاس ورڈ دیکھنے اور ایڈٹ کرنے کا پورٹل۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            اسٹاف و پاس ورڈ مینجمنٹ (Staff & Credentials)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            دکان کا مالک اور سپر ایڈمن تمام ملازمین (سیلز مین، ریکوری مین) کے پاس ورڈز دیکھ سکتے ہیں، بدل سکتے ہیں اور نیا اسٹاف بنا سکتے ہیں۔
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>نیا اسٹاف شامل کریں (Add Staff)</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />}
          <span className="font-urdu text-sm">{msg.text}</span>
        </div>
      )}

      {/* Quick Credentials Info Box for Chiniot Branch */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 text-xs text-emerald-950 space-y-2">
        <div className="flex items-center gap-2 font-black text-sm">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <span>راجپوت ٹریڈرز چنیوٹ — ایکٹو اسٹاف لاگ ان اسناد (Login Details)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-0.5">
            <span className="font-bold text-purple-900 block">سپر ایڈمن (Main Boss):</span>
            <p className="font-mono text-slate-700">musama4288921@gmail.com</p>
            <p className="font-mono font-black text-emerald-700">Pass: 33admin401</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-0.5">
            <span className="font-bold text-blue-900 block">سیلز مین (ضہیم):</span>
            <p className="font-mono text-slate-700">salesman@rajpoottraders.com</p>
            <p className="font-mono font-black text-emerald-700">Pass: sales123</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-0.5">
            <span className="font-bold text-emerald-900 block">فیلڈ ریکوری مین (بلال):</span>
            <p className="font-mono text-slate-700">recovery@rajpoottraders.com</p>
            <p className="font-mono font-black text-emerald-700">Pass: recovery123</p>
          </div>
        </div>
      </div>

      {/* Users Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              Active System Users ({users.length})
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              ہر ملازم کے سامنے آنکھ 👁️ کے نشان سے پاس ورڈ دیکھیں یا پینسل ✏️ کے بٹن سے تبدیل کریں
            </p>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden space-y-3">
          {users.map((u) => {
            const isPassVisible = !!visiblePasswords[u.id];
            return (
              <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[u.role]}`}>
                    {u.role}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="ایڈٹ و پاس ورڈ ری سیٹ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {u.id !== "usr_super_admin" && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="اسٹاف ہٹائیں"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <strong className="text-sm text-slate-900 block font-urdu">{u.name}</strong>

                <div className="text-slate-600 space-y-1">
                  <p className="font-mono">Email: {u.email}</p>
                  <p className="font-mono">Phone: {formatPhone(u.phone)}</p>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold">Password:</span>
                    <span className="font-mono font-black text-slate-900">
                      {isPassVisible ? u.password : "••••••••"}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(u.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 ml-auto"
                    >
                      {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {u.assignedRouteZone && <p className="text-emerald-700 font-bold font-urdu">روٹ: {u.assignedRouteZone}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Password (پاس ورڈ)</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Branch / Route</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isPassVisible = !!visiblePasswords[u.id];
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block font-urdu text-sm">{u.name}</strong>
                      <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="font-mono font-bold text-slate-800">
                          {isPassVisible ? u.password : "••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title={isPassVisible ? "پاس ورڈ چھپائیں" : "پاس ورڈ دیکھیں"}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatPhone(u.phone)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-urdu">
                      {u.assignedRouteZone ? (
                        <span className="text-emerald-700 font-bold">{u.assignedRouteZone}</span>
                      ) : (
                        "چنیوٹ مین شوروم"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                          title="پاس ورڈ اور کوائف تبدیل کریں (Edit Staff & Reset Password)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {u.id !== "usr_super_admin" ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Primary Boss
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Staff & Reset Password */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300">
                  Staff Credentials Editor
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 font-urdu">
                  اسٹاف ممبر میں ترمیم و پاس ورڈ ری سیٹ
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-urdu">Staff Name (ملازم کا نام) *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none font-urdu"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email / Login ID *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              {/* Password Box with Show Toggle */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                <label className="block text-amber-950 font-black font-urdu">
                  نیا پاس ورڈ سیٹ کریں (Reset Password) *
                </label>
                <div className="relative">
                  <input
                    type={showEditPass ? "text" : "password"}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="e.g. recovery123"
                    className="w-full p-2.5 pr-10 bg-white border border-amber-300 rounded-xl font-mono font-black text-slate-900 text-sm outline-none focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-amber-800 font-urdu block">
                  مالک ملازم کا پاس ورڈ یہاں تبدیل کر سکتا ہے اور ملازم اسی پاس ورڈ سے لاگ ان کرے گا۔
                </span>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">عہدہ / رول (Role Tier) *</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    {isSuperAdmin && <option value="OWNER">دکان کا مالک (Shop Owner / Franchise)</option>}
                    <option value="BRANCH_MANAGER">سیلز مین و کاؤنٹر مینیجر (Salesman / Manager)</option>
                    <option value="FIELD_RECOVERY">موٹر سائیکل ریکوری افسر (Field Recovery Officer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">اکاؤنٹ اسٹیٹس (Status) *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (فعال)</option>
                    <option value="INACTIVE">INACTIVE (غیر فعال / معطل)</option>
                  </select>
                </div>
              </div>

              {editRole === "FIELD_RECOVERY" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">مخصوص ریکوری روٹ زون (Chiniot Route Zone)</label>
                  <select
                    value={editRouteZone}
                    onChange={(e) => setEditRouteZone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
                  >
                    <option value="محلہ رحمن آباد و مسلم بازار چنیوٹ">محلہ رحمن آباد و مسلم بازار چنیوٹ</option>
                    <option value="چناب کالونی و لاہور روڈ چنیوٹ">چناب کالونی و لاہور روڈ چنیوٹ</option>
                    <option value="جھنگ روڈ و کچہری چنیوٹ">جھنگ روڈ و کچہری چنیوٹ</option>
                    <option value="ریلوے روڈ و محلہ عالی چنیوٹ">ریلوے روڈ و محلہ عالی چنیوٹ</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>محفوظ کریں اور پاس ورڈ اپڈیٹ کریں (Save Credentials)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Staff */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                  New Staff Onboarding
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 font-urdu">
                  نیا ملازم / افسر رجسٹر کریں (Register Staff)
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-urdu">Staff Full Name (ملازم کا مکمل نام) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ضہیم سیلز مین یا بلال ریکوری افسر"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none font-urdu"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email / Login ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@rajpoottraders.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Password (پاس ورڈ) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pass123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">عہدہ / رول (Role Tier) *</label>
                  {isSuperAdmin ? (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="OWNER">دکان کا مالک (Shop Owner / Franchise Partner)</option>
                    </select>
                  ) : (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="BRANCH_MANAGER">سیلز مین و کاؤنٹر مینیجر (Salesman / Manager)</option>
                      <option value="FIELD_RECOVERY">موٹر سائیکل ریکوری افسر (Field Recovery Officer)</option>
                    </select>
                  )}
                </div>
              </div>

              {role === "FIELD_RECOVERY" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">مخصوص ریکوری روٹ زون (Chiniot Route Zone)</label>
                  <select
                    value={routeZone}
                    onChange={(e) => setRouteZone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-950 outline-none font-urdu"
                  >
                    <option value="محلہ رحمن آباد و مسلم بازار چنیوٹ">محلہ رحمن آباد و مسلم بازار چنیوٹ</option>
                    <option value="چناب کالونی و لاہور روڈ چنیوٹ">چناب کالونی و لاہور روڈ چنیوٹ</option>
                    <option value="جھنگ روڈ و کچہری چنیوٹ">جھنگ روڈ و کچہری چنیوٹ</option>
                    <option value="ریلوے روڈ و محلہ عالی چنیوٹ">ریلوے روڈ و محلہ عالی چنیوٹ</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اسٹاف شامل کریں (Save Staff)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
} from "lucide-react";

export default function UsersManagementPage() {
  const { currentUser, currentTenant, availableTenants, refreshUsers } = useAuth();
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FIELD_RECOVERY");
  const [phone, setPhone] = useState("");
  const [tenantId, setTenantId] = useState(currentTenant.id);
  const [routeZone, setRouteZone] = useState("Route-A (Gulberg / Model Town)");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const isOwner = currentUser.role === "OWNER";

  if (!isSuperAdmin && !isOwner) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">رسائی کی اجازت نہیں ہے (Access Restricted)</h2>
        <p className="text-xs text-slate-500 font-urdu">صرف سپر ایڈمن یا دکان کے مالکان کو اسٹاف بنانے کی اجازت ہے۔</p>
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.createUser(currentUser, {
        tenantId,
        name,
        email,
        password,
        role,
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
        text: `نیا اسٹاف ممبر "${name}" بطور (${role}) کامیابی کے ساتھ شامل کر دیا گیا ہے۔`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to create user" });
    }
  };

  const handleDeleteUser = (id: string, userName: string) => {
    if (confirm(`Are you sure you want to remove user "${userName}"?`)) {
      try {
        store.deleteUser(id);
        setUsers([...store.getUsers()]);
        refreshUsers();
        setMsg({ type: "success", text: `User "${userName}" has been removed.` });
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
              Staff & Role Access Control
            </span>
            <UrduSpeaker customText="اسٹاف ممبرز اور رولز کی مینجمنٹ۔ نیا اسٹاف شامل کریں یا ان کی ذمہ داریاں تبدیل کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Staff & Role Permissions Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            راجپوت ٹریڈرز کے تمام ملازمین، فیلڈ آفیسرز، مینیجرز اور مالکان کے رولز یہاں سے کنٹرول کریں
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
          <span>{msg.text}</span>
        </div>
      )}

      {/* Users Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              Active System Users ({users.length})
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              سسٹم میں رجسٹرڈ تمام مجاز افسران اور ملازمین کی تفصیلات
            </p>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden space-y-3">
          {users.map((u) => (
            <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[u.role]}`}>
                  {u.role}
                </span>
                {u.id !== "usr_super_admin" && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <strong className="text-sm text-slate-900 block">{u.name}</strong>
              <div className="text-slate-600 space-y-0.5">
                <p>Email: {u.email}</p>
                <p>Phone: {formatPhone(u.phone)}</p>
                {u.assignedRouteZone && <p className="text-emerald-700 font-semibold">Route: {u.assignedRouteZone}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Branch / Route</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block">{u.name}</strong>
                    <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatPhone(u.phone)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {u.assignedRouteZone ? (
                      <span className="text-emerald-700 font-bold">{u.assignedRouteZone}</span>
                    ) : (
                      "Main Showroom"
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.id !== "usr_super_admin" ? (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Primary Boss
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  نیا اسٹاف ممبر شامل کریں (Create Staff User)
                </h3>
                <p className="text-xs text-slate-500 font-urdu">ملازم کی تفصیلات اور رول منتخب کریں</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name (پورا نام) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mehmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@rajpoottraders.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pass1234"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Permission *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-900"
                  >
                    {isSuperAdmin && <option value="SUPER_ADMIN">Tier 0: Super Admin (Main Boss)</option>}
                    {isSuperAdmin && <option value="OWNER">Tier 1: Shop Owner (Treasury & Pocket)</option>}
                    <option value="BRANCH_MANAGER">Tier 2: Branch Manager (Counter & KYC)</option>
                    <option value="FIELD_RECOVERY">Tier 3: Field Recovery Officer (Routes)</option>
                    <option value="CUSTOMER">Tier 4: Customer / Kharedar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {role === "FIELD_RECOVERY" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Route Area (مقرر کردہ فیلڈ علاقہ)</label>
                  <select
                    value={routeZone}
                    onChange={(e) => setRouteZone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Route-A (Gulberg / Model Town)">Route-A (Gulberg / Model Town)</option>
                    <option value="Route-B (Johar Town / Iqbal Town)">Route-B (Johar Town / Iqbal Town)</option>
                    <option value="Route-C (Cantt / DHA Phase 1-6)">Route-C (Cantt / DHA Phase 1-6)</option>
                    <option value="Route-D (Shahdara / Old City)">Route-D (Shahdara / Old City)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
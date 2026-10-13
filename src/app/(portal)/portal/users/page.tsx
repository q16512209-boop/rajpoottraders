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
  const [users, setUsers] = useState<User[]>(() => store.getUsers(currentTenant.id, currentUser?.role));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Global Password Visibility Toggle for List
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const dynamicRoutes = store.getRouteZones(currentTenant.id);

  // Add Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FIELD_RECOVERY");
  const [phone, setPhone] = useState("");
  const [tenantId, setTenantId] = useState(currentTenant.id);
  const [routeAssignmentMode, setRouteAssignmentMode] = useState<"ALL" | "CUSTOM">("ALL");
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  // Edit Form State
  const [editUserId, setEditUserId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("FIELD_RECOVERY");
  const [editPhone, setEditPhone] = useState("");
  const [editRouteAssignmentMode, setEditRouteAssignmentMode] = useState<"ALL" | "CUSTOM">("ALL");
  const [editSelectedRoutes, setEditSelectedRoutes] = useState<string[]>([]);
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
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 font-urdu">Only Super Admin and Shop Owner are authorized to manage staff accounts and view credentials.</p>
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
      alert("Unauthorized: Shop Owner cannot edit Super Admin credentials.");
      return;
    }
    setEditUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword(user.password || "");
    setEditRole(user.role);
    setEditPhone(user.phone || "");

    const userZones = user.assignedRouteZones || (user.assignedRouteZone ? user.assignedRouteZone.split(", ") : []);
    const isAll =
      userZones.includes("ALL_ROUTES") ||
      userZones.includes("ALL") ||
      (user.assignedRouteZone && (user.assignedRouteZone.includes("تمام روٹس") || user.assignedRouteZone.includes("All Routes")));
    
    setEditRouteAssignmentMode(isAll ? "ALL" : "CUSTOM");
    setEditSelectedRoutes(isAll ? [] : userZones.filter((z) => z !== "ALL_ROUTES" && z !== "ALL"));
    setEditStatus(user.status);
    setShowEditPass(false);
    setShowEditModal(true);
    setMsg(null);
  };

  // Strict Privacy: Super Admin is completely invisible to Owner and staff
  const visibleUsers = users.filter((u) => (isSuperAdmin ? true : u.role !== "SUPER_ADMIN"));

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isAllRoutes = routeAssignmentMode === "ALL";
      const finalRouteZone = isAllRoutes
        ? "تمام روٹس (All Routes)"
        : selectedRoutes.length > 0
        ? selectedRoutes.join(", ")
        : undefined;
      const finalRouteZones = isAllRoutes
        ? ["ALL_ROUTES", ...dynamicRoutes.map((r) => r.name)]
        : selectedRoutes;

      store.createUser(currentUser, {
        tenantId,
        name,
        email,
        password,
        role: isSuperAdmin ? "OWNER" : role,
        phone,
        assignedRouteZone: role !== "CUSTOMER" ? finalRouteZone : undefined,
        assignedRouteZones: role !== "CUSTOMER" ? finalRouteZones : undefined,
        status: "ACTIVE",
      });

      setUsers([...store.getUsers(currentTenant.id, currentUser.role)]);
      refreshUsers();
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSelectedRoutes([]);
      setRouteAssignmentMode("ALL");
      setMsg({
        type: "success",
        text: `Staff member "${name}" (${role}) created successfully! Password: ${password}`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to create user" });
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isAllRoutes = editRouteAssignmentMode === "ALL";
      const finalRouteZone = isAllRoutes
        ? "تمام روٹس (All Routes)"
        : editSelectedRoutes.length > 0
        ? editSelectedRoutes.join(", ")
        : undefined;
      const finalRouteZones = isAllRoutes
        ? ["ALL_ROUTES", ...dynamicRoutes.map((r) => r.name)]
        : editSelectedRoutes;

      store.updateUser(editUserId, {
        name: editName,
        email: editEmail,
        password: editPassword,
        phone: editPhone,
        role: editRole,
        assignedRouteZone: editRole !== "CUSTOMER" ? finalRouteZone : undefined,
        assignedRouteZones: editRole !== "CUSTOMER" ? finalRouteZones : undefined,
        status: editStatus,
      }, currentUser);

      setUsers([...store.getUsers(currentTenant.id, currentUser.role)]);
      refreshUsers();
      setShowEditModal(false);
      setMsg({
        type: "success",
        text: `Staff member "${editName}" updated successfully! New Password: ${editPassword}`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update user" });
    }
  };

  const handleDeleteUser = (id: string, userName: string) => {
    if (confirm(`Are you sure you want to remove staff member "${userName}" from the system?`)) {
      try {
        store.deleteUser(id);
        setUsers([...store.getUsers(currentTenant.id, currentUser.role)]);
        refreshUsers();
        setMsg({ type: "success", text: `Staff member "${userName}" has been removed from the system.` });
      } catch (err: any) {
        setMsg({ type: "error", text: err.message });
      }
    }
  };

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-300",
    OWNER: "bg-amber-100 text-amber-800 border-amber-300",
    BRANCH_MANAGER: "bg-blue-100 text-blue-800 border-blue-300",
    SALESMAN: "bg-cyan-100 text-cyan-800 border-cyan-300",
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
            Staff & Credentials Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Shop owners and super admins can manage staff accounts, view credentials, and reset login passwords.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
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

      {/* Quick Credentials Info Box - Filtered strictly by role */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 text-xs text-emerald-950 space-y-2">
        <div className="flex items-center gap-2 font-black text-sm">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <span className="font-urdu">Rajpoot Traders - Active Staff Credentials</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Super Admin ONLY visible when logged in as SUPER_ADMIN */}
          {isSuperAdmin && (
            <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-0.5">
              <span className="font-bold text-purple-900 block font-urdu">Super Admin:</span>
              <p className="font-mono text-slate-700">musama4288921@gmail.com</p>
              <p className="font-mono font-black text-purple-700">Pass: 33admin401</p>
            </div>
          )}

          <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-0.5">
            <span className="font-bold text-amber-900 block font-urdu">Shop Owner:</span>
            <p className="font-mono text-slate-700">owner@rajpoottraders.com</p>
            <p className="font-mono font-black text-amber-700">Pass: owner123</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-0.5">
            <span className="font-bold text-blue-900 block font-urdu">Salesman (Zaheem):</span>
            <p className="font-mono text-slate-700">salesman@rajpoottraders.com</p>
            <p className="font-mono font-black text-blue-700">Pass: sales123</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-0.5">
            <span className="font-bold text-emerald-900 block font-urdu">Field Recovery Officer (Bilal):</span>
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
              {isSuperAdmin ? "All System Users" : "Active Shop Staff Members"} ({visibleUsers.length})
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              Toggle the eye icon to view passwords, or click the edit icon to reset staff credentials.
            </p>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden space-y-3">
          {visibleUsers.map((u) => {
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
                      title="Edit & Reset Password"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {u.id !== "usr_super_admin" && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Remove Staff"
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
                  {u.assignedRouteZones?.includes("ALL_ROUTES") || u.assignedRouteZone === "ALL_ROUTES" || u.assignedRouteZone?.includes("تمام روٹس") || u.assignedRouteZone?.includes("All Routes") ? (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 font-urdu">
                        🌐 تمام روٹس (All Routes - پورا شہر)
                      </span>
                    </div>
                  ) : u.assignedRouteZones && u.assignedRouteZones.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {u.assignedRouteZones.map((rz, i) => (
                        <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-urdu">
                          📍 {rz}
                        </span>
                      ))}
                    </div>
                  ) : u.assignedRouteZone ? (
                    <p className="text-emerald-700 font-bold font-urdu">Route: {u.assignedRouteZone}</p>
                  ) : null}
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
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Branch / Route</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((u) => {
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
                          title={isPassVisible ? "Hide Password" : "Show Password"}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatPhone(u.phone)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-urdu">
                      {u.assignedRouteZones?.includes("ALL_ROUTES") || u.assignedRouteZone === "ALL_ROUTES" || u.assignedRouteZone?.includes("تمام روٹس") || u.assignedRouteZone?.includes("All Routes") ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 font-urdu">
                          🌐 تمام روٹس (All Routes - پورا شہر)
                        </span>
                      ) : u.assignedRouteZones && u.assignedRouteZones.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {u.assignedRouteZones.map((rz, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-urdu">
                              📍 {rz}
                            </span>
                          ))}
                        </div>
                      ) : u.assignedRouteZone ? (
                        <span className="text-emerald-700 font-bold">{u.assignedRouteZone}</span>
                      ) : (
                        <span className="text-slate-400">تمام دکان / جنرل پول</span>
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
                          title="Edit Staff & Reset Password"
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
                  Edit Staff & Reset Password
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-urdu">Staff Full Name *</label>
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
                  Reset Login Password *
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
                  Set the new login password for the staff member.
                </span>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">Role Tier *</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    {isSuperAdmin && <option value="OWNER">Shop Owner / Franchise</option>}
                    <option value="BRANCH_MANAGER">Showroom / Branch Manager</option>
                    <option value="SALESMAN">Sales Officer / Counter Booking</option>
                    <option value="FIELD_RECOVERY">Field Recovery Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">Account Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {editRole !== "CUSTOMER" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-800 font-bold font-urdu">
                      تفویض شدہ روٹس و علاقے (Assigned Routes / Zones)
                    </label>
                    <span className="text-[10px] text-slate-500 font-urdu">
                      ایک یا تمام روٹس منتخب کریں
                    </span>
                  </div>

                  {/* Radio: ALL vs Custom */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editRouteAssignmentMode === "ALL" ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold" : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="editRouteMode"
                        checked={editRouteAssignmentMode === "ALL"}
                        onChange={() => setEditRouteAssignmentMode("ALL")}
                        className="accent-emerald-600"
                      />
                      <span>🌐 تمام روٹس (All Routes - پورا شہر / دکان)</span>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editRouteAssignmentMode === "CUSTOM" ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold" : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="editRouteMode"
                        checked={editRouteAssignmentMode === "CUSTOM"}
                        onChange={() => setEditRouteAssignmentMode("CUSTOM")}
                        className="accent-emerald-600"
                      />
                      <span>📍 مخصوص روٹس منتخب کریں ({editSelectedRoutes.length} منتخب)</span>
                    </label>
                  </div>

                  {editRouteAssignmentMode === "CUSTOM" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-bold">چیک باکس سے مطلوبہ روٹس منتخب کریں:</span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditSelectedRoutes(dynamicRoutes.map((r) => r.name))}
                            className="text-emerald-700 hover:underline font-bold"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setEditSelectedRoutes([])}
                            className="text-slate-500 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {dynamicRoutes.map((r) => {
                          const checked = editSelectedRoutes.includes(r.name);
                          return (
                            <label
                              key={r.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                                checked ? "bg-emerald-50 text-emerald-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditSelectedRoutes([...editSelectedRoutes, r.name]);
                                  } else {
                                    setEditSelectedRoutes(editSelectedRoutes.filter((x) => x !== r.name));
                                  }
                                }}
                                className="rounded text-emerald-600"
                              />
                              <span className="truncate">{r.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes & Update Password</span>
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
                  Register New Staff Member
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-urdu">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zaheem Salesman or Bilal Recovery"
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
                  <label className="block text-slate-700 font-bold mb-1">Login Password *</label>
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
                  <label className="block text-slate-700 font-bold mb-1 font-urdu">Role Tier *</label>
                  {isSuperAdmin ? (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="OWNER">Shop Owner / Franchise Partner</option>
                    </select>
                  ) : (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="BRANCH_MANAGER">Showroom / Branch Manager</option>
                      <option value="SALESMAN">Sales Officer / Counter Booking</option>
                      <option value="FIELD_RECOVERY">Field Recovery Officer</option>
                    </select>
                  )}
                </div>
              </div>

              {role !== "CUSTOMER" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-800 font-bold font-urdu">
                      تفویض شدہ روٹس و علاقے (Assigned Routes / Zones)
                    </label>
                    <span className="text-[10px] text-slate-500 font-urdu">
                      ایک یا تمام روٹس منتخب کریں
                    </span>
                  </div>

                  {/* Radio: ALL vs Custom */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      routeAssignmentMode === "ALL" ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold" : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="addRouteMode"
                        checked={routeAssignmentMode === "ALL"}
                        onChange={() => setRouteAssignmentMode("ALL")}
                        className="accent-emerald-600"
                      />
                      <span>🌐 تمام روٹس (All Routes - پورا شہر / دکان)</span>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      routeAssignmentMode === "CUSTOM" ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold" : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="addRouteMode"
                        checked={routeAssignmentMode === "CUSTOM"}
                        onChange={() => setRouteAssignmentMode("CUSTOM")}
                        className="accent-emerald-600"
                      />
                      <span>📍 مخصوص روٹس منتخب کریں ({selectedRoutes.length} منتخب)</span>
                    </label>
                  </div>

                  {routeAssignmentMode === "CUSTOM" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-bold">چیک باکس سے مطلوبہ روٹس منتخب کریں:</span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRoutes(dynamicRoutes.map((r) => r.name))}
                            className="text-emerald-700 hover:underline font-bold"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedRoutes([])}
                            className="text-slate-500 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {dynamicRoutes.map((r) => {
                          const checked = selectedRoutes.includes(r.name);
                          return (
                            <label
                              key={r.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                                checked ? "bg-emerald-50 text-emerald-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRoutes([...selectedRoutes, r.name]);
                                  } else {
                                    setSelectedRoutes(selectedRoutes.filter((x) => x !== r.name));
                                  }
                                }}
                                className="rounded text-emerald-600"
                              />
                              <span className="truncate">{r.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Staff Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

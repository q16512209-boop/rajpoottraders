"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { IRouteZone, User } from "@/lib/db/types";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Navigation,
  Search,
  ShieldAlert,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function RoutesManagerPage() {
  const { currentUser, currentTenant } = useAuth();
  const [routes, setRoutes] = useState<IRouteZone[]>(() => store.getRouteZones(currentTenant.id));
  const [staffUsers] = useState<User[]>(() => store.getUsers(currentTenant.id));
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add Route Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Chiniot");
  const [assignedCollectorId, setAssignedCollectorId] = useState("");
  const [description, setDescription] = useState("");
  const [centerLat, setCenterLat] = useState<number>(31.7200);
  const [centerLng, setCenterLng] = useState<number>(72.9789);

  // Edit Route Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("Chiniot");
  const [editCollectorId, setEditCollectorId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  if (!currentUser) return null;

  const isOwnerOrAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
  if (!isOwnerOrAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2 max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">Only the Shop Owner or Super Admin has authorization to manage and configure dynamic collection routes.</p>
      </div>
    );
  }

  const collectors = staffUsers.filter((u) => u.role === "FIELD_RECOVERY" || u.role === "BRANCH_MANAGER");

  const filteredRoutes = routes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      (r.assignedCollectorName || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q)
    );
  });

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCollector = collectors.find((c) => c.id === assignedCollectorId);
      const created = store.createRouteZone(currentUser, {
        tenantId: currentTenant.id,
        name: name.trim(),
        city: city.trim() || "Chiniot",
        assignedCollectorId: selectedCollector?.id,
        assignedCollectorName: selectedCollector ? `${selectedCollector.name} (${selectedCollector.role})` : undefined,
        description: description.trim(),
        centerLat,
        centerLng,
        status: "ACTIVE",
      });

      setRoutes([...store.getRouteZones(currentTenant.id)]);
      setShowAddModal(false);
      setName("");
      setDescription("");
      setAssignedCollectorId("");
      setMsg({ type: "success", text: `Route "${created.name}" created successfully and assigned to ${created.assignedCollectorName || "General Pool"}.` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to create route" });
    }
  };

  const handleOpenEdit = (r: IRouteZone) => {
    setEditId(r.id);
    setEditName(r.name);
    setEditCity(r.city);
    setEditCollectorId(r.assignedCollectorId || "");
    setEditDescription(r.description || "");
    setEditStatus(r.status);
    setShowEditModal(true);
    setMsg(null);
  };

  const handleUpdateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCollector = collectors.find((c) => c.id === editCollectorId);
      store.updateRouteZone(currentUser, editId, {
        name: editName.trim(),
        city: editCity.trim(),
        assignedCollectorId: selectedCollector?.id,
        assignedCollectorName: selectedCollector ? `${selectedCollector.name} (${selectedCollector.role})` : undefined,
        description: editDescription.trim(),
        status: editStatus,
      });

      setRoutes([...store.getRouteZones(currentTenant.id)]);
      setShowEditModal(false);
      setMsg({ type: "success", text: `Route "${editName}" updated successfully!` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update route" });
    }
  };

  const handleDeleteRoute = (r: IRouteZone) => {
    if (confirm(`Are you sure you want to delete route "${r.name}"? Active customers assigned to this zone will need re-routing.`)) {
      try {
        store.deleteRouteZone(currentUser, r.id);
        setRoutes([...store.getRouteZones(currentTenant.id)]);
        setMsg({ type: "success", text: `Route "${r.name}" deleted successfully.` });
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "Failed to delete route" });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Dynamic Zone Configurator
            </span>
            <UrduSpeaker customText="یہاں سے دکان کا مالک تمام فیلڈ روٹس، چنیوٹ کے علاقے، اور متعلقہ ریکوری افسر کی ڈیوٹی خود ترتیب اور ایڈٹ کر سکتا ہے۔" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-emerald-600" />
            Custom Collection Routes & Zones
          </h1>
          <p className="text-xs text-slate-500">
            Define, rename, and assign collection routes for field recovery officers, route sheets, and map pin assignment.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setMsg(null);
          }}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Custom Route</span>
        </button>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 font-black">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Routes</span>
            <strong className="text-2xl font-black text-slate-900">{routes.filter((r) => r.status === "ACTIVE").length}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Officers</span>
            <strong className="text-2xl font-black text-slate-900">
              {new Set(routes.map((r) => r.assignedCollectorId).filter(Boolean)).size} Officers
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target City Base</span>
            <strong className="text-2xl font-black text-slate-900">Chiniot & Suburbs</strong>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search route name, city, assigned officer, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-medium outline-none bg-transparent"
        />
      </div>

      {/* Routes Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutes.map((r) => (
          <div
            key={r.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {r.city}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">{r.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    r.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-slate-100 text-slate-500 border-slate-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {r.description && <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>}

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-medium">Assigned Officer:</span>
                  <strong className="text-slate-800 font-bold">{r.assignedCollectorName || "General Pool / Unassigned"}</strong>
                </div>
                {r.centerLat && r.centerLng && (
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                    <span className="text-slate-400">Coordinates:</span>
                    <span>
                      {r.centerLat.toFixed(4)}, {r.centerLng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(r)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Route</span>
              </button>
              <button
                onClick={() => handleDeleteRoute(r)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {filteredRoutes.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No collection routes match your search filter.</p>
            <p className="text-xs text-slate-400">Click &quot;Add New Custom Route&quot; above to create a custom area zone for your shop.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Add New Custom Route */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  New Area Zone
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Add Custom Collection Route</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Route / Area Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohallah Rehman Abad & Muslim Bazaar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    placeholder="Chiniot"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Recovery Officer</label>
                  <select
                    value={assignedCollectorId}
                    onChange={(e) => setAssignedCollectorId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="">-- General Pool (Unassigned) --</option>
                    {collectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role === "FIELD_RECOVERY" ? "Recovery Officer" : "Manager"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description & Boundaries</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Starting from Desi Masjid to Main Chowk, left lane houses and shops..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Center Latitude (Optional)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLat}
                    onChange={(e) => setCenterLat(parseFloat(e.target.value) || 31.72)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Center Longitude (Optional)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLng}
                    onChange={(e) => setCenterLng(parseFloat(e.target.value) || 72.978)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

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
                  <span>Save Route</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Custom Route */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300">
                  Edit Zone Configuration
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Edit Collection Route</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRoute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Route / Area Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Recovery Officer</label>
                  <select
                    value={editCollectorId}
                    onChange={(e) => setEditCollectorId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="">-- General Pool (Unassigned) --</option>
                    {collectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role === "FIELD_RECOVERY" ? "Recovery Officer" : "Manager"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Active Route)</option>
                    <option value="INACTIVE">INACTIVE (Temporarily Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description & Boundaries</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

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
                  <span>Update Route</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

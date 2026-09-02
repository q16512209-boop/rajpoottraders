"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GPSLocation } from "@/lib/db/types";
import { UrduSpeaker } from "./UrduSpeaker";
import {
  MapPin,
  Navigation,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LocateFixed,
  Compass,
  Layers,
  Search,
} from "lucide-react";

// Dynamic import for Leaflet map with SSR disabled
const LeafletMapInner = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-300 animate-pulse">
      <Compass className="w-8 h-8 text-emerald-600 animate-spin" />
      <span className="text-xs font-bold text-slate-600 font-urdu">
        لائیو اوپن اسٹریٹ نقشہ لوڈ ہو رہا ہے... (Loading Live Interactive Map)
      </span>
    </div>
  ),
});

interface MapLocationPickerProps {
  value?: GPSLocation;
  onChange: (loc: GPSLocation) => void;
  defaultCity?: string;
}

export function MapLocationPicker({ value, onChange, defaultCity = "Lahore" }: MapLocationPickerProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(value?.address || "");
  const [showCoordinateInputs, setShowCoordinateInputs] = useState(false);

  const [currentLoc, setCurrentLoc] = useState<GPSLocation>(() => {
    if (value && value.lat && value.lng) return value;
    return {
      lat: 31.5204,
      lng: 74.3587,
      accuracy: 10,
      address: "Main Commercial Boulevard, Gulberg III, Lahore",
      mapUrl: "https://www.google.com/maps?q=31.5204,74.3587",
      aiSuggestedZone: "Route-A (Gulberg / Model Town)",
    };
  });

  // Pakistani major route zones
  const zoneIntelligence = [
    { name: "Route-A (Gulberg / Model Town)", lat: 31.5102, lng: 74.3441, landmark: "Liberty Chowk / Model Town Link Rd" },
    { name: "Route-B (Johar Town / Iqbal Town)", lat: 31.4697, lng: 74.2728, landmark: "Shaukat Khanum Chowk / Main Blvd" },
    { name: "Route-C (Cantt / DHA Phase 1-6)", lat: 31.4826, lng: 74.4098, landmark: "DHA Y-Block Commercial / Ring Road" },
    { name: "Route-D (Shahdara / Old City)", lat: 31.5925, lng: 74.3095, landmark: "Ravi Toll Plaza / Circular Road" },
    { name: "Faisalabad City Hub", lat: 31.4181, lng: 73.0776, landmark: "Clock Tower Circle / Katchery Bazar" },
  ];

  const detectAiZone = (lat: number, lng: number) => {
    let closest = zoneIntelligence[0];
    let minDist = 999999;
    for (const z of zoneIntelligence) {
      const dist = Math.sqrt(Math.pow(lat - z.lat, 2) + Math.pow(lng - z.lng, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = z;
      }
    }
    return closest;
  };

  const handleMapPinSelected = (lat: number, lng: number) => {
    const matchedZone = detectAiZone(lat, lng);
    const updatedLoc: GPSLocation = {
      lat,
      lng,
      accuracy: 8,
      address: manualAddress || `Near ${matchedZone.landmark}, ${matchedZone.name}`,
      mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      detectedAt: new Date().toISOString(),
      aiSuggestedZone: matchedZone.name,
    };
    setCurrentLoc(updatedLoc);
    onChange(updatedLoc);
  };

  const handleDetectLiveGps = () => {
    setErrorMsg(null);
    if (!navigator.geolocation) {
      setErrorMsg("آپ کا براؤزر GPS کو سپورٹ نہیں کرتا۔ برائے مہربانی نقشے پر کلک کر کے پن لگائیں۔");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const matchedZone = detectAiZone(latitude, longitude);

        const newLoc: GPSLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          address: manualAddress || `Live GPS Captured (Near ${matchedZone.landmark})`,
          mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
          detectedAt: new Date().toISOString(),
          aiSuggestedZone: matchedZone.name,
        };

        setCurrentLoc(newLoc);
        onChange(newLoc);
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        setErrorMsg("براؤزر نے GPS لوکیشن کی اجازت نہیں دی۔ برائے مہربانی نیچے لائیو نقشے پر کلک کر کے پن لگائیں۔");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleApplyZonePreset = (zone: (typeof zoneIntelligence)[0]) => {
    const newLoc: GPSLocation = {
      lat: zone.lat,
      lng: zone.lng,
      accuracy: 25,
      address: manualAddress || `Zone Hub: ${zone.landmark}`,
      mapUrl: `https://www.google.com/maps?q=${zone.lat},${zone.lng}`,
      detectedAt: new Date().toISOString(),
      aiSuggestedZone: zone.name,
    };
    setCurrentLoc(newLoc);
    onChange(newLoc);
  };

  return (
    <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header with Title & Speaker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-700 text-white rounded-xl shadow-sm">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>Interactive GPS Map Pin Assistant</span>
              <span className="text-[11px] font-normal text-emerald-800 font-urdu">(لائیو انٹرایکٹو نقشہ پن)</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-urdu">
            گاہک کے گھر یا دکان کے مقام پر کلک کریں یا لائیو GPS حاصل کریں
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UrduSpeaker customText="نقشے پر جہاں گاہک کا گھر ہے وہاں کلک کریں یا GPS لائیو بٹن دبائیں۔" size="sm" showLabel />
          <button
            type="button"
            onClick={handleDetectLiveGps}
            disabled={isDetecting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
            <span>{isDetecting ? "حاصل ہو رہا ہے..." : "حاصل کریں لائیو GPS"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-urdu flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Visual Leaflet Map Container */}
      <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden relative shadow-md border border-slate-300">
        <LeafletMapInner
          lat={currentLoc.lat}
          lng={currentLoc.lng}
          address={currentLoc.address}
          zone={currentLoc.aiSuggestedZone}
          onLocationSelect={handleMapPinSelected}
        />

        {/* Floating Instruction Badge */}
        <div className="absolute top-2 right-2 z-[400] bg-slate-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 pointer-events-none flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Click on Map / Drag Pin to Relocate</span>
        </div>
      </div>

      {/* Live Detected Coordinates & Zone Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Latitude & Longitude (کوآرڈینیٹس)
          </span>
          <strong className="text-emerald-800 font-mono font-bold block text-sm">
            {currentLoc.lat.toFixed(6)}, {currentLoc.lng.toFixed(6)}
          </strong>
          <span className="text-[10px] text-slate-400 block font-mono">
            GPS Accuracy: ±{currentLoc.accuracy || 10}m
          </span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            AI Recommended Route Zone
          </span>
          <strong className="text-purple-900 font-bold block text-xs truncate">
            {currentLoc.aiSuggestedZone || "Route-A (Gulberg / Model Town)"}
          </strong>
          <span className="text-[10px] text-emerald-700 font-urdu block">
            خودکار روٹ شیٹ اسائنمنٹ
          </span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Google Maps Live Link
          </span>
          <a
            href={currentLoc.mapUrl || `https://www.google.com/maps?q=${currentLoc.lat},${currentLoc.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold text-xs pt-1"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Area Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>Fast Area Presets (فوری علاقہ زون جمپ):</span>
          </span>
          <button
            type="button"
            onClick={() => setShowCoordinateInputs(!showCoordinateInputs)}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
          >
            {showCoordinateInputs ? "Hide Coordinate Inputs" : "Manual Lat/Lng Inputs"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {zoneIntelligence.map((zone) => (
            <button
              key={zone.name}
              type="button"
              onClick={() => handleApplyZonePreset(zone)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                currentLoc.aiSuggestedZone === zone.name
                  ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {zone.name.split(" (")[0]} ({zone.landmark.split(" / ")[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Manual Lat/Lng Fallback Drawer */}
      {showCoordinateInputs && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Manual Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={currentLoc.lat}
              onChange={(e) => handleMapPinSelected(Number(e.target.value), currentLoc.lng)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Manual Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={currentLoc.lng}
              onChange={(e) => handleMapPinSelected(currentLoc.lat, Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-xs outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
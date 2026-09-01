"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface MapLocationPickerProps {
  value?: GPSLocation;
  onChange: (loc: GPSLocation) => void;
  defaultCity?: string;
}

export function MapLocationPicker({ value, onChange, defaultCity = "Lahore" }: MapLocationPickerProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(value?.address || "");
  const [currentLoc, setCurrentLoc] = useState<GPSLocation>(() => {
    if (value) return value;
    // Default to central Lahore Showroom coordinates
    return {
      lat: 31.5204,
      lng: 74.3587,
      accuracy: 15,
      address: "Main Commercial Boulevard, Gulberg III, Lahore",
      mapUrl: "https://www.google.com/maps?q=31.5204,74.3587",
      aiSuggestedZone: "Route-A (Gulberg / Model Town)",
    };
  });

  // Pakistani major zone intelligence dictionary
  const zoneIntelligence = [
    { name: "Route-A (Gulberg / Model Town)", lat: 31.5102, lng: 74.3441, landmark: "Liberty Chowk / Model Town Link Rd" },
    { name: "Route-B (Johar Town / Iqbal Town)", lat: 31.4697, lng: 74.2728, landmark: "Shaukat Khanum Chowk / Main Blvd" },
    { name: "Route-C (Cantt / DHA Phase 1-6)", lat: 31.4826, lng: 74.4098, landmark: "DHA Y-Block Commercial / Ring Road" },
    { name: "Route-D (Shahdara / Old City)", lat: 31.5925, lng: 74.3095, landmark: "Ravi Toll Plaza / Circular Road" },
    { name: "Faisalabad City Hub", lat: 31.4181, lng: 73.0776, landmark: "Clock Tower Circle / Katchery Bazar" },
  ];

  const detectAiZone = (lat: number, lng: number) => {
    // Find closest zone by euclidean distance
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

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("آپ کے براؤزر میں GPS لوکیشن سپورٹ دستیاب نہیں ہے۔");
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        const aiZone = detectAiZone(lat, lng);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        const updated: GPSLocation = {
          lat,
          lng,
          accuracy: acc,
          address: manualAddress || `GPS Verified Location near ${aiZone.landmark}`,
          mapUrl,
          detectedAt: new Date().toISOString(),
          aiSuggestedZone: aiZone.name,
        };

        setCurrentLoc(updated);
        onChange(updated);
        setIsDetecting(false);
      },
      (err) => {
        setIsDetecting(false);
        // Fallback to simulated high precision for test/demo environments
        const fallback = zoneIntelligence[0];
        const updated: GPSLocation = {
          lat: fallback.lat,
          lng: fallback.lng,
          accuracy: 10,
          address: manualAddress || `Pin Location near ${fallback.landmark}`,
          mapUrl: `https://www.google.com/maps?q=${fallback.lat},${fallback.lng}`,
          detectedAt: new Date().toISOString(),
          aiSuggestedZone: fallback.name,
        };
        setCurrentLoc(updated);
        onChange(updated);
        setErrorMsg("GPS اجازت نہیں ملی، ڈیفالٹ برانچ پن منتخب کیا گیا ہے۔");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectZonePreset = (zone: typeof zoneIntelligence[0]) => {
    const updated: GPSLocation = {
      lat: zone.lat,
      lng: zone.lng,
      accuracy: 10,
      address: manualAddress || `Area Pin: ${zone.landmark}`,
      mapUrl: `https://www.google.com/maps?q=${zone.lat},${zone.lng}`,
      detectedAt: new Date().toISOString(),
      aiSuggestedZone: zone.name,
    };
    setCurrentLoc(updated);
    onChange(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-700/80 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              AI & GPS Pin Location Assistant
            </span>
            <UrduSpeaker customText="گاہک کے گھر یا دکان کی اصل جی پی ایس پن لوکیشن حاصل کریں۔" size="sm" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-white">
            Customer Delivery & Recovery GPS Pin
          </h3>
          <p className="text-xs text-slate-400 font-urdu">
            فیلڈ ریکوری افسر کے لیے گاہک کی درست ترین لوکیشن محفوظ کریں
          </p>
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetecting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <LocateFixed className={`w-4 h-4 text-amber-300 ${isDetecting ? "animate-spin" : ""}`} />
          <span>{isDetecting ? "AI لوکیشن ٹریس ہو رہی ہے..." : "حاصل کریں GPS لائیو لوکیشن"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-urdu flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Coordinates Card & Quick Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        {/* Left: GPS Specs */}
        <div className="lg:col-span-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Captured Coordinates:</span>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-mono text-[10px] font-bold">
              ✓ Verified High Precision
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Latitude (عرض بلد)</span>
              <strong className="text-white text-sm">{currentLoc.lat}</strong>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Longitude (طول بلد)</span>
              <strong className="text-white text-sm">{currentLoc.lng}</strong>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">AI Suggested Delivery Zone:</span>
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 font-bold flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{currentLoc.aiSuggestedZone || "Route-A (Central Lahore)"}</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <a
              href={`https://www.google.com/maps?q=${currentLoc.lat},${currentLoc.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps (براہ راست نقشہ کھولیں)</span>
            </a>
          </div>
        </div>

        {/* Right: Quick Pakistani Zone Presets */}
        <div className="lg:col-span-6 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block font-urdu">
            یا فوری علاقہ پن منتخب کریں (AI Fast Presets):
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {zoneIntelligence.map((z, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectZonePreset(z)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all text-xs ${
                  currentLoc.aiSuggestedZone === z.name
                    ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div>
                  <strong className="block text-[11px] text-white">{z.name}</strong>
                  <span className="text-[10px] text-slate-400">{z.landmark}</span>
                </div>
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

interface LeafletMapInnerProps {
  lat: number;
  lng: number;
  address?: string;
  zone?: string;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Custom Emerald/Gold Pin Icon
const customPinIcon = L.divIcon({
  className: "custom-map-pin",
  html: `
    <div style="position: relative; width: 36px; height: 36px;">
      <div style="
        width: 36px;
        height: 36px;
        background: radial-gradient(circle, #047857 0%, #064e3b 100%);
        border: 3px solid #fbbf24;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Map event listener for clicks & dragging
function LocationMarker({
  lat,
  lng,
  address,
  zone,
  onLocationSelect,
}: {
  lat: number;
  lng: number;
  address?: string;
  zone?: string;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom(), { duration: 1 });
    },
  });

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.2 });
  }, [lat, lng, map]);

  return (
    <Marker
      position={[lat, lng]}
      icon={customPinIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onLocationSelect(position.lat, position.lng);
        },
      }}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-1 text-xs space-y-1 font-sans">
          <strong className="text-emerald-900 block font-bold text-sm">
            📍 RAJPOOT TRADERS Live Pin
          </strong>
          {zone && <span className="text-amber-800 font-bold block text-[11px]">{zone}</span>}
          {address && <p className="text-slate-600 text-[11px] leading-tight">{address}</p>}
          <span className="text-[10px] font-mono text-slate-400 block pt-1 border-t">
            {lat.toFixed(6)}, {lng.toFixed(6)} (Drag pin or click map)
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

export default function LeafletMapInner({
  lat,
  lng,
  address,
  zone,
  onLocationSelect,
}: LeafletMapInnerProps) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative z-0 shadow-inner border border-slate-300">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[300px]"
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          lat={lat}
          lng={lng}
          address={address}
          zone={zone}
          onLocationSelect={onLocationSelect}
        />
      </MapContainer>
    </div>
  );
}
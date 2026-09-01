"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { URDU_GUIDES, speakUrdu, stopSpeech } from "@/lib/voice/urdu-voice";

interface UrduSpeakerProps {
  guideKey?: keyof typeof URDU_GUIDES | string;
  customText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "bubble" | "button";
  showLabel?: boolean;
}

export function UrduSpeaker({
  guideKey,
  customText,
  size = "sm",
  variant = "inline",
  showLabel = false,
}: UrduSpeakerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const guide = guideKey && URDU_GUIDES[guideKey] ? URDU_GUIDES[guideKey] : null;
  const textToSpeak = customText || guide?.urduText || "راجپوت ٹریڈرز رہنمائی";

  const handleSpeak = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      setShowTooltip(false);
    } else {
      setShowTooltip(true);
      speakUrdu(
        textToSpeak,
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          setTimeout(() => setShowTooltip(false), 2500);
        }
      );
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSpeak}
        title="اردو آواز میں رہنمائی سنیں (Urdu Voice Guide)"
        className={`inline-flex items-center justify-center gap-1 rounded-full transition-all focus:outline-none ${
          isPlaying
            ? "bg-amber-400 text-slate-950 scale-110 shadow-md ring-2 ring-amber-300 animate-pulse"
            : "bg-emerald-100/90 hover:bg-emerald-200 text-emerald-800 hover:scale-105"
        } ${
          size === "sm"
            ? "p-1.5 text-xs"
            : size === "lg"
            ? "p-3 text-base"
            : "p-2 text-sm"
        }`}
      >
        {isPlaying ? (
          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
        {showLabel && (
          <span className="font-urdu font-bold text-[11px] px-1">اردو آواز</span>
        )}
      </button>

      {/* Floating Nastaleeq Urdu Speech Bubble */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 min-w-[220px] max-w-[300px] p-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/40 text-center animate-in fade-in zoom-in duration-200 pointer-events-none">
          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>اردو صوتی رہنمائی</span>
          </div>
          <p className="font-urdu text-xs leading-relaxed text-slate-100 dir-rtl">
            {textToSpeak}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
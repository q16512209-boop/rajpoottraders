"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useAuth();
  const [email, setEmail] = useState("musama4288921@gmail.com");
  const [password, setPassword] = useState("33admin401");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const success = login(email, password);
    if (success) {
      router.push("/portal");
    } else {
      setError("غلط ای میل یا پاس ورڈ درج کیا گیا ہے۔ براہ کرم درست کریڈینشلز درج کریں۔");
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (em: string, pass: string) => {
    setEmail(em);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-emerald-400/30">
            <span className="text-amber-300 font-serif">R</span>T
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            RAJPOOT TRADERS
          </h1>
          <p className="text-xs font-urdu text-emerald-400 font-semibold">
            آسان اقساط و ٹریڈنگ مینجمنٹ پورٹل — محفوظ لاگ اِن
          </p>
          <div className="pt-1 flex justify-center">
            <UrduSpeaker customText="راجپوت ٹریڈرز کے سسٹم میں داخل ہونے کے لیے اپنا ای میل اور پاس ورڈ درج کریں۔" size="sm" showLabel />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-urdu flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Email Address (ای میل ایڈریس)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="musama4288921@gmail.com"
              className="w-full p-3 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white font-medium outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Password (پاس ورڈ)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white font-medium outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>لاگ اِن کریں (Sign In)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Fast Role Login Presets */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block text-center">
            Role Preset Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("musama4288921@gmail.com", "33admin401")}
              className="p-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded-xl text-left transition-colors"
            >
              <strong className="block text-[11px] text-purple-300">Super Admin (Boss)</strong>
              <span className="text-[9px] text-slate-400 font-mono">musama4288921...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("owner@rajpoottraders.com", "owner123")}
              className="p-2 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-xl text-left transition-colors"
            >
              <strong className="block text-[11px] text-amber-300">Shop Owner</strong>
              <span className="text-[9px] text-slate-400 font-mono">owner@rajpoot...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("manager@rajpoottraders.com", "manager123")}
              className="p-2 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 rounded-xl text-left transition-colors"
            >
              <strong className="block text-[11px] text-blue-300">Branch Manager</strong>
              <span className="text-[9px] text-slate-400 font-mono">manager@rajpoot...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("recovery@rajpoottraders.com", "recovery123")}
              className="p-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-xl text-left transition-colors"
            >
              <strong className="block text-[11px] text-emerald-300">Field Officer</strong>
              <span className="text-[9px] text-slate-400 font-mono">recovery@rajpoot...</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← واپس پبلک ویب سائٹ پر جائیں
          </Link>
        </div>
      </div>
    </div>
  );
}
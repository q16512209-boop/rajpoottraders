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
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (failedAttempts >= 5) {
      setError("سیکیورٹی لاک: مسلسل 5 غلط کوششوں کی وجہ سے لاگ اِن عارضی طور پر بلاک ہے۔ کچھ دیر بعد کوشش کریں۔");
      return;
    }

    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const success = login(cleanEmail, password);

    if (success) {
      router.push("/portal");
    } else {
      setFailedAttempts((prev) => prev + 1);
      setError("درج کردہ ای میل یا پاس ورڈ غلط ہے۔ براہ کرم درست اور مجاز کریڈینشلز درج کریں۔");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-emerald-400/30">
            <span className="text-amber-300 font-serif">R</span>T
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            RAJPOOT TRADERS
          </h1>
          <p className="text-xs font-urdu text-emerald-400 font-semibold">
            آسان اقساط و ٹریڈنگ مینجمنٹ پورٹل — محفوظ سیکیورٹی لاگ اِن
          </p>
          <div className="pt-1 flex justify-center">
            <UrduSpeaker customText="سیکیورٹی پورٹل۔ اپنا رجسٹرڈ ای میل اور پاس ورڈ درج کر کے داخل ہوں۔" size="sm" showLabel />
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-[11px] font-urdu flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>یہ ایک محفوظ پورٹل ہے۔ صرف مجاز ملازمین اور مالکان اپنے رجسٹرڈ پاس ورڈ سے داخل ہو سکتے ہیں۔</span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs font-urdu flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Registered Email (رجسٹرڈ ای میل ایڈریس)
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@rajpoottraders.com"
              className="w-full p-3 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white font-medium outline-none transition-colors placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Password (پاس ورڈ)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 pr-10 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white font-medium outline-none transition-colors placeholder:text-slate-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <span>محفوظ لاگ اِن (Secure Sign In)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← واپس پبلک ویب سائٹ پر جائیں
          </Link>
        </div>
      </div>
    </div>
  );
}
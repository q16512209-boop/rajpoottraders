import React from "react";
import Link from "next/link";
import { Phone, MapPin, Mail, Shield, CheckCircle2, Clock } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow">
                <span className="text-amber-300">R</span>T
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                RAJPOOT TRADERS
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Punjab's trusted installment and treasury network. Providing easy hire-purchase plans for air conditioners, solar energy setups, smartphones, and motorbikes with transparent contracts and zero hidden fees.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg w-fit">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Official Registered Hire-Purchase Enterprise</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Installment Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products?cat=INVERTER_AC" className="hover:text-emerald-400 transition-colors">
                  DC Inverter ACs (Haier, Gree, Kenwood)
                </Link>
              </li>
              <li>
                <Link href="/products?cat=SOLAR_SYSTEM" className="hover:text-emerald-400 transition-colors">
                  Complete Hybrid Solar Packages (3kW - 10kW)
                </Link>
              </li>
              <li>
                <Link href="/products?cat=SMARTPHONE" className="hover:text-emerald-400 transition-colors">
                  PTA Approved Flagship Smartphones
                </Link>
              </li>
              <li>
                <Link href="/products?cat=MOTORBIKE" className="hover:text-emerald-400 transition-colors">
                  Honda & Yamaha Motorbikes (2026 Models)
                </Link>
              </li>
              <li>
                <Link href="/products?cat=LED_TV" className="hover:text-emerald-400 transition-colors">
                  Samsung & TCL 4K Smart TVs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Operations */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Verification & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/verify" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Public CNIC / Plan Verification
                </Link>
              </li>
              <li>
                <Link href="/calculator" className="hover:text-emerald-400 transition-colors">
                  EMI Installment Calculator
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-emerald-400 transition-colors">
                  Consumer Protection & Legal Guides
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-emerald-400 transition-colors">
                  Employee & Recovery Officer Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Branch Network */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Showroom & Branches
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200 block">Lahore Main Flagship:</strong>
                  Plot 14-B, Main Boulevard, Gulberg III, Lahore
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200 block">Faisalabad Hub:</strong>
                  Katchery Bazaar, Faisalabad
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 font-semibold">+92 300 8472910 / (042) 35889021</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mon - Sat: 10:00 AM - 10:00 PM (Fri: 3:00 PM - 10:00 PM)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RAJPOOT TRADERS (Installment & Trading Corp). All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 font-urdu text-sm">
            <span>راجپوت ٹریڈرز — آپ کا بااعتماد مالیاتی ساتھی</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

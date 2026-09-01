import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Calculator,
  ShoppingBag,
  CheckCircle,
  Zap,
  PhoneCall,
  Lock,
  ArrowRight,
  Sun,
  Flame,
  Award,
  Users,
  Search,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { InstallmentCalculator } from "@/components/marketing/InstallmentCalculator";
import { store } from "@/lib/db/store";
import { formatPKR } from "@/lib/formatters";

export default function HomePage() {
  const products = store.getProducts();
  const articles = store.getArticles();

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background glow & subtle watermark */}
        <div className="absolute inset-0 rajpoot-watermark pointer-events-none opacity-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 backdrop-blur-sm shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>پنجاب کا سب سے قابلِ اعتماد اقساط کا ادارہ — آسان ماہانہ اقساط</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Easy Monthly Installments for{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent">
                Electronics, Solar & Bikes
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              **RAJPOOT TRADERS** provides transparent, Shariah-compliant hire-purchase agreements. Buy Inverter ACs, Solar Hybrid Systems, PTA Smartphones, and Honda Motorcycles with verified dual guarantors and zero bank credit cards.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="#calculator-section"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all group"
              >
                <Calculator className="w-4 h-4 text-amber-300" />
                <span>Calculate Your Installment Plan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/products"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-100 font-bold text-sm rounded-xl border border-slate-700 backdrop-blur-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Browse Products & Schemes</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800/80 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Legal Stamp Paper</h4>
                  <p className="text-[11px] text-slate-400">Dual Guarantor Security</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant Verification</h4>
                  <p className="text-[11px] text-slate-400">Counter & Field Approvals</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Arrears Relief</h4>
                  <p className="text-[11px] text-slate-400">Short Payment Auto-Split</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">15+ Years Trust</h4>
                  <p className="text-[11px] text-slate-400">Lahore & Faisalabad Hubs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Calculator Section */}
      <section id="calculator-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Transparent Pricing Engine
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Estimate Your Monthly Installment
          </h2>
          <p className="text-sm text-slate-600">
            Adjust down payment, duration, and item price to see transparent monthly installments with zero hidden fees.
          </p>
        </div>

        <InstallmentCalculator />
      </section>

      {/* 3. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              In-Stock Catalog
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">
              Featured Items on Easy Installments
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Top requested consumer electronics, solar hybrid systems, and motorbikes ready for immediate dispatch.
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 hover:text-emerald-800"
          >
            <span>View All Schemes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-52 bg-slate-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {product.brand}
                  </span>
                  <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    In Stock ({product.stockQuantity})
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                    {product.title}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-500">
                    {Object.entries(product.specs).slice(0, 2).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-medium text-slate-700 text-right truncate max-w-[180px]">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Cash Price
                      </span>
                      <span className="text-sm font-bold text-slate-700 line-through">
                        {formatPKR(product.cashPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Starts From
                      </span>
                      <span className="text-xl font-extrabold text-emerald-700">
                        {formatPKR(product.popularInstallmentPlans?.[0]?.monthly || Math.round(product.cashPrice / 12))}
                        <span className="text-xs font-normal text-slate-500">/mo</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  href={`/calculator?price=${product.cashPrice}&name=${encodeURIComponent(product.title)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Customize Installment Plan</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Public Verification Quick Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Consumer Safety & Trust
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Official Plan & Receipt Verification Lookup
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Verify your active hire-purchase agreement, check guarantor validity, or confirm field recovery payment receipts with our SHA-256 tamper-proof ledger.
            </p>
            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Open Instant Verification Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEO Guides & Blog Snippets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Knowledge Base
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Installment Guides & Legal Rights
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>All Articles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <article
              key={art.slug}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {art.category}
                  </span>
                  <span>{art.readTime}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                  <Link href={`/blog/${art.slug}`} className="hover:text-emerald-700 transition-colors">
                    {art.title}
                  </Link>
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{art.author}</span>
                <Link
                  href={`/blog/${art.slug}`}
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR } from "@/lib/formatters";
import { ShoppingBag, Calculator, Search, Filter, CheckCircle2 } from "lucide-react";

export default function ProductsPage() {
  const allProducts = store.getProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("" );

  const categories = [
    { id: "ALL", label: "All Items" },
    { id: "INVERTER_AC", label: "Inverter ACs" },
    { id: "SOLAR_SYSTEM", label: "Solar Packages" },
    { id: "SMARTPHONE", label: "Smartphones" },
    { id: "MOTORBIKE", label: "Motorbikes" },
    { id: "LED_TV", label: "Smart LED TVs" },
  ];

  const filtered = allProducts.filter((p) => {
    const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchQuery =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Official In-Stock Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Electronics, Solar & Bike Installment Schemes
        </h1>
        <p className="text-sm text-slate-600">
          Browse verified authentic products available for immediate hire-purchase agreement and doorstep dispatch in Lahore and Faisalabad.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  {product.brand}
                </span>
                <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  {product.stockQuantity} Ready Units
                </span>
              </div>

              <div className="p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                  {product.title}
                </h3>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400 font-medium">{k}:</span>
                      <span className="text-slate-700 font-bold text-right truncate max-w-[170px]">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-baseline justify-between">
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
                      Monthly Installment
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
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                <Calculator className="w-4 h-4 text-amber-300" />
                <span>Calculate Custom Installment</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
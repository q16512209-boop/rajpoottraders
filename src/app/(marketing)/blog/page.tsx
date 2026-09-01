import React from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { BookOpen, Calendar, User, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installment Guides & Financing Knowledge Base | Rajpoot Traders",
  description: "Learn how easy installment plans, hire-purchase agreements, dual guarantor verification, and Shariah-compliant markups work in Pakistan.",
};

export default function BlogIndexPage() {
  const articles = store.getArticles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
          Knowledge Base & SEO Guides
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Installment Knowledge & Financial Guides
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-urdu leading-relaxed">
          پاکستان میں آسان اقساط، الیکٹرانکس فنانسنگ، اور قانونی معاہدے کی مکمل معلومات اور گائیڈز
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((art) => (
          <article
            key={art.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {art.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{art.readTime}</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                <Link href={`/blog/${art.slug}`}>{art.title}</Link>
              </h2>
              <p className="text-xs font-urdu font-semibold text-emerald-800 line-clamp-1">
                {art.urduTitle}
              </p>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {art.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{art.date}</span>
              </div>
              <Link
                href={`/blog/${art.slug}`}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
import React from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { ArrowRight } from "lucide-react";

export default function BlogIndexPage() {
  const articles = store.getArticles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          RAJPOOT TRADERS SEO Engine
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Installment Guides, Solar Financing & Consumer Rights
        </h1>
        <p className="text-sm text-slate-600">
          Authoritative articles and market insights helping Pakistani families and business owners make educated, Shariah-compliant hire-purchase decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((art) => (
          <article
            key={art.slug}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {art.category}
                </span>
                <span className="text-slate-400 font-medium">{art.readTime}</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                <Link href={`/blog/${art.slug}`}>{art.title}</Link>
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                {art.summary}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {art.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">{art.author}</span>
              <Link
                href={`/blog/${art.slug}`}
                className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>Read Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
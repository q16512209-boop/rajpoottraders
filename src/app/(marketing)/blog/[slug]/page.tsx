import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { Calendar, User, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = store.getArticleBySlug(params.slug);
  if (!article) return { title: "Article Not Found - Rajpoot Traders" };

  return {
    title: `${article.title} | Rajpoot Traders Guide`,
    description: article.summary,
    keywords: article.schemaKeywords,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
    },
  };
}

export default function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = store.getArticleBySlug(params.slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.summary,
    "author": {
      "@type": "Person",
      "name": article.author,
    },
    "publisher": {
      "@type": "Organization",
      "name": "RAJPOOT TRADERS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rajpoottraders.com/brand/logo.svg",
      },
    },
    "datePublished": article.date,
    "keywords": article.schemaKeywords.join(", "),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Articles</span>
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {article.category}
          </span>
          <span className="text-xs text-slate-400 font-medium">{article.readTime}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-6 text-xs text-slate-500 pt-2 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">{article.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{article.date}</span>
          </div>
        </div>
      </header>

      <div className="p-5 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-2xl text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
        {article.summary}
      </div>

      <div className="prose prose-slate max-w-none text-slate-800 space-y-4 leading-relaxed text-sm sm:text-base">
        {article.content.split("\n\n").map((para, i) => {
          if (para.startsWith("### ")) {
            return (
              <h3 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-2">
                {para.replace("### ", "")}
              </h3>
            );
          }
          if (para.startsWith("- ")) {
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 text-slate-700 text-sm">
                {para.split("\n").map((line, liIdx) => (
                  <li key={liIdx}>{line.replace("- ", "")}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="text-slate-700 leading-relaxed text-sm">
              {para}
            </p>
          );
        })}
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-lg font-bold">Ready to Start Your Installment Plan?</h4>
          <p className="text-xs text-slate-400">
            Use our live calculator or visit Rajpoot Traders showroom in Gulberg Lahore.
          </p>
        </div>
        <Link
          href="/calculator"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow whitespace-nowrap transition-colors"
        >
          Calculate Plan Now
        </Link>
      </div>
    </div>
  );
}
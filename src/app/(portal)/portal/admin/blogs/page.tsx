"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { ArticlePost } from "@/lib/db/types";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Tag,
  BookOpen,
  Eye,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function AdminBlogsPage() {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState<ArticlePost[]>(() => store.getArticles());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [urduTitle, setUrduTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Electronics & AC Financing");
  const [excerpt, setExcerpt] = useState("");
  const [readTime, setReadTime] = useState("5 min read");
  const [author, setAuthor] = useState("Usama Rajpoot (Finance Desk)");
  const [keywords, setKeywords] = useState("rajpoot traders, easy installment, lahore");
  const [contentHtml, setContentHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return null;
  }

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticleId) {
      setSlug(slugify(val));
    }
  };

  const handleOpenCreate = () => {
    setEditingArticleId(null);
    setTitle("");
    setUrduTitle("");
    setSlug("");
    setCategory("Electronics & AC Financing");
    setExcerpt("");
    setReadTime("5 min read");
    setAuthor("Usama Rajpoot (Finance Desk)");
    setKeywords("rajpoot traders, easy installment, lahore, inverter ac");
    setContentHtml(`<h2>1. تعارف و آسان اقساط کا طریقہ کار</h2>
<p>راجپوت ٹریڈرز پر تمام الیکٹرانکس، انورٹر اے سی اور سولر سسٹمز شفاف شرائط پر دستیاب ہیں۔</p>

<h3>2. مطلوبہ دستاویزات (Required Documents)</h3>
<ul>
  <li>خریدار کا اصل قومی شناختی کارڈ (CNIC)</li>
  <li>دو معزز ضامنان کی تفصیلات اور شناختی کارڈ کی کاپیاں</li>
  <li>25 فیصد ایڈوانس ڈاون پیمنٹ</li>
</ul>

<h3>3. سرکاری پنجاب ای اسٹامپ پیپر پر قانونی تحفظ</h3>
<p>تمام فنانسنگ قانونی اسٹامپ پیپر پر دونوں زبانوں (اردو و انگریزی) میں محفوظ کی جاتی ہے۔</p>`);
    setIsCreating(true);
  };

  const handleOpenEdit = (art: ArticlePost) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setUrduTitle(art.urduTitle);
    setSlug(art.slug);
    setCategory(art.category);
    setExcerpt(art.excerpt);
    setReadTime(art.readTime);
    setAuthor(art.author);
    setKeywords(art.keywords.join(", "));
    setContentHtml(art.contentHtml);
    setIsCreating(true);
  };

  const handleDelete = (id: string, titleStr: string) => {
    if (confirm(`Are you sure you want to delete article: "${titleStr}"?`)) {
      store.deleteArticle(id);
      setArticles([...store.getArticles()]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !excerpt || !contentHtml) {
      alert("Please fill in Title, Slug, Excerpt, and Article Content.");
      return;
    }

    const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);

    if (editingArticleId) {
      store.updateArticle(editingArticleId, {
        title,
        urduTitle,
        slug,
        category,
        excerpt,
        readTime,
        author,
        keywords: keywordList,
        contentHtml,
      });
    } else {
      store.createArticle({
        title,
        urduTitle: urduTitle || title,
        slug,
        category,
        excerpt,
        readTime,
        author,
        keywords: keywordList,
        contentHtml,
      });
    }

    setArticles([...store.getArticles()]);
    setIsCreating(false);
  };

  const insertSnippet = (snippet: string) => {
    setContentHtml((prev) => prev + "\n" + snippet);
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.urduTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || art.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-purple-800/80 text-purple-200 px-3 py-1 rounded-full border border-purple-600/40">
              Super Admin Exclusive • SEO Engine
            </span>
            <UrduSpeaker customText="سپر ایڈمن بلاگ مینجمنٹ۔ یہاں سے گوگل سرچ کے لیے نئے مضامین لکھیں اور پبلش کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            SEO Blog & Marketing CMS Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Publish SEO articles, buying guides, and installment announcements to Google Search ranking.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Write New SEO Article</span>
        </button>
      </div>

      {/* Articles Directory View */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Published Marketing Articles ({filteredArticles.length})
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              Manage all published and draft articles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Electronics & AC Financing">Electronics & AC</option>
              <option value="Solar System Installments">Solar Systems</option>
              <option value="Smartphone PTA Installments">Smartphones</option>
              <option value="Motorbikes & Vehicles">Motorbikes</option>
              <option value="Legal & Shariah Guides">Legal & Shariah</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {art.readTime}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs font-urdu text-emerald-700 font-semibold line-clamp-1">
                  {art.urduTitle}
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{art.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/blog/${art.slug}`}
                    target="_blank"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                    title="View live on website"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Live View</span>
                  </Link>

                  <button
                    onClick={() => handleOpenEdit(art)}
                    className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                    title="Edit article"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(art.id, art.title)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                    title="Delete article"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Modal / Drawer */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-4">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                  {editingArticleId ? "Edit Existing Article" : "Compose New SEO Blog Post"}
                </span>
                <h2 className="text-lg font-black">
                  {editingArticleId ? "Edit Article" : "Write New SEO Article"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1 bg-slate-800 rounded-lg font-bold"
              >
                Close ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Titles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    English SEO Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Inverter AC on Easy Monthly Installments Lahore 2026"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-purple-600 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Urdu / English Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={urduTitle}
                    onChange={(e) => setUrduTitle(e.target.value)}
                    placeholder="e.g. Complete Guide to Buying Inverter AC on Easy Installments in Chiniot"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-purple-600 outline-none font-urdu text-right text-sm"
                  />
                </div>
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    URL Slug (for rajpoottraders.com/blog/slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="inverter-ac-installments-lahore"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="Electronics & AC Financing">Electronics & AC Financing</option>
                    <option value="Solar System Installments">Solar System Installments</option>
                    <option value="Smartphone PTA Installments">Smartphone PTA Installments</option>
                    <option value="Motorbikes & Vehicles">Motorbikes & Vehicles</option>
                    <option value="Legal & Shariah Guides">Legal & Shariah Guides</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Read Time</label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="5 min read"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Excerpt & Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Meta Excerpt / Google Summary (150-160 chars) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Comprehensive guide on installment criteria, down payments, and verified stamp agreements..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    SEO Keywords (Comma Separated)
                  </label>
                  <textarea
                    rows={2}
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="rajpoot traders, easy installment lahore, ac on installment, solar financing"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Formatting Helper Bar */}
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Quick HTML / Markdown Insert Tools:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-2.5 py-1 bg-white border border-slate-300 text-slate-800 rounded-lg font-bold text-[10px] flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-emerald-600" />
                    <span>{showPreview ? "Hide Preview" : "Show Live Preview"}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => insertSnippet("<h2>Main Heading</h2>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 font-bold"
                  >
                    + H2 Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet("<h3>Sub Heading</h3>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 font-bold"
                  >
                    + H3 Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet("<ul>\n  <li>Key Benefit 1</li>\n  <li>Key Benefit 2</li>\n</ul>")}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 font-bold"
                  >
                    + Bullet List
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl font-urdu"><strong>Important:</strong> All contracts are verified on Punjab e-Stamp.</div>')}
                    className="px-2 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 font-bold text-emerald-700"
                  >
                    + Urdu Alert Box
                  </button>
                </div>
              </div>

              {/* Content Editor & Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={showPreview ? "block" : "lg:col-span-2"}>
                  <label className="block text-slate-700 font-bold mb-1">
                    Article HTML / Content Body *
                  </label>
                  <textarea
                    required
                    rows={12}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder="Enter article text, HTML tags, or guidance points..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:bg-white focus:border-purple-600"
                  />
                </div>

                {showPreview && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 max-h-[300px] overflow-y-auto space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block border-b pb-1">
                      Live Preview Preview
                    </span>
                    <h2 className="text-base font-black text-slate-900">{title || "Article Title"}</h2>
                    <p className="text-xs font-urdu text-emerald-700 font-bold">{urduTitle}</p>
                    <div
                      className="prose prose-sm text-xs text-slate-700 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingArticleId ? "Update & Re-Publish Article" : "Publish Live to SEO Blog"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AboutSettings {
  id: string;
  siteName: string;
  aboutPronunciation: string;
  aboutSection1Title: string;
  aboutSection1Content: string;
  aboutSection2Title: string;
  aboutSection2Content: string;
  aboutSection3Title: string;
  aboutSection3Content: string;
  aboutSection4Title: string;
  aboutSection4Content: string;
  aboutQuote: string;
  aboutPrivacyNote: string;
  aboutEstYear: string;
  twitterUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
  emailContact: string | null;
}

interface Props {
  settings: AboutSettings;
}

export default function AboutClient({ settings }: Readonly<Props>) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    aboutPronunciation: settings.aboutPronunciation,
    aboutSection1Title: settings.aboutSection1Title,
    aboutSection1Content: settings.aboutSection1Content,
    aboutSection2Title: settings.aboutSection2Title,
    aboutSection2Content: settings.aboutSection2Content,
    aboutSection3Title: settings.aboutSection3Title,
    aboutSection3Content: settings.aboutSection3Content,
    aboutSection4Title: settings.aboutSection4Title,
    aboutSection4Content: settings.aboutSection4Content,
    aboutQuote: settings.aboutQuote,
    aboutPrivacyNote: settings.aboutPrivacyNote,
    aboutEstYear: settings.aboutEstYear,
    twitterUrl: settings.twitterUrl || "",
    githubUrl: settings.githubUrl || "",
    instagramUrl: settings.instagramUrl || "",
    emailContact: settings.emailContact || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save");

      setSaveMessage({ type: "success", text: "About page updated successfully" });
      router.refresh();
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const sections = [
    { num: 1, title: "aboutSection1Title", content: "aboutSection1Content" },
    { num: 2, title: "aboutSection2Title", content: "aboutSection2Content" },
    { num: 3, title: "aboutSection3Title", content: "aboutSection3Content" },
    { num: 4, title: "aboutSection4Title", content: "aboutSection4Content" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-light text-zinc-200">Edit About Page</h1>
              <p className="text-xs text-zinc-500">Customize your about page content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              target="_blank"
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 rounded-lg hover:border-zinc-600 transition-all flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Preview
            </Link>
            <button
              type="submit"
              form="about-form"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Save message */}
      {saveMessage && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg text-sm animate-slide ${
          saveMessage.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Form */}
      <form id="about-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Page Header
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Pronunciation / Subtitle</label>
              <input
                type="text"
                value={formData.aboutPronunciation}
                onChange={(e) => setFormData({ ...formData, aboutPronunciation: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="/ ˈæf.tɚ.stɪl / — the quiet that follows"
              />
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Content Sections
          </h2>
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.num} className="border border-zinc-800/50 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === section.num ? null : section.num)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-600 font-mono">0{section.num}</span>
                    <span className="text-sm text-zinc-300">
                      {formData[section.title as keyof typeof formData] || `Section ${section.num}`}
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-zinc-500 transition-transform ${expandedSection === section.num ? "rotate-180" : ""}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === section.num && (
                  <div className="p-4 space-y-3 bg-zinc-900/30">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">Section Title</label>
                      <input
                        type="text"
                        value={formData[section.title as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [section.title]: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">Content</label>
                      <textarea
                        value={formData[section.content as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [section.content]: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1">
                        Tip: Use <code className="px-1 py-0.5 bg-zinc-800 rounded">**text**</code> to highlight words
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quote Section */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Philosophy Quote
          </h2>
          <textarea
            value={formData.aboutQuote}
            onChange={(e) => setFormData({ ...formData, aboutQuote: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors resize-none italic"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          />
        </div>

        {/* Footer Section */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Footer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Privacy Note</label>
              <textarea
                value={formData.aboutPrivacyNote}
                onChange={(e) => setFormData({ ...formData, aboutPrivacyNote: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Established Year</label>
              <input
                type="text"
                value={formData.aboutEstYear}
                onChange={(e) => setFormData({ ...formData, aboutEstYear: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="2024"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Social Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Twitter URL</label>
              <input
                type="url"
                value={formData.twitterUrl}
                onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="https://twitter.com/username"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Instagram URL</label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">GitHub URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Email Contact</label>
              <input
                type="email"
                value={formData.emailContact}
                onChange={(e) => setFormData({ ...formData, emailContact: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="hello@example.com"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

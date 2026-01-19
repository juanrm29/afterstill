"use client";

import { useState } from "react";
import Link from "next/link";

interface SiteSettings {
  id: string;
  siteName: string;
  siteTagline: string;
  siteDescription: string | null;
  oracleEnabled: boolean;
  radioEnabled: boolean;
  catalogEnabled: boolean;
  candleEnabled: boolean;
  nightStartHour: number;
  nightEndHour: number;
  twitterUrl: string | null;
  githubUrl: string | null;
  emailContact: string | null;
}

interface Props {
  settings: SiteSettings;
}

export default function SettingsClient({ settings: initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof SiteSettings, value: string | boolean | number) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', left: '60%', top: '30%' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/30 bg-[#030304]/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-800">|</span>
            <h1 className="text-sm font-light text-zinc-400">Site Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-xs rounded-lg transition-all ${
              saved 
                ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400"
                : "bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600/30"
            }`}
          >
            {isSaving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 relative z-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <section className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
          <h2 className="text-sm font-light text-zinc-300 mb-6">Basic Information</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={settings.siteTagline}
                onChange={(e) => handleChange("siteTagline", e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Description
              </label>
              <textarea
                value={settings.siteDescription || ""}
                onChange={(e) => handleChange("siteDescription", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Instruments */}
        <section className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
          <h2 className="text-sm font-light text-zinc-300 mb-6">Instruments</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "oracleEnabled", label: "Oracle", icon: "👁️" },
              { key: "radioEnabled", label: "Radio", icon: "📻" },
              { key: "catalogEnabled", label: "Catalog", icon: "📚" },
              { key: "candleEnabled", label: "Candle", icon: "🕯️" },
            ].map((instrument) => (
              <label
                key={instrument.key}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  settings[instrument.key as keyof SiteSettings]
                    ? "bg-zinc-800/50 border-zinc-700/50"
                    : "bg-zinc-900/30 border-zinc-800/30 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings[instrument.key as keyof SiteSettings] as boolean}
                  onChange={(e) => handleChange(instrument.key as keyof SiteSettings, e.target.checked)}
                  className="sr-only"
                />
                <span className="text-xl">{instrument.icon}</span>
                <span className="text-sm text-zinc-400">{instrument.label}</span>
                <span className={`ml-auto w-2 h-2 rounded-full ${
                  settings[instrument.key as keyof SiteSettings] ? "bg-emerald-500" : "bg-zinc-700"
                }`} />
              </label>
            ))}
          </div>
        </section>

        {/* Night Mode */}
        <section className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
          <h2 className="text-sm font-light text-zinc-300 mb-6">Night Mode Hours</h2>
          <p className="text-zinc-600 text-xs mb-4">Candle instrument and night-only writings are visible during these hours.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Start Hour (24h)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.nightStartHour}
                onChange={(e) => handleChange("nightStartHour", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                End Hour (24h)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.nightEndHour}
                onChange={(e) => handleChange("nightEndHour", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
          <h2 className="text-sm font-light text-zinc-300 mb-6">Social Links</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Twitter/X URL
              </label>
              <input
                type="url"
                value={settings.twitterUrl || ""}
                onChange={(e) => handleChange("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                value={settings.githubUrl || ""}
                onChange={(e) => handleChange("githubUrl", e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.emailContact || ""}
                onChange={(e) => handleChange("emailContact", e.target.value)}
                placeholder="hello@example.com"
                className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

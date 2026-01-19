"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MarkdownEditor from "@/components/markdown-editor";
import GeniusPreview from "@/components/genius-preview";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface WritingVersion {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  createdAt: Date;
}

interface Writing {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  radioFrequency: number | null;
  isNightOnly: boolean;
  isFeatured: boolean;
  collectionId: string | null;
  tags: { tag: Tag }[];
  versions?: WritingVersion[];
}

interface Props {
  mode: "create" | "edit";
  writing?: Writing;
  tags: Tag[];
  collections: Collection[];
  authorId: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200); // 200 words per minute
}

export default function WritingEditor({ mode, writing, tags, collections, authorId }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  // Form state
  const [title, setTitle] = useState(writing?.title || "");
  const [slug, setSlug] = useState(writing?.slug || "");
  const [content, setContent] = useState(writing?.content || "");
  const [excerpt, setExcerpt] = useState(writing?.excerpt || "");
  const [status, setStatus] = useState(writing?.status || "DRAFT");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    writing?.tags.map((t) => t.tag.id) || []
  );
  const [collectionId, setCollectionId] = useState(writing?.collectionId || "");
  const [radioFrequency, setRadioFrequency] = useState(writing?.radioFrequency?.toString() || "");
  const [isNightOnly, setIsNightOnly] = useState(writing?.isNightOnly || false);
  const [isFeatured, setIsFeatured] = useState(writing?.isFeatured || false);
  const [scheduledAt, setScheduledAt] = useState(
    writing?.scheduledAt ? new Date(writing.scheduledAt).toISOString().slice(0, 16) : ""
  );

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === "create" && title && !writing?.slug) {
      setSlug(generateSlug(title));
    }
  }, [title, mode, writing?.slug]);

  // Word count
  const wordCount = countWords(content);
  const readingTime = estimateReadingTime(wordCount);

  // Auto-save draft
  const autoSave = useCallback(async () => {
    if (mode === "edit" && writing && status === "DRAFT" && content !== writing.content) {
      try {
        await fetch(`/api/admin/writings/${writing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, title, excerpt }),
        });
        setLastSaved(new Date());
      } catch {
        // Silent fail for auto-save
      }
    }
  }, [mode, writing, status, content, title, excerpt]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 5000);
    return () => clearTimeout(timer);
  }, [autoSave]);

  const handleSave = async (saveStatus?: string) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const finalStatus = saveStatus || status;

    try {
      const payload = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        status: finalStatus,
        tags: selectedTags,
        collectionId: collectionId || null,
        radioFrequency: radioFrequency ? parseFloat(radioFrequency) : null,
        isNightOnly,
        isFeatured,
        scheduledAt: finalStatus === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        publishedAt: finalStatus === "PUBLISHED" && !writing?.publishedAt ? new Date().toISOString() : writing?.publishedAt,
        wordCount,
        readingTime,
        authorId,
      };

      const url = mode === "create" 
        ? "/api/admin/writings" 
        : `/api/admin/writings/${writing?.id}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();
      setLastSaved(new Date());
      
      // Show success message
      const actionText = finalStatus === "PUBLISHED" ? "Published" : finalStatus === "SCHEDULED" ? "Scheduled" : "Saved";
      setSuccessMessage(`✓ ${actionText} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);

      if (mode === "create") {
        router.push(`/admin/writings/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!writing || !confirm("Are you sure you want to delete this writing? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/writings/${writing.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      router.push("/admin/writings");
    } catch {
      setError("Failed to delete writing");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(2,2,3,0.7) 70%, rgba(2,2,3,0.9) 100%)" 
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/30 sticky top-0 bg-[#030304]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/writings" 
              className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-500 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <span className="text-zinc-800">|</span>
            <span className="text-xs text-zinc-600">
              {mode === "create" ? "New Writing" : "Edit"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[10px] text-zinc-700">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <button
              onClick={() => handleSave("DRAFT")}
              disabled={isSaving || !title}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors disabled:opacity-40"
            >
              Save Draft
            </button>
            
            <button
              onClick={() => handleSave("PUBLISHED")}
              disabled={isSaving || !title || !content}
              className="px-4 py-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/80 transition-all disabled:opacity-40"
            >
              {isSaving ? "Saving..." : status === "PUBLISHED" ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* Main editor */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 px-4 py-3 bg-emerald-950/30 border border-emerald-900/30 rounded-lg animate-fade-in">
            <p className="text-xs text-emerald-400">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-950/30 border border-red-900/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-3xl font-extralight tracking-wide text-zinc-300 bg-transparent border-none focus:outline-none placeholder-zinc-700"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            />
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-700">/reading/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              placeholder="url-slug"
              className="flex-1 text-xs text-zinc-500 bg-transparent border-none focus:outline-none placeholder-zinc-700"
            />
          </div>

          {/* Content - Enhanced Markdown Editor */}
          <div className="min-h-[500px]">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Begin writing your story..."
            />
          </div>

          {/* Word count */}
          <div className="flex items-center gap-4 text-[10px] text-zinc-700 tracking-wider">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>

          {/* Genius Preview */}
          <GeniusPreview content={content} title={title} />

          {/* Excerpt */}
          <div className="pt-6 border-t border-zinc-800/30">
            <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
              Excerpt (optional)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short description for previews..."
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800/40 rounded-lg text-sm text-zinc-400 placeholder-zinc-700 focus:outline-none focus:border-zinc-700/50 resize-none"
            />
          </div>

          {/* Metadata */}
          <div className="pt-6 border-t border-zinc-800/30 grid grid-cols-2 gap-6">
            {/* Tags */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${
                      selectedTags.includes(tag.id)
                        ? "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
                        : "bg-transparent border-zinc-800/40 text-zinc-600 hover:border-zinc-700/50"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-zinc-700">No tags created yet</span>
                )}
              </div>
            </div>

            {/* Collection */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
                Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900/30 border border-zinc-800/40 rounded-lg text-sm text-zinc-400 focus:outline-none focus:border-zinc-700/50"
              >
                <option value="">None</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Radio frequency */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
                Radio Frequency (optional)
              </label>
              <input
                type="number"
                step="0.1"
                value={radioFrequency}
                onChange={(e) => setRadioFrequency(e.target.value)}
                placeholder="88.5"
                className="w-full px-3 py-2 bg-zinc-900/30 border border-zinc-800/40 rounded-lg text-sm text-zinc-400 placeholder-zinc-700 focus:outline-none focus:border-zinc-700/50"
              />
            </div>

            {/* Scheduled */}
            {status === "SCHEDULED" && (
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900/30 border border-zinc-800/40 rounded-lg text-sm text-zinc-400 focus:outline-none focus:border-zinc-700/50"
                />
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="pt-6 border-t border-zinc-800/30 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNightOnly}
                onChange={(e) => setIsNightOnly(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-zinc-500">Night only (Candle)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-zinc-500">Featured</span>
            </label>

            <div className="flex-1" />

            {/* Status select */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 bg-zinc-900/30 border border-zinc-800/40 rounded-lg text-xs text-zinc-500 focus:outline-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Version History */}
          {mode === "edit" && writing?.versions && writing.versions.length > 0 && (
            <div className="pt-6 border-t border-zinc-800/30">
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-500 transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${showVersions ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
                Version History ({writing.versions.length})
              </button>
              
              {showVersions && (
                <div className="mt-4 space-y-2">
                  {writing.versions.map((version) => (
                    <div
                      key={version.id}
                      className="group flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-800/40 rounded-lg hover:border-zinc-700/50 transition-all"
                    >
                      <div>
                        <p className="text-sm text-zinc-400">{version.title}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">
                          {new Date(version.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {version.content.split(/\s+/).length} words
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Restore this version? Current content will be saved as a new version.")) {
                            setTitle(version.title);
                            setContent(version.content);
                            setExcerpt(version.excerpt || "");
                          }
                        }}
                        className="px-3 py-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delete */}
          {mode === "edit" && (
            <div className="pt-6 border-t border-zinc-800/30">
              <button
                onClick={handleDelete}
                className="text-xs text-red-500/60 hover:text-red-500/80 transition-colors"
              >
                Delete this writing
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

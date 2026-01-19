"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: {
    writings: number;
  };
}

interface Props {
  tags: Tag[];
}

export default function TagsClient({ tags: initialTags }: Props) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tag");
      }

      const tag = await res.json();
      setTags((prev) => [...prev, { ...tag, _count: { writings: 0 } }]);
      setNewTagName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Delete this tag? It will be removed from all writings.")) return;

    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setTags((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch {
      setError("Failed to delete tag");
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
      <header className="relative z-10 border-b border-zinc-800/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-[10px] font-extralight tracking-[0.4em] text-zinc-600 uppercase hover:text-zinc-500 transition-colors">
              Afterstill
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Dashboard
              </Link>
              <Link href="/admin/writings" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Writings
              </Link>
              <Link href="/admin/tags" className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors tracking-wider">
                Tags
              </Link>
              <Link href="/admin/settings" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-extralight tracking-wide text-zinc-300 mb-8" style={{ fontFamily: "var(--font-cormorant), serif" }}>
          Tags
        </h1>

        {/* Create form */}
        <form onSubmit={handleCreateTag} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="flex-1 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-sm text-zinc-400 placeholder-zinc-700 focus:outline-none focus:border-zinc-700/70"
            />
            <button
              type="submit"
              disabled={isCreating || !newTagName.trim()}
              className="px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/40 rounded-lg text-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/70 disabled:opacity-40 transition-all"
            >
              {isCreating ? "Creating..." : "Add Tag"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-950/30 border border-red-900/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Tags list */}
        {tags.length > 0 ? (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 border border-zinc-800/30 rounded-lg group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">{tag.name}</span>
                  <span className="text-[10px] text-zinc-700">/{tag.slug}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-600">
                    {tag._count.writings} {tag._count.writings === 1 ? "writing" : "writings"}
                  </span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-xs text-zinc-700 hover:text-red-500/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800/30 rounded-lg">
            <p className="text-sm text-zinc-600">No tags yet</p>
          </div>
        )}
      </main>
    </div>
  );
}

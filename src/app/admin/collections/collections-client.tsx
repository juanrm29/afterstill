"use client";

import { useState } from "react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  _count: {
    writings: number;
  };
}

interface Props {
  collections: Collection[];
}

export default function CollectionsClient({ collections: initialCollections }: Props) {
  const [collections, setCollections] = useState(initialCollections);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      const newCollection = await res.json();
      setCollections([...collections, { ...newCollection, _count: { writings: 0 } }]);
      setName("");
      setDescription("");
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      const updated = await res.json();
      setCollections(collections.map(c => 
        c.id === id ? { ...c, ...updated } : c
      ));
      setEditingId(null);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update collection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection? Writings will be unlinked but not deleted.")) return;

    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setCollections(collections.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  const startEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setName(collection.name);
    setDescription(collection.description || "");
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setName("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-[#030304]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent 70%)', left: '10%', top: '20%' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/30 bg-[#030304]/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-800">|</span>
            <h1 className="text-sm font-light text-zinc-400">Collections</h1>
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); setName(""); setDescription(""); }}
            className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg hover:bg-emerald-600/30 transition-colors"
          >
            + New Collection
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="mb-8 p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
            <h2 className="text-sm font-light text-zinc-300 mb-4">
              {isCreating ? "New Collection" : "Edit Collection"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                  disabled={isLoading || !name.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Collection"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-zinc-500 text-xs hover:text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collections List */}
        <div className="space-y-3">
          {collections.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-600 text-sm">No collections yet</p>
              <p className="text-zinc-700 text-xs mt-2">Create your first collection to organize writings</p>
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                className="group flex items-center justify-between p-5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl hover:border-zinc-700/50 transition-all"
              >
                <div className="flex-1">
                  <h3 className="text-zinc-300 font-light">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-zinc-600 text-xs mt-1">{collection.description}</p>
                  )}
                  <p className="text-zinc-700 text-[10px] mt-2 uppercase tracking-wider">
                    {collection._count.writings} {collection._count.writings === 1 ? "writing" : "writings"}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(collection)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    className="px-3 py-1.5 text-xs text-red-500/60 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

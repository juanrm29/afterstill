"use client";

import { useState } from "react";
import Link from "next/link";

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Props {
  logs: ActivityLog[];
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-emerald-400 bg-emerald-500/10",
  UPDATE: "text-blue-400 bg-blue-500/10",
  DELETE: "text-red-400 bg-red-500/10",
  PUBLISH: "text-violet-400 bg-violet-500/10",
  UNPUBLISH: "text-amber-400 bg-amber-500/10",
  SCHEDULE: "text-cyan-400 bg-cyan-500/10",
  ARCHIVE: "text-zinc-400 bg-zinc-500/10",
  RESTORE: "text-green-400 bg-green-500/10",
};

const ENTITY_ICONS: Record<string, string> = {
  Writing: "📝",
  Tag: "🏷️",
  Collection: "📚",
  Settings: "⚙️",
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ActivityClient({ logs }: Props) {
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.entity === filter);

  const entities = [...new Set(logs.map(l => l.entity))];

  return (
    <div className="min-h-screen bg-[#030304]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', left: '20%', top: '30%' }}
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
            <h1 className="text-sm font-light text-zinc-400">Activity Log</h1>
          </div>
          
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${
                filter === "all" 
                  ? "bg-zinc-800 text-zinc-300" 
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              All
            </button>
            {entities.map(entity => (
              <button
                key={entity}
                onClick={() => setFilter(entity)}
                className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${
                  filter === entity 
                    ? "bg-zinc-800 text-zinc-300" 
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {entity}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No activity logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="group flex items-start gap-4 p-4 bg-zinc-900/30 border border-zinc-800/40 rounded-xl hover:border-zinc-700/50 transition-all"
              >
                {/* Icon */}
                <span className="text-lg">{ENTITY_ICONS[log.entity] || "📋"}</span>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded ${ACTION_COLORS[log.action] || "text-zinc-400 bg-zinc-500/10"}`}>
                      {log.action}
                    </span>
                    <span className="text-zinc-400 text-sm">{log.entity}</span>
                    {log.details && typeof log.details === 'object' && 'title' in log.details && (
                      <>
                        <span className="text-zinc-700">•</span>
                        <span className="text-zinc-500 text-sm truncate">
                          &quot;{String(log.details.title)}&quot;
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
                    <span>by {log.user.name || log.user.email}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(log.createdAt)}</span>
                  </div>
                  
                  {/* Details */}
                  {log.details && Object.keys(log.details).length > 1 && (
                    <details className="mt-2">
                      <summary className="text-[10px] text-zinc-600 cursor-pointer hover:text-zinc-500">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-zinc-900/50 rounded text-[10px] text-zinc-500 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Time */}
                <span className="text-[10px] text-zinc-700 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

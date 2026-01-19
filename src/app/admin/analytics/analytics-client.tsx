"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    avgReadProgress: number;
    avgTimeOnPage: number;
    totalReflections: number;
  };
  viewsByDay: Array<{ date: string; count: number }>;
  topWritings: Array<{ id: string; title: string; slug: string; viewCount: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  recentViews: Array<{
    id: string;
    path: string;
    visitorId: string | null;
    readProgress: number | null;
    timeOnPage: number | null;
    createdAt: string;
  }>;
  recentReflections: Array<{
    id: string;
    writingId: string;
    content: string;
    mood: string | null;
    createdAt: string;
  }>;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxViews = data?.viewsByDay.length 
    ? Math.max(...data.viewsByDay.map(d => d.count), 1) 
    : 1;

  return (
    <div className="min-h-screen bg-[#030304]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.03]" 
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', left: '10%', top: '20%' }} 
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/30 bg-[#030304]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-800">|</span>
            <h1 className="text-sm font-light text-zinc-400">Analytics</h1>
          </div>
          
          {/* Range selector */}
          <div className="flex gap-2">
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${
                  range === r 
                    ? "bg-zinc-800 text-zinc-300" 
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Total Views</p>
                <p className="text-3xl font-extralight text-zinc-200">{data.overview.totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Unique Visitors</p>
                <p className="text-3xl font-extralight text-zinc-200">{data.overview.uniqueVisitors.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Avg. Read Progress</p>
                <p className="text-3xl font-extralight text-zinc-200">{data.overview.avgReadProgress}%</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Avg. Time on Page</p>
                <p className="text-3xl font-extralight text-zinc-200">{formatTime(data.overview.avgTimeOnPage)}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Reflections</p>
                <p className="text-3xl font-extralight text-emerald-400">{data.overview.totalReflections}</p>
              </div>
            </div>

            {/* Views Chart */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-sm font-light text-zinc-400 mb-6">Views Over Time</h2>
              <div className="h-48 flex items-end gap-1">
                {data.viewsByDay.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600/60 to-indigo-400/40 rounded-t transition-all hover:from-indigo-500/70 hover:to-indigo-300/50"
                      style={{ height: `${(day.count / maxViews) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                      title={`${day.count} views`}
                    />
                    <span className="text-[9px] text-zinc-600">{formatDate(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Writings */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-sm font-light text-zinc-400 mb-4">Top Writings</h2>
                <div className="space-y-3">
                  {data.topWritings.slice(0, 5).map((writing, i) => (
                    <div key={writing.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-600 w-4">{i + 1}.</span>
                        <Link 
                          href={`/reading/${writing.slug}`}
                          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors truncate max-w-[200px]"
                        >
                          {writing.title}
                        </Link>
                      </div>
                      <span className="text-xs text-zinc-600">{writing.viewCount} views</span>
                    </div>
                  ))}
                  {data.topWritings.length === 0 && (
                    <p className="text-xs text-zinc-600">No data yet</p>
                  )}
                </div>
              </div>

              {/* Top Referrers */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-sm font-light text-zinc-400 mb-4">Top Referrers</h2>
                <div className="space-y-3">
                  {data.topReferrers.slice(0, 5).map((ref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400 truncate max-w-[200px]">
                        {ref.referrer === "Direct" ? "Direct / None" : new URL(ref.referrer).hostname}
                      </span>
                      <span className="text-xs text-zinc-600">{ref.count} visits</span>
                    </div>
                  ))}
                  {data.topReferrers.length === 0 && (
                    <p className="text-xs text-zinc-600">No referrer data yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Reflections */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-sm font-light text-zinc-400 mb-4">Recent Reflections</h2>
              <div className="space-y-4">
                {data.recentReflections.map((reflection) => (
                  <div key={reflection.id} className="border-l-2 border-emerald-600/30 pl-4">
                    <p className="text-sm text-zinc-300 mb-2 line-clamp-2">{reflection.content}</p>
                    <div className="flex items-center gap-3">
                      {reflection.mood && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                          {reflection.mood}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-600">
                        {new Date(reflection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {data.recentReflections.length === 0 && (
                  <p className="text-xs text-zinc-600">No reflections yet. Readers can leave reflections after reading.</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-sm font-light text-zinc-400 mb-4">Recent Activity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-zinc-600">
                      <th className="pb-3 font-normal">Page</th>
                      <th className="pb-3 font-normal">Progress</th>
                      <th className="pb-3 font-normal">Time</th>
                      <th className="pb-3 font-normal">When</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-400">
                    {data.recentViews.map((view) => (
                      <tr key={view.id} className="border-t border-zinc-800/30">
                        <td className="py-2 truncate max-w-[200px]">{view.path}</td>
                        <td className="py-2">
                          {view.readProgress !== null && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500/60 rounded-full"
                                  style={{ width: `${view.readProgress}%` }}
                                />
                              </div>
                              <span className="text-zinc-600">{view.readProgress}%</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-zinc-600">
                          {view.timeOnPage ? formatTime(view.timeOnPage) : "-"}
                        </td>
                        <td className="py-2 text-zinc-600">
                          {new Date(view.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600">Failed to load analytics</p>
          </div>
        )}
      </main>
    </div>
  );
}

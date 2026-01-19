"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        window.location.href = "/admin";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Ambient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(2,2,3,0.8) 70%, rgba(2,2,3,0.95) 100%)" 
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block">
            <span className="text-[10px] font-extralight tracking-[0.4em] text-zinc-600 uppercase hover:text-zinc-500 transition-colors">
              Afterstill
            </span>
          </Link>
          <h1 className="mt-8 text-2xl font-extralight tracking-wide text-zinc-300" style={{ fontFamily: "var(--font-cormorant), serif" }}>
            Enter the Archive
          </h1>
          <p className="mt-3 text-xs text-zinc-600 tracking-wider">
            Admin access only
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700/70 focus:bg-zinc-900/70 transition-all duration-300 text-sm tracking-wide"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700/70 focus:bg-zinc-900/70 transition-all duration-300 text-sm tracking-wide"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-950/30 border border-red-900/30 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3 px-4 bg-zinc-800/50 border border-zinc-700/40 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 text-sm tracking-wider"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Entering...
              </span>
            ) : (
              "Enter"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-zinc-700 tracking-wider">
            Protected archive access
          </p>
        </div>
      </div>
    </div>
  );
}

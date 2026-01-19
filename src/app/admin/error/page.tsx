import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Ambient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(2,2,3,0.8) 70%, rgba(2,2,3,0.95) 100%)" 
        }}
      />

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-red-900/30 bg-red-950/20">
            <svg className="w-7 h-7 text-red-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-xl font-extralight tracking-wide text-zinc-300 mb-4" style={{ fontFamily: "var(--font-cormorant), serif" }}>
          Access Denied
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          Unable to authenticate. The link may have expired, or you may not have permission to access the archive.
        </p>

        {/* Back link */}
        <Link 
          href="/admin/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-xs text-zinc-500 hover:text-zinc-400 hover:border-zinc-700/50 transition-all tracking-wider"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function VerifyPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-zinc-800/50 bg-zinc-900/30">
            <svg className="w-7 h-7 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-xl font-extralight tracking-wide text-zinc-300 mb-4" style={{ fontFamily: "var(--font-cormorant), serif" }}>
          Check your email
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          A magic link has been sent to your inbox. Click the link to access the archive.
        </p>

        {/* Note */}
        <div className="px-4 py-3 bg-zinc-900/30 border border-zinc-800/30 rounded-lg mb-8">
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            The link will expire in 24 hours. If you don&apos;t see the email, check your spam folder.
          </p>
        </div>

        {/* Back link */}
        <Link 
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-500 transition-colors tracking-wider"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to login
        </Link>
      </div>
    </div>
  );
}

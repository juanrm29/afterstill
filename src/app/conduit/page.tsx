"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OraclePanel } from "@/components/oracle-panel";
import { ConduitWand } from "@/components/conduit-wand";

// Loading fallback
function ConduitLoading() {
  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <div className="w-8 h-8 border-t border-white/40 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-white/50" style={{ fontFamily: "serif" }}>
          The oracle awakens...
        </p>
      </div>
    </div>
  );
}

// Inner component that uses searchParams
function ConduitContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Detect if this is a mobile device (wand mode)
    setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
  }, []);
  
  // If room code is provided and mobile, show wand interface
  if (roomCode && isMobile) {
    return <ConduitWand roomCode={roomCode} />;
  }
  
  // Otherwise show Oracle panel (desktop altar)
  return <OraclePanel />;
}

export default function ConduitPage() {
  return (
    <Suspense fallback={<ConduitLoading />}>
      <ConduitContent />
    </Suspense>
  );
}

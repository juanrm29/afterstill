"use client";

import { Suspense } from "react";
import { OraclePanel } from "@/components/oracle-panel";

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

export default function ConduitPage() {
  return (
    <Suspense fallback={<ConduitLoading />}>
      <OraclePanel />
    </Suspense>
  );
}

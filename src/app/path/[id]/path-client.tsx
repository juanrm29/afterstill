"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { buildAtlasModel } from "@/lib/analysis";
import type { Writing } from "@/types/writing";

type PathClientProps = {
  pathId: string;
};

export default function PathClient({ pathId }: PathClientProps) {
  const [writings, setWritings] = useState<Writing[]>([]);

  // Fetch writings from database
  useEffect(() => {
    fetch("/api/writings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWritings(data);
        }
      })
      .catch(console.error);
  }, []);

  const atlas = useMemo(() => buildAtlasModel(writings), [writings]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-12 px-8 pb-32 pt-12 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.3em] text-muted/60">
          <Link href="/" className="text-[11px] text-muted/60 hover:text-foreground transition-colors duration-500">
            Afterstill
          </Link>
          <span>Reading Path</span>
        </header>

        <section className="rounded-3xl border border-foreground/[0.06] bg-foreground/[0.015] p-10">
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-light tracking-[-0.02em] text-foreground">Path / {pathId}</h1>
          <p className="mt-4 text-[14px] text-muted/60 leading-[1.9]">
            Jalur baca yang dipersonalisasi dari atlas literasi.
          </p>
          <div className="mt-10 space-y-4">
            {atlas.path.map((item, index) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-xl border border-foreground/[0.06] bg-background/40 px-6 py-5 backdrop-blur-sm hover:border-foreground/[0.12] transition-colors duration-500"
              >
                <div>
                  <p className="text-[15px] text-foreground/90">{item.title}</p>
                  <p className="mt-1 text-[10px] text-muted/40 tracking-wide">step {index + 1}</p>
                </div>
                <Link
                  href={`/reading/${item.id}`}
                  className="text-[10px] uppercase tracking-[0.3em] text-muted/40 group-hover:text-foreground/70 transition-colors duration-500 hover-line"
                >
                  open
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

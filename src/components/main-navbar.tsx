"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NavbarProps {
  siteName?: string;
}

export function MainNavbar({ siteName = "Afterstill" }: Readonly<NavbarProps>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [weekDays, setWeekDays] = useState<{ day: string; date: number; isToday: boolean }[]>([]);

  useEffect(() => {
    setIsLoaded(true);
    
    // Generate week days
    const today = new Date();
    const currentDay = today.getDay();
    const days: { day: string; date: number; isToday: boolean }[] = [];
    const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    
    for (let i = 0; i < 7; i++) {
      const diff = i - currentDay;
      const date = new Date(today);
      date.setDate(today.getDate() + diff);
      days.push({
        day: dayNames[i],
        date: date.getDate(),
        isToday: i === currentDay,
      });
    }
    setWeekDays(days);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-8 md:px-12 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Logo */}
        <Link 
          href="/"
          className={`text-[11px] font-extralight tracking-[0.3em] text-zinc-500 hover:text-zinc-400 uppercase transition-colors duration-300 ${isLoaded ? "animate-fade-in" : "opacity-0"}`}
        >
          {siteName}
        </Link>
        
        {/* Compact Calendar in Center */}
        <div className={`hidden sm:flex items-center gap-1 ${isLoaded ? "animate-fade-in" : "opacity-0"}`}>
          {weekDays.map((day) => (
            <div
              key={day.day}
              className={`flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-300 ${day.isToday ? "bg-zinc-800/40" : ""}`}
            >
              <span className={`text-[8px] font-medium tracking-wider uppercase ${day.isToday ? "text-zinc-400" : "text-zinc-700"}`}>
                {day.day}
              </span>
              <span className={`text-xs font-extralight ${day.isToday ? "text-zinc-300" : "text-zinc-600"}`}>
                {day.date}
              </span>
            </div>
          ))}
        </div>
        
        {/* Navigation */}
        <nav className={`flex items-center gap-6 ${isLoaded ? "animate-fade-in" : "opacity-0"}`}>
          <Link
            href="/fragment"
            className="text-[11px] tracking-[0.2em] uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-500 font-extralight"
          >
            Fragments
          </Link>
          <Link
            href="/about"
            className="text-[11px] tracking-[0.2em] uppercase text-zinc-500 hover:text-zinc-300 transition-colors duration-500 font-extralight"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

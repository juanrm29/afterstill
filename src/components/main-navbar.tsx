"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NavbarAmbientControls } from "@/components/navbar-ambient-controls";
import { NavbarSettingsButton } from "@/components/quick-settings";

interface NavbarProps {
  siteName?: string;
}

interface WeekDay {
  day: string;
  date: number;
  isToday: boolean;
  month: string;
}

// Memoized day item for performance
const DayItem = memo(function DayItem({ day }: { day: WeekDay }) {
  return (
    <div
      className={`flex flex-col items-center px-2 py-1.5 rounded-xl transition-all duration-500 ${
        day.isToday 
          ? "bg-gradient-to-b from-zinc-800/60 to-zinc-800/30 shadow-lg shadow-zinc-900/50" 
          : "hover:bg-zinc-800/20"
      }`}
    >
      <span className={`text-[7px] font-semibold tracking-[0.15em] uppercase ${
        day.isToday ? "text-zinc-300" : "text-zinc-600"
      }`}>
        {day.day}
      </span>
      <span className={`text-sm font-extralight tabular-nums ${
        day.isToday ? "text-zinc-200" : "text-zinc-500"
      }`}>
        {day.date}
      </span>
    </div>
  );
});

// Mobile menu component
const MobileMenu = memo(function MobileMenu({ 
  isOpen, 
  onClose,
  siteName 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  siteName: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-72 z-50 bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/50 md:hidden"
          >
            <div className="flex flex-col h-full p-8">
              <div className="flex justify-between items-center mb-12">
                <span className="text-xs tracking-[0.3em] uppercase text-zinc-400">
                  {siteName}
                </span>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                {[
                  { href: "/fragment", label: "Fragments" },
                  { href: "/archive", label: "Archive" },
                  { href: "/about", label: "About" },
                ].map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block text-xl font-light text-zinc-300 hover:text-white transition-colors py-2 border-b border-zinc-800/50"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              {/* Controls in Mobile */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 pt-6 border-t border-zinc-800/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Ambient</span>
                  <NavbarAmbientControls />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Settings</span>
                  <NavbarSettingsButton />
                </div>
              </motion.div>
              
              <div className="mt-auto pt-8 border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-600 tracking-wider">
                  Words for the quiet hours
                </p>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
});

export function MainNavbar({ siteName = "Afterstill" }: Readonly<NavbarProps>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  // Handle scroll with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    
    // Generate week days
    const today = new Date();
    const currentDay = today.getDay();
    const days: WeekDay[] = [];
    const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    
    for (let i = 0; i < 7; i++) {
      const diff = i - currentDay;
      const date = new Date(today);
      date.setDate(today.getDate() + diff);
      days.push({
        day: dayNames[i],
        date: date.getDate(),
        isToday: i === currentDay,
        month: monthNames[date.getMonth()],
      });
    }
    setWeekDays(days);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  // Memoize calendar for today's date
  const todayInfo = useMemo(() => {
    const today = weekDays.find(d => d.isToday);
    return today ? `${today.month} ${today.date}` : "";
  }, [weekDays]);

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 transition-all duration-500 ${
          isScrolled 
            ? "bg-zinc-950/80 backdrop-blur-xl" 
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo with enhanced animation */}
          <Link 
            href="/"
            className={`group relative flex items-center gap-3 ${
              isLoaded ? "animate-fade-in" : "opacity-0"
            }`}
          >
            {/* Ambient glow on hover */}
            <div className="absolute -inset-4 rounded-full bg-zinc-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
            
            <span className="relative text-[11px] md:text-xs font-light tracking-[0.25em] text-zinc-400 group-hover:text-zinc-200 uppercase transition-colors duration-500">
              {siteName}
            </span>
          </Link>
          
          {/* Enhanced Compact Calendar in Center - Desktop only */}
          <div className={`hidden lg:flex items-center gap-0.5 ${
            isLoaded ? "animate-fade-in" : "opacity-0"
          }`}>
            {weekDays.map((day) => (
              <DayItem key={day.day} day={day} />
            ))}
          </div>

          {/* Mobile date badge */}
          <div className={`hidden sm:flex lg:hidden items-center gap-2 ${
            isLoaded ? "animate-fade-in" : "opacity-0"
          }`}>
            <div className="px-3 py-1.5 rounded-full bg-zinc-800/40 border border-zinc-700/30">
              <span className="text-[10px] tracking-wider text-zinc-400 font-medium">
                {todayInfo}
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-6 ${
            isLoaded ? "animate-fade-in" : "opacity-0"
          }`}>
            {[
              { href: "/fragment", label: "Fragments" },
              { href: "/archive", label: "Archive" },
              { href: "/about", label: "About" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative text-[11px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-200 transition-colors duration-500 font-light py-1"
              >
                {item.label}
                {/* Animated underline */}
                <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Link>
            ))}
            
            {/* Controls */}
            <div className="ml-2 pl-4 border-l border-zinc-800/50 flex items-center gap-2">
              <NavbarAmbientControls />
              <NavbarSettingsButton />
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={openMobileMenu}
            className={`md:hidden p-2 -mr-2 rounded-lg hover:bg-zinc-800/50 transition-colors ${
              isLoaded ? "animate-fade-in" : "opacity-0"
            }`}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu} 
        siteName={siteName}
      />
    </>
  );
}

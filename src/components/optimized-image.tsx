"use client";

import { useState, useEffect, useRef, memo, ImgHTMLAttributes } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui-helpers";

// Optimized Image with blur placeholder and loading animation
interface OptimizedImageProps extends Omit<NextImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: string;
  className?: string;
  containerClassName?: string;
  showLoadingState?: boolean;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback = "/images/placeholder.png",
  aspectRatio,
  className = "",
  containerClassName = "",
  showLoadingState = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div 
      className={cn("relative overflow-hidden", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Loading skeleton */}
      <AnimatePresence>
        {isLoading && showLoadingState && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-zinc-900 animate-pulse"
          >
            <div className="absolute inset-0 shimmer-overlay" />
          </motion.div>
        )}
      </AnimatePresence>

      <NextImage
        src={error ? fallback : src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        className={cn(
          "transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      />
    </div>
  );
});

// Lazy loaded image with intersection observer
interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  className?: string;
}

export function LazyImage({
  src,
  alt,
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=",
  threshold = 0.1,
  className = "",
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "100px" }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder */}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        onLoad={() => isInView && setIsLoaded(true)}
        className={cn(
          "transition-all duration-500",
          isLoaded ? "blur-0 scale-100" : "blur-sm scale-105",
          className
        )}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}

// Background image with lazy loading
interface BackgroundImageProps {
  src: string;
  children: React.ReactNode;
  className?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  parallax?: boolean;
}

export function BackgroundImage({
  src,
  children,
  className = "",
  overlayColor = "#000000",
  overlayOpacity = 0.5,
  parallax = false,
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Preload image
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src]);

  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setOffset(scrollPercent * 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-opacity duration-700",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: `url(${src})`,
          transform: parallax ? `translateY(${offset}px)` : undefined,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Avatar with loading state
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
  className?: string;
}

const avatarSizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

export function AvatarImage({
  src,
  alt,
  size = "md",
  fallback,
  className = "",
}: AvatarImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = fallback || alt.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700/50",
        avatarSizes[size],
        className
      )}
    >
      {src && !error ? (
        <>
          {!isLoaded && (
            <span className="absolute inset-0 flex items-center justify-center text-zinc-500 font-medium">
              {initials}
            </span>
          )}
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      ) : (
        <span className="text-zinc-400 font-medium">{initials}</span>
      )}
    </div>
  );
}

// Image gallery with lightbox potential
interface GalleryImageProps {
  images: Array<{ src: string; alt: string; caption?: string }>;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  aspectRatio?: string;
  className?: string;
}

const gapSizes = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

export function ImageGallery({
  images,
  columns = 3,
  gap = "md",
  aspectRatio = "1/1",
  className = "",
}: GalleryImageProps) {
  return (
    <div
      className={cn(`grid grid-cols-${columns}`, gapSizes[gap], className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative overflow-hidden rounded-xl group cursor-pointer"
          style={{ aspectRatio }}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {image.caption && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-sm text-white/90">{image.caption}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

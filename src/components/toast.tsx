"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    message: string, 
    type: Toast["type"] = "info",
    duration: number = 4000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ 
  toasts, 
  onDismiss 
}: { 
  readonly toasts: readonly Toast[]; 
  readonly onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-200 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => onDismiss(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ 
  toast, 
  onDismiss 
}: { 
  readonly toast: Toast; 
  readonly onDismiss: () => void;
}) {
  const iconsByType = {
    info: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
  };

  const colorsByType = {
    info: "text-foreground/60",
    success: "text-emerald-500/80",
    warning: "text-amber-500/80",
    error: "text-rose-500/80",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      onClick={onDismiss}
      className="pointer-events-auto px-4 py-3 rounded-lg border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-xl cursor-pointer hover:border-foreground/20 transition-colors flex items-center gap-3 min-w-50 max-w-80"
    >
      <span className={colorsByType[toast.type]}>
        {iconsByType[toast.type]}
      </span>
      <p className="text-sm text-foreground/70">{toast.message}</p>
    </motion.div>
  );
}

// Standalone toast function (for use outside React tree)
let globalAddToast: ToastContextType["addToast"] | null = null;

export function setGlobalToast(fn: ToastContextType["addToast"]) {
  globalAddToast = fn;
}

export function toast(message: string, type?: Toast["type"], duration?: number) {
  if (globalAddToast) {
    globalAddToast(message, type, duration);
  } else {
    console.warn("Toast system not initialized");
  }
}

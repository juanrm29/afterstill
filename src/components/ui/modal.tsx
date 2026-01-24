"use client";

import { ReactNode, createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui-helpers";

// Modal Context
interface ModalContextType {
  openModal: (id: string, content: ReactNode, options?: ModalOptions) => void;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

interface ModalOptions {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnBackdrop?: boolean;
  showClose?: boolean;
}

interface ModalState {
  id: string;
  content: ReactNode;
  options: ModalOptions;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalState[]>([]);

  const openModal = useCallback(
    (id: string, content: ReactNode, options: ModalOptions = {}) => {
      setModals((prev) => {
        // Don't add if already exists
        if (prev.find((m) => m.id === id)) return prev;
        return [...prev, { id, content, options: { closeOnBackdrop: true, showClose: true, size: "md", ...options } }];
      });
    },
    []
  );

  const closeModal = useCallback((id: string) => {
    setModals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAll }}>
      {children}
      <AnimatePresence>
        {modals.map((modal, index) => (
          <motion.div
            key={modal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ zIndex: 200 + index }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => modal.options.closeOnBackdrop && closeModal(modal.id)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "relative w-full rounded-2xl border border-zinc-800/50",
                "bg-zinc-950/95 backdrop-blur-xl shadow-2xl",
                "overflow-hidden",
                sizeClasses[modal.options.size || "md"]
              )}
            >
              {/* Close button */}
              {modal.options.showClose && (
                <button
                  onClick={() => closeModal(modal.id)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-200"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {modal.content}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

// Standalone Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
  title?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
  showClose = true,
  title,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full rounded-2xl border border-zinc-800/50",
              "bg-zinc-950/95 backdrop-blur-xl shadow-2xl",
              sizeClasses[size]
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between p-6 pb-0">
                {title && (
                  <h2
                    className="text-xl font-medium text-zinc-100"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-full hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-200"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Modal subcomponents for structured content
export function ModalHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-zinc-300", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-6 flex items-center justify-end gap-3", className)}>
      {children}
    </div>
  );
}

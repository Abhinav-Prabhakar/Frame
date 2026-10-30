"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const authEase = [0.16, 1, 0.3, 1] as const;

const navItems = [
  {
    label: "Studio",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    label: "Gallery",
    href: "/gallery",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Editor",
    href: "/editor",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle help shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }

      // Close modal
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }

      // Navigation shortcuts (Alt + 1, 2, 3, 4)
      if (e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          router.push("/");
        } else if (e.key === "2") {
          e.preventDefault();
          router.push("/gallery");
        } else if (e.key === "3") {
          e.preventDefault();
          router.push("/editor");
        } else if (e.key === "4") {
          e.preventDefault();
          router.push("/settings");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <aside className="flex w-full shrink-0 flex-row items-center border-b border-rule bg-paper-2 px-2 md:h-dvh md:w-[248px] md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-0">
      {/* Wordmark */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-2 md:px-4">
        <span
          className="block h-2 w-2 rounded-[2px] bg-accent"
          aria-hidden="true"
        />
        <span className="font-display text-[17px] font-semibold leading-none text-ink">
          Frame
        </span>
      </div>

      {/* Navigation */}
      <nav className="ml-auto flex items-center gap-1 px-1 md:ml-0 md:w-full md:flex-1 md:flex-col md:items-stretch md:gap-0.5 md:px-2 md:py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-10 w-10 items-center justify-center gap-2.5 rounded-lg md:h-9 md:w-full md:justify-start md:px-2.5 ui-transition ${
                isActive
                  ? "bg-paper-3 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-muted hover:bg-paper-3/60 hover:text-ink"
              }`}
            >
              {/* Active marker */}
              {isActive && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 hidden h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent md:block"
                  transition={{ duration: 0.2, ease: authEase }}
                />
              )}

              <span
                className={`flex h-[18px] w-[18px] items-center justify-center ${
                  isActive ? "text-ink-2" : "text-neutral"
                }`}
              >
                {item.icon}
              </span>
              <span className="hidden text-sm font-medium md:inline">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Shortcuts trigger */}
      <div className="hidden px-2 pb-1 md:block">
        <button
          onClick={() => setShowShortcuts(true)}
          className="flex h-9 w-full items-center justify-between rounded-md px-2 text-xs text-muted hover:bg-paper-3/60 hover:text-ink ui-transition"
        >
          <span>Shortcuts</span>
          <kbd className="rounded border border-rule bg-paper-3 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-neutral">
            ⌘ /
          </kbd>
        </button>
      </div>

      {/* Account */}
      <div className="hidden border-t border-rule p-3 md:block">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-rule bg-paper-3 font-mono text-[11px] font-medium text-muted">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-5 text-ink">
              Admin
            </p>
            <p className="font-mono text-[11px] leading-4 text-neutral">Local</p>
          </div>
        </div>
      </div>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </aside>
  );
}

/* ── Shortcuts dialog ─────────────────────────────────────── */

function ShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: authEase }}
            onClick={onClose}
            className="absolute inset-0 bg-paper/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: authEase }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-rule bg-paper-2 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-rule pb-3">
              <h2 className="font-display text-base font-semibold text-ink">
                Keyboard shortcuts
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-neutral hover:bg-paper-3 hover:text-ink ui-transition"
                aria-label="Close dialog"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Groups */}
            <div className="max-h-[min(64vh,560px)] space-y-5 overflow-y-auto pr-1">
              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">Navigation</h3>
                <div className="space-y-0.5">
                  <ShortcutRow keys={["⌥", "1"]} desc="Go to Studio" />
                  <ShortcutRow keys={["⌥", "2"]} desc="Go to Gallery" />
                  <ShortcutRow keys={["⌥", "3"]} desc="Go to Editor" />
                  <ShortcutRow keys={["⌥", "4"]} desc="Go to Settings" />
                </div>
              </div>

              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">Studio</h3>
                <div className="space-y-0.5">
                  <ShortcutRow keys={["⌘", "↵"]} desc="Generate images" />
                  <ShortcutRow keys={["⌥", "P"]} desc="Focus prompt" />
                  <ShortcutRow keys={["⌥", "N"]} desc="Toggle negative prompt" />
                  <ShortcutRow keys={["⌥", "C"]} desc="Cycle canvas preset" />
                  <ShortcutRow keys={["⌥", "Q"]} desc="Cycle quality" />
                  <ShortcutRow keys={["⌥", "S"]} desc="Cycle style" />
                  <ShortcutRow keys={["⌥", "B"]} desc="Focus batch slider" />
                </div>
              </div>

              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">General</h3>
                <div className="space-y-0.5">
                  <ShortcutRow keys={["⌘", "/"]} desc="Toggle shortcuts" />
                  <ShortcutRow keys={["Esc"]} desc="Close dialog" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex h-8 items-center justify-between gap-4">
      <span className="text-[13px] text-muted">{desc}</span>
      <div className="flex shrink-0 gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[20px] rounded border border-rule bg-paper-3 px-1.5 py-0.5 text-center font-mono text-[11px] leading-4 text-ink-2"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

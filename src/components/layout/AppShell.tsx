"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Ear, FlaskConical, Home, Map, Settings, Shapes, Dumbbell, Minimize2, Loader2, NotebookPen } from "lucide-react";
import { useUI } from "@/store/ui";
import { useSettings } from "@/store/settings";
import { useProgress } from "@/store/progress";
import { useT } from "@/i18n/useT";
import { levelFromXp } from "@/lib/progress/xp";
import { Cat } from "@/components/mascot/Cat";
import { Toasts } from "./Toasts";
import { audio } from "@/lib/audio/engine";
import { useAudioState } from "@/hooks/useAudio";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/i18n/dict";

const NAV: Array<{ href: string; key: DictKey; short?: string; mobile?: boolean; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/", key: "nav_dashboard", mobile: true, icon: Home },
  { href: "/learn", key: "nav_learn", mobile: true, icon: Map },
  { href: "/practice", key: "nav_practice", mobile: true, icon: Dumbbell },
  { href: "/ear-training", key: "nav_ear", short: "Ear", mobile: true, icon: Ear },
  { href: "/playground", key: "nav_playground", short: "Play", mobile: true, icon: Shapes },
  { href: "/lab", key: "nav_lab", short: "Lab", mobile: true, icon: FlaskConical },
  { href: "/reflect", key: "nav_reflect", icon: NotebookPen },
  { href: "/progress", key: "nav_progress", icon: BarChart3 },
  { href: "/settings", key: "nav_settings", icon: Settings },
];

function AudioPill() {
  const { status } = useAudioState();
  const { t } = useT();
  if (status === "ready")
    return (
      <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="led led-on" /> <span className="hidden lg:inline">{t("soundOn")}</span>
      </span>
    );
  return (
    <button
      onClick={() => {
        audio.unlockFromGesture();
        void audio.init();
      }}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/60 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-primary"
    >
      {status === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : <span className="led led-orange blink" />}
      <span className="hidden sm:inline">{status === "error" ? t("audioError") : status === "loading" ? t("loadingAudio") : t("tapForSound")}</span>
      <span className="sm:hidden">{status === "loading" ? "…" : "Tap for sound"}</span>
    </button>
  );
}

function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className={cn("font-extrabold uppercase leading-none tracking-tight", small ? "text-sm" : "text-lg")} style={{ fontStretch: "125%" }}>
      Harmonic<span className="text-primary">Cat</span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useUI((s) => s.hydrated);
  const focus = useSettings((s) => s.focusMode);
  const setSettings = useSettings((s) => s.set);
  const xp = useProgress((s) => s.xp);
  const pathname = usePathname();
  const { t, lang } = useT();
  const lvl = levelFromXp(xp);

  // Stop audio when navigating between pages
  useEffect(() => {
    audio.stop();
  }, [pathname]);

  // Shift+F toggles focus mode anywhere
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        setSettings({ focusMode: !useSettings.getState().focusMode });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setSettings]);

  // The login page renders on its own, without navigation
  if (pathname === "/login") return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3" aria-busy="true">
        <Cat mood="sleep" size={110} />
        <p className="text-sm font-bold text-muted-foreground">Waking up the cat…</p>
      </div>
    );
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const xpReadout = String(xp).padStart(4, "0");

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      {!focus && (
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-[#171512] md:flex">
          <Link href="/" className="flex items-center gap-2 border-b border-border px-4 py-4">
            <Cat size={40} />
            <Wordmark />
          </Link>
          <nav className="flex flex-col py-3" aria-label="Main">
            {NAV.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "group flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
                  isActive(n.href) && "border-primary bg-secondary/60 text-foreground",
                )}
              >
                <span className={cn("w-5 font-mono text-[10px] text-muted-foreground/60", isActive(n.href) && "text-primary")}>{String(i + 1).padStart(2, "0")}</span>
                <n.icon className={cn("size-4", isActive(n.href) && "text-primary")} />
                {t(n.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-border p-4">
            <div className="flex items-baseline justify-between">
              <span className="label">
                {t("level")} {String(lvl.level).padStart(2, "0")}
              </span>
              <span className="readout text-sm text-lime">{xpReadout} XP</span>
            </div>
            <div className="mt-2">
              <div className="relative h-2.5 overflow-hidden rounded-[2px] bg-[#0f0e0c] ring-1 ring-border">
                <div className="h-full bg-lime" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
                <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 7px, #0f0e0c 7px 9px)" }} />
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
          <Link href="/" className={cn("flex items-center gap-1.5", !focus && "md:hidden")}>
            <Cat size={30} />
            <span className="hidden sm:inline">
              <Wordmark small />
            </span>
          </Link>
          <div className="flex-1" />
          <AudioPill />
          <span className="whitespace-nowrap rounded-md border border-border bg-[#0f0e0c] px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="hidden sm:inline">Lv {String(lvl.level).padStart(2, "0")} · </span>
            <span className="text-lime">{xpReadout} XP</span>
          </span>
          {focus && (
            <button onClick={() => setSettings({ focusMode: false })} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider" title="Shift+F">
              <Minimize2 className="size-3.5" /> {t("exitFocus")}
            </button>
          )}
        </header>

        <main className={cn("mx-auto w-full flex-1 px-4 py-6 pb-28 sm:py-8 md:pb-12", focus ? "max-w-3xl" : "max-w-6xl")}>
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom nav (mobile) */}
        {!focus && (
          <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-[#171512]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
            {NAV.filter((n) => n.mobile).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn("flex min-w-0 flex-col items-center gap-1 border-t-2 border-transparent py-2 font-mono text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground", isActive(n.href) && "border-primary text-foreground")}
              >
                <n.icon className={cn("size-[18px]", isActive(n.href) && "text-primary")} />
                <span className="w-full truncate text-center">{lang === "en" && n.short ? n.short : t(n.key).split(" ")[0]}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
      <Toasts />
    </div>
  );
}

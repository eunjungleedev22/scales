"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Ear, FlaskConical, Home, Map, Settings, Shapes, Dumbbell, Minimize2, Volume2, VolumeX, Loader2 } from "lucide-react";
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

const NAV: Array<{ href: string; key: DictKey; short?: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/", key: "nav_dashboard", icon: Home },
  { href: "/learn", key: "nav_learn", icon: Map },
  { href: "/practice", key: "nav_practice", icon: Dumbbell },
  { href: "/ear-training", key: "nav_ear", short: "Ear", icon: Ear },
  { href: "/playground", key: "nav_playground", short: "Play", icon: Shapes },
  { href: "/lab", key: "nav_lab", short: "Lab", icon: FlaskConical },
  { href: "/progress", key: "nav_progress", icon: BarChart3 },
  { href: "/settings", key: "nav_settings", icon: Settings },
];

function AudioPill() {
  const { status } = useAudioState();
  const { t } = useT();
  if (status === "ready") return <span className="flex items-center gap-1 text-xs text-lime"><Volume2 className="size-3.5" /> <span className="hidden lg:inline">{t("soundOn")}</span></span>;
  return (
    <button onClick={() => { audio.unlockFromGesture(); void audio.init(); }} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-pink/20 px-3 py-1 text-xs font-bold text-pink">
      {status === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : <VolumeX className="size-3.5" />}
      <span className="hidden sm:inline">{status === "error" ? t("audioError") : status === "loading" ? t("loadingAudio") : t("tapForSound")}</span>
      <span className="sm:hidden">{status === "loading" ? "…" : "Tap for sound"}</span>
    </button>
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

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      {!focus && (
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-border p-4 md:flex">
          <Link href="/" className="mb-4 flex items-center gap-2 px-2">
            <Cat size={44} />
            <span className="text-xl font-black tracking-tight">
              Harmonic<span className="text-lime">Cat</span>
            </span>
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isActive(n.href) && "bg-primary/15 text-primary ring-2 ring-primary/40",
                )}
              >
                <n.icon className="size-5" />
                {t(n.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-secondary p-3 text-xs">
            <div className="flex justify-between font-bold">
              <span>
                {t("level")} {lvl.level}
              </span>
              <span className="text-lime">{xp} XP</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-lime" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
            </div>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur">
          <Link href="/" className={cn("flex items-center gap-1 font-black", !focus && "md:hidden")}>
            <Cat size={32} />
            <span className="hidden sm:inline">
              Harmonic<span className="text-lime">Cat</span>
            </span>
          </Link>
          <div className="flex-1" />
          <AudioPill />
          <span className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs font-bold">
            Lv {lvl.level} · <span className="text-lime">{xp} XP</span>
          </span>
          {focus && (
            <button onClick={() => setSettings({ focusMode: false })} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold" title="Shift+F">
              <Minimize2 className="size-3.5" /> {t("exitFocus")}
            </button>
          )}
        </header>

        <main className={cn("mx-auto w-full flex-1 px-4 py-6 pb-28 md:pb-10", focus ? "max-w-3xl" : "max-w-6xl")}>
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom nav (mobile) */}
        {!focus && (
          <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
            {NAV.filter((n) => !["/progress", "/settings"].includes(n.href)).map((n) => (
              <Link key={n.href} href={n.href} className={cn("flex min-w-0 flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-muted-foreground", isActive(n.href) && "text-lime")}>
                <n.icon className="size-5" />
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

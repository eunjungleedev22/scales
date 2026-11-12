"use client";
import { motion } from "framer-motion";
import { useSettings } from "@/store/settings";

export type CatMood = "idle" | "happy" | "think" | "oops" | "party" | "sleep";

/** Original black-cat mascot ("Midi") drawn in SVG. */
export function Cat({ mood = "idle", size = 96, className }: { mood?: CatMood; size?: number; className?: string }) {
  const reduced = useSettings((s) => s.reducedMotion);
  const eyesClosed = mood === "happy" || mood === "party" || mood === "sleep";
  const anim = reduced
    ? {}
    : mood === "party"
      ? { y: [0, -10, 0], rotate: [0, -6, 6, 0] }
      : mood === "oops"
        ? { rotate: [0, -4, 4, 0] }
        : { y: [0, -3, 0] };
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`Midi the cat (${mood})`}
      animate={anim}
      transition={{ duration: mood === "party" ? 0.6 : 2.4, repeat: mood === "party" ? 2 : Infinity, ease: "easeInOut" }}
    >
      {/* tail */}
      <motion.path
        d="M92 98 C 112 96, 116 76, 104 66"
        stroke="#0d0c0b"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        animate={reduced ? {} : { d: ["M92 98 C 112 96, 116 76, 104 66", "M92 98 C 114 92, 108 70, 112 62", "M92 98 C 112 96, 116 76, 104 66"] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* body */}
      <ellipse cx="60" cy="92" rx="34" ry="22" fill="#0d0c0b" />
      {/* head */}
      <path d="M26 58 L22 22 L46 38 Q60 33 74 38 L98 22 L94 58 Q94 84 60 84 Q26 84 26 58 Z" fill="#0d0c0b" />
      {/* inner ears */}
      <path d="M28 30 L30 46 L40 39 Z" fill="#ff5c1a" opacity="0.8" />
      <path d="M92 30 L90 46 L80 39 Z" fill="#ff5c1a" opacity="0.8" />
      {/* headphones band */}
      <path d="M24 52 Q60 8 96 52" stroke="#ff5c1a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="16" y="50" width="12" height="20" rx="5" fill="#ff5c1a" />
      <rect x="92" y="50" width="12" height="20" rx="5" fill="#ff5c1a" />
      {/* eyes */}
      {eyesClosed ? (
        <>
          <path d="M40 60 Q46 54 52 60" stroke="#f5c542" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M68 60 Q74 54 80 60" stroke="#f5c542" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="46" cy="60" rx="7" ry={mood === "think" ? 5 : 8} fill="#f5c542" />
          <ellipse cx="74" cy="60" rx="7" ry={mood === "think" ? 5 : 8} fill="#f5c542" />
          <ellipse cx={mood === "think" ? 48 : 46} cy="60" rx="2.4" ry="6" fill="#0d0c0b" />
          <ellipse cx={mood === "think" ? 76 : 74} cy="60" rx="2.4" ry="6" fill="#0d0c0b" />
          <circle cx="44" cy="56" r="1.6" fill="white" />
          <circle cx="72" cy="56" r="1.6" fill="white" />
        </>
      )}
      {/* nose & mouth */}
      <path d="M57 69 L63 69 L60 72 Z" fill="#ff5c1a" />
      {mood === "oops" ? (
        <path d="M54 77 Q60 73 66 77" stroke="#ece4d2" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M60 72 Q56 77 52 74 M60 72 Q64 77 68 74" stroke="#ece4d2" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* whiskers */}
      <path d="M36 70 L20 68 M36 74 L22 76 M84 70 L100 68 M84 74 L98 76" stroke="#9a917f" strokeWidth="1.5" strokeLinecap="round" />
      {mood === "sleep" && (
        <text x="92" y="24" fill="#9a917f" fontSize="14" fontWeight="bold">
          z
        </text>
      )}
      {mood === "party" && (
        <>
          <circle cx="14" cy="18" r="3" fill="#f5c542" />
          <circle cx="108" cy="14" r="3" fill="#ff5c1a" />
          <circle cx="100" cy="36" r="2" fill="#ff5c1a" />
        </>
      )}
    </motion.svg>
  );
}

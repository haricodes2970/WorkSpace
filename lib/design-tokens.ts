/**
 * Design tokens as JS constants.
 * Source of truth for values used outside CSS (e.g. Framer Motion, canvas, tests).
 * NEVER import backend code here.
 */

export const colors = {
  bg:           "#0B0F14",
  panel:        "#111827",
  card:         "#161F2B",
  cardHover:    "#1A2536",
  border:       "#263041",
  borderSubtle: "#1C2535",
  borderStrong: "#374151",

  primary:       "#7C3AED",
  primaryHover:  "#6D28D9",
  primarySubtle: "#1E1433",
  accent:        "#06B6D4",
  accentHover:   "#0891B2",
  accentSubtle:  "#0B2230",

  textPrimary:   "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted:     "#4B5563",
  textDisabled:  "#374151",

  success:       "#10B981",
  successSubtle: "#0B2420",
  warning:       "#F59E0B",
  warningSubtle: "#1F1700",
  danger:        "#EF4444",
  dangerSubtle:  "#2A0F0F",
} as const;

export const duration = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
} as const;

export const motionPresets = {
  fadeUp: {
    initial:    { opacity: 0, y: 4 },
    animate:    { opacity: 1, y: 0 },
    exit:       { opacity: 0, y: 4 },
    transition: { duration: duration.base, ease: ease.out },
  },
  fadeIn: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: { duration: duration.fast },
  },
  slideLeft: {
    initial:    { opacity: 0, x: -8 },
    animate:    { opacity: 1, x: 0 },
    exit:       { opacity: 0, x: -8 },
    transition: { duration: duration.base, ease: ease.out },
  },
  slideRight: {
    initial:    { opacity: 0, x: 8 },
    animate:    { opacity: 1, x: 0 },
    exit:       { opacity: 0, x: 8 },
    transition: { duration: duration.base, ease: ease.out },
  },
  scaleIn: {
    initial:    { opacity: 0, scale: 0.97 },
    animate:    { opacity: 1, scale: 1 },
    exit:       { opacity: 0, scale: 0.97 },
    transition: { duration: duration.fast, ease: ease.out },
  },
} as const;

// ─── Density tokens ────────────────────────────────────────────────────────────
// Spacing multipliers for compact / comfortable / spacious density modes

export const density = {
  compact:     { padding: "0.375rem", gap: "0.25rem", text: "11px", lineHeight: 1.4 },
  comfortable: { padding: "0.5rem",   gap: "0.375rem", text: "13px", lineHeight: 1.5 },
  spacious:    { padding: "0.75rem",  gap: "0.5rem",   text: "14px", lineHeight: 1.6 },
} as const;

export type DensityMode = keyof typeof density;

// ─── Z-index scale ─────────────────────────────────────────────────────────────

export const zIndex = {
  sidebar:    10,
  topbar:     20,
  dropdown:   30,
  modal:      40,
  overlay:    50,
  toast:      60,
  diagnostic: 100,
  offline:    200,
} as const;

// ─── Border radius scale ───────────────────────────────────────────────────────

export const radius = {
  sm:   "4px",
  base: "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  full: "9999px",
} as const;

// ─── Shadow scale ──────────────────────────────────────────────────────────────

export const shadow = {
  sm:  "0 1px 2px rgba(0,0,0,0.4)",
  md:  "0 4px 12px rgba(0,0,0,0.5)",
  lg:  "0 8px 32px rgba(0,0,0,0.6)",
  xl:  "0 16px 64px rgba(0,0,0,0.7)",
} as const;

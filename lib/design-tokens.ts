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
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: 4 },
    transition: { duration: duration.base, ease: ease.out },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
    transition: { duration: duration.fast },
  },
  slideLeft: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -8 },
    transition: { duration: duration.base, ease: ease.out },
  },
} as const;

// EastPark Design Tokens — extracted from logo and DESIGN.md
// Single source of truth. Never use raw hex values in components — always import from here.

// ─── Brand Identity ───────────────────────────────────────────────────────────
export const BRAND = {
  gold: '#b8966a', // warm muted gold — primary brand color
  goldDark: '#9e7d52', // pressed / focus ring
  goldLight: '#c9ab84', // dark mode highlight / hover
  goldTint: '#f2e8d8', // selected chip bg, pill highlights (light mode)
  goldText: '#7a5e38', // gold-700 — use for gold text on light backgrounds (WCAG AA)
  ink: '#0d0c0b', // logo near-black — dark mode base
  white: '#ffffff',
} as const;

// ─── Light Mode ───────────────────────────────────────────────────────────────
export const LIGHT = {
  bg: '#faf8f5',
  card: '#ffffff',
  surface: '#faf8f5',
  elevated: '#f2e8d8', // modals, sheets, segment controls — warm tint above card
  primary: '#b8966a',
  primaryDark: '#9e7d52',
  primaryText: '#7a5e38',
  inputBg: '#f2e8d8',
  text: '#1a1714',
  textMuted: '#7a6e62',
  border: '#e4ceae',
  disabled: '#c4b49e',
  divider: '#e4ceae',
  shadow: 'rgba(184, 150, 106, 0.10)',
} as const;

// ─── Dark Mode ────────────────────────────────────────────────────────────────
export const DARK = {
  bg: '#0d0c0b',
  surface: '#171614',
  card: '#221f1c',
  elevated: '#2e2a26',
  border: '#3d3830',
  primary: '#b8966a',
  primaryLight: '#c9ab84',
  text: '#faf8f5',
  textMuted: '#a89880',
  disabled: '#4a4642',
  divider: '#3d3830',
  shadow: 'rgba(0, 0, 0, 0.40)',
} as const;

// ─── Semantic Colors ──────────────────────────────────────────────────────────
export const SEMANTIC = {
  success: '#5A7A52',
  warning: '#C48B2F',
  error: '#B03A2E',
  info: '#4A6B8A',
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  'xs': 4,
  'sm': 8,
  'md': 12,
  'base': 16,
  'lg': 20,
  'xl': 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT = {
  sans: 'Cairo',
  display: 'CormorantGaramond',
} as const;

export const TYPE = {
  display: { fontFamily: FONT.sans, fontWeight: '700' as const, fontSize: 28, lineHeight: 42 },
  title: { fontFamily: FONT.sans, fontWeight: '600' as const, fontSize: 20, lineHeight: 30 },
  bodyLg: { fontFamily: FONT.sans, fontWeight: '500' as const, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: FONT.sans, fontWeight: '400' as const, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: FONT.sans, fontWeight: '500' as const, fontSize: 13, lineHeight: 20 },
  caption: { fontFamily: FONT.sans, fontWeight: '400' as const, fontSize: 12, lineHeight: 18 },
} as const;

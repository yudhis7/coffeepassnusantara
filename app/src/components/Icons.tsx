import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 20, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const IconMap = (p: P) => (
  <svg {...base(p)}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>
);
export const IconQr = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const IconCup = (p: P) => (
  <svg {...base(p)}><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" /><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3" /></svg>
);
export const IconPlug = (p: P) => (
  <svg {...base(p)}><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4" /></svg>
);
export const IconWifi = (p: P) => (
  <svg {...base(p)}><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" /></svg>
);
export const IconQuiet = (p: P) => (
  <svg {...base(p)}><path d="M4 9h4l5-4v14l-5-4H4V9ZM17 9l4 6M21 9l-4 6" /></svg>
);
export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>
);
export const IconLocate = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
);
export const IconStore = (p: P) => (
  <svg {...base(p)}><path d="M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9ZM5 13v7h14v-7M10 20v-4h4v4" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5 12 5 5 9-10" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconBack = (p: P) => (
  <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>
);
export const IconLeaf = (p: P) => (
  <svg {...base(p)}><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15ZM5 19l7-7" /></svg>
);

export const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" rx="16" fill="#3b2a20" />
    <path d="M16 26h26v9a11 11 0 0 1-11 11h-4a11 11 0 0 1-11-11v-9Z" fill="#f6efe6" />
    <path d="M42 29h3a5 5 0 0 1 0 10h-3" stroke="#f6efe6" strokeWidth="3.5" fill="none" />
    <path d="M24 14c-2 3 2 5 0 8M31 14c-2 3 2 5 0 8" stroke="#e0a458" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M22 33h14" stroke="#c47f3c" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

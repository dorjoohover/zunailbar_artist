export const COLOR_HEX = {
  slate: "#94A3B8", // neutral
  stone: "#A8A29E", // neutral
  blue: "#60A5FA", // soft blue
  sky: "#38BDF8", // bright blue
  cyan: "#22D3EE", // bright cyan
  teal: "#2DD4BF", // soft teal
  green: "#4ADE80", // soft green
  lime: "#A3E635", // bright green
  yellow: "#FACC15", // bright yellow
  amber: "#FBBF24", // warm yellow
  orange: "#FB923C", // bright orange
  red: "#F87171", // soft red
  pink: "#F472B6", // soft pink
  purple: "#A78BFA", // soft purple
  fuchsia: "#D946EF", // bright fuchsia
} as const;

export type ColorName = keyof typeof COLOR_HEX;

export const getUserColor = (index: number) => {
  return Object.values(COLOR_HEX)[index];
};
// Нэмэлт сүүдэр сетүүд (1 өнгөнд 3 хувилбар = 60+ item)
const SHADE_SETS = [
  { bg: 500, border: 200, text: 800 },
  // { bg: 400, border: 200, text: 800 },
  // { bg: 500, border: 300, text: 900 },
];

const hash = (s: string) => {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
};

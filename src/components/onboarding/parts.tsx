import { Circle, G, Path } from "react-native-svg";

// Palette matched to the slide 1 artwork (onboarding-1.jpg)
export const art = {
  deep: "#0B5D45", // Outlines, dark leaves
  leaf: "#1F7A57",
  mint: "#A8E6C8",
  mintLight: "#D3F3E2",
  mintMid: "#7FD3AE",
  selected: "#BCF4DB", // Highlight ring
  pants: "#2E8B66",
  hoodie: "#FFF1D6", // Cream hoodie like the slide 1 student
  cream: "#FFF8EC", // Illustration background
  sand: "#F6E9CF", // Soft blob behind the scene
  white: "#FFFFFF",
};

// Shared 512x512 canvas so every slide scales like the square slide 1 image
export const VIEWBOX = "0 0 512 512";
export const STROKE = 4;

type LeafProps = {
  x: number;
  y: number;
  length: number;
  angle: number; // Degrees; 0 points straight up
  fill: string;
  vein?: string;
};

// A simple pointed leaf growing from (x, y)
export function Leaf({ x, y, length: l, angle, fill, vein = art.deep }: LeafProps) {
  const w = l * 0.34;
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path
        d={`M0 0 C${w} ${-l * 0.25} ${w} ${-l * 0.75} 0 ${-l} C${-w} ${-l * 0.75} ${-w} ${-l * 0.25} 0 0 Z`}
        fill={fill}
        stroke={art.deep}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d={`M0 ${-l * 0.05} L0 ${-l * 0.85}`}
        stroke={vein}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </G>
  );
}

// Tiny floating dots like the sparkles in slide 1
export function Sparkles({ points }: { points: [number, number, number][] }) {
  return (
    <G>
      {points.map(([cx, cy, r]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={art.deep} opacity={0.35} />
      ))}
    </G>
  );
}

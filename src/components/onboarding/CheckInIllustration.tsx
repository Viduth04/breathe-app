import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { art, Leaf, Sparkles, STROKE, VIEWBOX } from "./parts";

type Props = { accessibilityLabel?: string };

export const CHECK_IN_DESCRIPTION =
  "Illustration of a phone showing five mood faces from sad to happy, with the happy face selected, surrounded by green leaves";

// Mood 0 (sad) to 4 (happy); the mouth curves from a frown to a wide smile
function Face({ cx, cy, r, mood, fill }: { cx: number; cy: number; r: number; mood: number; fill: string }) {
  const curve = (mood - 2) * r * 0.22;
  const mouthY = cy + r * 0.32;
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} fill={fill} stroke={art.deep} strokeWidth={STROKE * 0.7} />
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.18} r={r * 0.1} fill={art.deep} />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.18} r={r * 0.1} fill={art.deep} />
      <Path
        d={`M${cx - r * 0.38} ${mouthY - curve * 0.3} Q${cx} ${mouthY + curve} ${cx + r * 0.38} ${mouthY - curve * 0.3}`}
        stroke={art.deep}
        strokeWidth={Math.max(2, r * 0.1)}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

const ROW = [190, 223, 256, 289, 322];
const ROW_FILLS = [art.white, art.mintLight, art.mintLight, art.mint, art.mintLight];
const SELECTED = 3;

export default function CheckInIllustration({ accessibilityLabel = CHECK_IN_DESCRIPTION }: Props) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={VIEWBOX}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Rect width={512} height={512} fill={art.cream} />

      {/* Soft background shapes */}
      <Path
        d="M120 190 C110 110 200 70 270 82 C350 96 420 140 410 230 C400 320 360 380 270 390 C170 400 130 300 120 190 Z"
        fill={art.sand}
      />
      <Ellipse cx={256} cy={428} rx={190} ry={30} fill={art.mint} opacity={0.7} />

      {/* Leaves behind the phone */}
      <Leaf x={150} y={420} length={170} angle={-32} fill={art.leaf} vein={art.mint} />
      <Leaf x={140} y={426} length={110} angle={-72} fill={art.mint} />
      <Leaf x={362} y={420} length={150} angle={28} fill={art.mint} />
      <Leaf x={372} y={426} length={95} angle={66} fill={art.leaf} vein={art.mint} />
      <Leaf x={392} y={150} length={60} angle={40} fill={art.mintMid} />

      {/* Phone */}
      <Rect x={156} y={92} width={200} height={328} rx={32} fill={art.white} stroke={art.deep} strokeWidth={STROKE} />
      <Rect x={170} y={116} width={172} height={284} rx={18} fill={art.mintLight} opacity={0.6} />
      <Rect x={232} y={102} width={48} height={6} rx={3} fill={art.deep} opacity={0.5} />

      {/* Placeholder "question" lines */}
      <Rect x={206} y={138} width={100} height={9} rx={4.5} fill={art.deep} opacity={0.25} />
      <Rect x={226} y={155} width={60} height={7} rx={3.5} fill={art.deep} opacity={0.18} />

      {/* Large preview of the selected mood */}
      <Circle cx={256} cy={222} r={52} fill={art.mint} opacity={0.45} />
      <Face cx={256} cy={222} r={40} mood={SELECTED} fill={art.mint} />

      {/* Mood scale, sad to happy, with the selected face ringed */}
      <Circle cx={ROW[SELECTED]} cy={300} r={19} fill={art.selected} stroke={art.deep} strokeWidth={2.5} />
      {ROW.map((cx, mood) => (
        <Face key={cx} cx={cx} cy={300} r={13} mood={mood} fill={ROW_FILLS[mood]} />
      ))}

      {/* Continue button */}
      <Rect x={206} y={340} width={100} height={26} rx={13} fill={art.deep} />

      <Sparkles
        points={[
          [112, 140, 4],
          [96, 170, 2.5],
          [410, 96, 3.5],
          [430, 250, 2.5],
          [86, 300, 3],
        ]}
      />
    </Svg>
  );
}

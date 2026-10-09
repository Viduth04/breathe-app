import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { art, Leaf, Sparkles, STROKE, VIEWBOX } from "./parts";

type Props = { accessibilityLabel?: string };

export const TALK_DESCRIPTION =
  "Illustration of a student and a counsellor sitting facing each other, with a speech bubble holding a heart and a small lock shield for privacy";

type PersonColors = {
  hair: string;
  top: string;
  legs: string;
  longHair?: boolean;
};

const SKIN = art.mintLight;

// A seated figure facing right; mirrored for the counsellor
function Person({ hair, top, legs, longHair }: PersonColors) {
  // Thick limbs: a dark outline stroke under a coloured stroke
  const limb = (d: string, color: string, width: number) => (
    <>
      <Path d={d} stroke={art.deep} strokeWidth={width + 6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
  return (
    <G>
      <Rect x={66} y={366} width={124} height={30} rx={15} fill={art.sand} stroke={art.deep} strokeWidth={3} />
      {longHair ? (
        <Rect x={104} y={214} width={40} height={84} rx={20} fill={hair} stroke={art.deep} strokeWidth={3} />
      ) : null}
      <Rect x={92} y={256} width={76} height={118} rx={34} fill={top} stroke={art.deep} strokeWidth={STROKE * 0.85} />
      {limb("M154 362 L214 354 L218 396", legs, 24)}
      <Ellipse cx={226} cy={402} rx={16} ry={9} fill={art.white} stroke={art.deep} strokeWidth={3} />
      {limb("M140 292 Q150 336 196 340", top, 15)}
      <Circle cx={201} cy={340} r={8} fill={SKIN} stroke={art.deep} strokeWidth={2.5} />
      <Circle cx={134} cy={218} r={33} fill={hair} stroke={art.deep} strokeWidth={3} />
      <Circle cx={143} cy={227} r={28} fill={SKIN} stroke={art.deep} strokeWidth={3} />
      <Path d="M126 202 C140 188 160 192 170 210" stroke={art.deep} strokeWidth={3} fill={hair} />
      <Circle cx={156} cy={224} r={3} fill={art.deep} />
      <Path d="M150 238 Q157 243 163 236" stroke={art.deep} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </G>
  );
}

export default function TalkIllustration({ accessibilityLabel = TALK_DESCRIPTION }: Props) {
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
        d="M70 260 C60 170 140 120 230 130 C300 138 330 100 390 120 C460 144 470 240 440 320 C410 390 320 400 250 396 C150 392 80 350 70 260 Z"
        fill={art.sand}
      />
      <Ellipse cx={256} cy={412} rx={220} ry={32} fill={art.mint} opacity={0.7} />

      {/* Plants at the edges */}
      <Leaf x={52} y={404} length={130} angle={-14} fill={art.leaf} vein={art.mint} />
      <Leaf x={44} y={408} length={90} angle={-52} fill={art.mint} />
      <Leaf x={460} y={404} length={130} angle={16} fill={art.mint} />
      <Leaf x={468} y={408} length={85} angle={56} fill={art.leaf} vein={art.mint} />

      {/* Student (left) and counsellor (right, mirrored) */}
      <Person hair={art.mint} top={art.hoodie} legs={art.pants} longHair />
      <G transform="translate(512 0) scale(-1 1)">
        <Person hair={art.deep} top={art.mintMid} legs={art.sand} />
      </G>

      {/* Speech bubble with a heart */}
      <Rect x={206} y={104} width={100} height={78} rx={30} fill={art.white} stroke={art.deep} strokeWidth={STROKE} />
      <Path d="M240 176 L228 208 L266 176 Z" fill={art.white} />
      <Path
        d="M240 182 L228 208 L262 182"
        stroke={art.deep}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M256 164 C236 150 230 132 242 125 C249 121 255 125 256 131 C257 125 263 121 270 125 C282 132 276 150 256 164 Z"
        fill={art.pants}
        stroke={art.deep}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Privacy shield with a lock */}
      <Path
        d="M398 70 L428 81 V104 C428 124 415 135 398 142 C381 135 368 124 368 104 V81 Z"
        fill={art.selected}
        stroke={art.deep}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M391 104 V97 C391 88 405 88 405 97 V104"
        stroke={art.deep}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x={386} y={103} width={24} height={19} rx={4} fill={art.deep} />
      <Circle cx={398} cy={111} r={3} fill={art.cream} />

      <Sparkles
        points={[
          [120, 110, 4],
          [96, 140, 2.5],
          [330, 80, 3],
          [452, 180, 3.5],
          [64, 220, 2.5],
        ]}
      />
    </Svg>
  );
}

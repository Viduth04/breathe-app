// Mood tracking - Ishara (Member 2). FR09.
//
// Mood (1-5) per day as a line. Days without a check-in have no point and the
// line breaks there, so a missed day never reads as a low mood.
// Screens show the same numbers as text too (never chart-only).

import type { MoodDay } from "@/services/checkinService";
import { colors } from "@/theme";
import { MoodLevel } from "@/types/checkin";
import { useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

const HEIGHT = 170;
const PAD = { top: 12, right: 12, bottom: 28, left: 28 };
const INK = colors.textSecondary;

// Up to 5 evenly spread x labels (every day for a week)
function labelIndexes(count: number) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / 4;
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step));
}

const axisLabel = (day: MoodDay, count: number) =>
  day.date.toLocaleDateString(
    undefined,
    count <= 7 ? { weekday: "short" } : { day: "numeric", month: "short" },
  );

export default function MoodDayChart({
  days,
  label,
}: {
  days: MoodDay[];
  label: string; // Screen reader summary
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / Math.max(days.length, 1);
  const x = (i: number) => PAD.left + band * i + band / 2;
  const y = (mood: number) => PAD.top + plotH - ((mood - 1) / 4) * plotH;
  const dot = days.length > 31 ? 2.5 : 4;

  // Gaps break the line: "M" starts a new segment after a missing day
  let d = "";
  days.forEach((day, i) => {
    if (day.mood === null) return;
    d += `${i > 0 && days[i - 1].mood !== null ? "L" : "M"}${x(i)},${y(day.mood)} `;
  });

  return (
    <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={label}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {([1, 2, 3, 4, 5] as MoodLevel[]).map((m) => (
            <Line
              key={m}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(m)}
              y2={y(m)}
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}
          {([1, 3, 5] as MoodLevel[]).map((m) => (
            <SvgText key={m} x={PAD.left - 8} y={y(m) + 4} fontSize={11} fill={INK} textAnchor="end">
              {m}
            </SvgText>
          ))}
          {labelIndexes(days.length).map((i) => (
            <SvgText
              key={days[i].dateKey}
              x={x(i)}
              y={HEIGHT - 8}
              fontSize={11}
              fill={INK}
              textAnchor={days.length > 7 && i === 0 ? "start" : days.length > 7 && i === days.length - 1 ? "end" : "middle"}
            >
              {axisLabel(days[i], days.length)}
            </SvgText>
          ))}
          <Path d={d} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />
          {days.map((day, i) =>
            day.mood === null ? null : (
              <Circle
                key={day.dateKey}
                cx={x(i)}
                cy={y(day.mood)}
                r={dot}
                fill={colors.primary}
                stroke={colors.surface}
                strokeWidth={dot > 3 ? 2 : 1}
              />
            ),
          )}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
    </View>
  );
}

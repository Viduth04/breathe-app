// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.
//
// Two single-series charts (never one chart with two y-axes):
//   MoodLineChart       - average mood (1-5) per week
//   ParticipationChart  - number of check-ins per week
// Tap a week to select it (the tooltip/crosshair equivalent on touch screens).
// Weeks under the privacy threshold have no mood point: the line breaks there.

import { WeekEntry } from "@/services/statsService";
import { colors, moodColors } from "@/theme";
import { averageMood, isSafeToShow, MOOD_LABELS, MoodLevel } from "@/types/stats";
import { shortDate } from "@/utils/week";
import { useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

const HEIGHT = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };
const GRID = colors.border; // Recessive grid and axes
// Unselected bars: a lighter step of the same green so the selected week stands out
const UNSELECTED_BAR = moodColors[2];
const INK = colors.textSecondary;

type ChartProps = {
  weeks: WeekEntry[];
  selected: number;
  onSelect: (index: number) => void;
  label: string; // Screen reader summary
};

// Measures its width, then lays out one column per week
function useChartWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return { width, onLayout };
}

function columns(width: number, count: number) {
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const band = plotW / count;
  return { plotW, band, x: (i: number) => PAD.left + band * i + band / 2 };
}

// Week labels on alternate weeks (plus the last) so they never collide
function XLabels({ weeks, x }: { weeks: WeekEntry[]; x: (i: number) => number }) {
  return (
    <>
      {weeks.map((w, i) =>
        i % 2 === weeks.length % 2 || i === weeks.length - 1 ? (
          <SvgText
            key={w.id}
            x={x(i)}
            y={HEIGHT - 8}
            fontSize={11}
            fill={INK}
            textAnchor="middle"
          >
            {i === weeks.length - 1 ? "This wk" : shortDate(w.start)}
          </SvgText>
        ) : null,
      )}
    </>
  );
}

// Transparent full-height bands that select a week, plus the crosshair
function SelectLayer({
  weeks,
  band,
  x,
  selected,
  onSelect,
}: {
  weeks: WeekEntry[];
  band: number;
  x: (i: number) => number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <>
      <Line
        x1={x(selected)}
        x2={x(selected)}
        y1={PAD.top}
        y2={HEIGHT - PAD.bottom}
        stroke={colors.textSecondary}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {weeks.map((w, i) => (
        <Rect
          key={w.id}
          x={x(i) - band / 2}
          y={0}
          width={band}
          height={HEIGHT}
          fill="transparent"
          onPress={() => onSelect(i)}
        />
      ))}
    </>
  );
}

export function MoodLineChart({ weeks, selected, onSelect, label }: ChartProps) {
  const { width, onLayout } = useChartWidth();
  const { band, x } = columns(width, weeks.length);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const y = (mood: number) => PAD.top + plotH - ((mood - 1) / 4) * plotH;

  // Only weeks that pass the privacy threshold get a point; gaps break the line
  const points = weeks.map((w) =>
    isSafeToShow(w.stats) ? averageMood(w.stats!) : null,
  );
  let d = "";
  points.forEach((p, i) => {
    if (p === null) return;
    d += `${i > 0 && points[i - 1] !== null ? "L" : "M"}${x(i)},${y(p)} `;
  });
  const lastSafe = points.map((p, i) => (p === null ? -1 : i)).filter((i) => i >= 0).pop();

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
              stroke={GRID}
              strokeWidth={1}
            />
          ))}
          {([1, 3, 5] as MoodLevel[]).map((m) => (
            <SvgText key={m} x={PAD.left - 8} y={y(m) + 4} fontSize={11} fill={INK} textAnchor="end">
              {m}
            </SvgText>
          ))}
          <XLabels weeks={weeks} x={x} />
          <SelectLayer weeks={weeks} band={band} x={x} selected={selected} onSelect={onSelect} />
          <Path d={d} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />
          {points.map((p, i) =>
            p === null ? null : (
              <Circle
                key={weeks[i].id}
                cx={x(i)}
                cy={y(p)}
                r={i === selected ? 6 : 4}
                fill={colors.primary}
                stroke={colors.surface}
                strokeWidth={2}
                onPress={() => onSelect(i)}
              />
            ),
          )}
          {/* One direct label: the latest week with a value */}
          {lastSafe !== undefined ? (
            <SvgText
              x={Math.min(x(lastSafe), width - PAD.right - 4)}
              y={y(points[lastSafe]!) - 10}
              fontSize={12}
              fontWeight="600"
              fill={colors.text}
              textAnchor={x(lastSafe) > width - 40 ? "end" : "middle"}
            >
              {points[lastSafe]!.toFixed(1)}
            </SvgText>
          ) : null}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
    </View>
  );
}

const niceMax = (value: number) => {
  if (value <= 5) return 5;
  const step = value <= 20 ? 5 : value <= 50 ? 10 : 25;
  return Math.ceil(value / step) * step;
};

// Rectangle with 4px rounded top corners (the data end), square at the baseline
const barPath = (x: number, top: number, w: number, bottom: number) => {
  const r = Math.min(4, w / 2, bottom - top);
  return `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom} Z`;
};

export function ParticipationChart({ weeks, selected, onSelect, label }: ChartProps) {
  const { width, onLayout } = useChartWidth();
  const { band, x } = columns(width, weeks.length);
  const totals = weeks.map((w) => w.stats?.total ?? 0);
  const max = niceMax(Math.max(...totals, 1));
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const base = PAD.top + plotH;
  const y = (v: number) => base - (v / max) * plotH;
  const barW = Math.max(Math.min(band - 8, 28), 4);
  const last = weeks.length - 1;

  return (
    <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={label}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {[0, max / 2, max].map((v) => (
            <Line key={v} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
          ))}
          {[0, max].map((v) => (
            <SvgText key={v} x={PAD.left - 8} y={y(v) + 4} fontSize={11} fill={INK} textAnchor="end">
              {v}
            </SvgText>
          ))}
          <XLabels weeks={weeks} x={x} />
          <SelectLayer weeks={weeks} band={band} x={x} selected={selected} onSelect={onSelect} />
          {totals.map((t, i) =>
            t > 0 ? (
              <Path
                key={weeks[i].id}
                d={barPath(x(i) - barW / 2, y(t), barW, base)}
                fill={i === selected ? colors.primary : UNSELECTED_BAR}
                onPress={() => onSelect(i)}
              />
            ) : null,
          )}
          {/* One direct label: this week's count */}
          <SvgText
            x={x(last)}
            y={y(totals[last]) - 6}
            fontSize={12}
            fontWeight="600"
            fill={colors.text}
            textAnchor="middle"
          >
            {totals[last]}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
    </View>
  );
}


// Plain-language line for the selected week, shown under the charts
export function describeWeek(week: WeekEntry) {
  const range = `Week of ${shortDate(week.start)}`;
  const total = week.stats?.total ?? 0;
  const count = `${total} ${total === 1 ? "check-in" : "check-ins"}`;
  if (!isSafeToShow(week.stats)) return `${range}: ${count}. Not enough responses to show mood.`;
  const avg = averageMood(week.stats!)!;
  const nearest = Math.min(5, Math.max(1, Math.round(avg))) as MoodLevel;
  return `${range}: ${count}, average mood ${avg.toFixed(1)} (${MOOD_LABELS[nearest]}).`;
}

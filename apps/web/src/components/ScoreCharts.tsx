import { CRITICAL_THRESHOLDS, type ScoreAxis } from "@shadow-self/shared";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { cardVariants } from "../lib/motion.js";

export type ChartDatum = {
  label: string;
  userEnergy?: number;
  shadowEnergy?: number;
  userFocus?: number;
  shadowFocus?: number;
  userMood?: number;
  shadowMood?: number;
  projectedUserEnergy?: number;
  projectedShadowEnergy?: number;
  projectedUserFocus?: number;
  projectedShadowFocus?: number;
  projectedUserMood?: number;
  projectedShadowMood?: number;
};

type ScoreChartProps = {
  title: string;
  axis: ScoreAxis;
  data: ChartDatum[];
  compact?: boolean;
  showThresholdMarkers?: boolean;
};

type ChartAnnotationState = {
  hasProjection: boolean;
  latestActualPoint: ChartDatum | null;
  latestGap: number | null;
  meaningfulGap: boolean;
  thresholdPoint: {
    label: string;
    value: number;
  } | null;
};

const axisKeys = {
  energy: {
    user: "userEnergy",
    shadow: "shadowEnergy",
    projectedUser: "projectedUserEnergy",
    projectedShadow: "projectedShadowEnergy"
  },
  focus: {
    user: "userFocus",
    shadow: "shadowFocus",
    projectedUser: "projectedUserFocus",
    projectedShadow: "projectedShadowFocus"
  },
  mood: {
    user: "userMood",
    shadow: "shadowMood",
    projectedUser: "projectedUserMood",
    projectedShadow: "projectedShadowMood"
  }
} as const satisfies Record<
  ScoreAxis,
  {
    user: keyof ChartDatum;
    shadow: keyof ChartDatum;
    projectedUser: keyof ChartDatum;
    projectedShadow: keyof ChartDatum;
  }
>;

function numericValue(point: ChartDatum, key: keyof ChartDatum): number | null {
  const value = point[key];

  return typeof value === "number" ? value : null;
}

function formatSigned(value: number): string {
  const rounded = Math.round(value * 10) / 10;

  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

export function ScoreChart({ title, axis, data, compact = false, showThresholdMarkers = false }: ScoreChartProps) {
  const { user: userKey, shadow: shadowKey, projectedUser, projectedShadow } = axisKeys[axis];
  const threshold = CRITICAL_THRESHOLDS[axis];
  const annotationState = useMemo<ChartAnnotationState>(() => {
    const latestActualPoint =
      [...data]
        .reverse()
        .find((point) => numericValue(point, userKey) !== null && numericValue(point, shadowKey) !== null) ?? null;
    const latestUser = latestActualPoint ? numericValue(latestActualPoint, userKey) : null;
    const latestShadow = latestActualPoint ? numericValue(latestActualPoint, shadowKey) : null;
    const latestGap = latestUser !== null && latestShadow !== null ? latestShadow - latestUser : null;
    const hasProjection = data.some(
      (point) => numericValue(point, projectedUser) !== null || numericValue(point, projectedShadow) !== null
    );
    const projectedCurveKey = hasProjection ? projectedUser : userKey;
    const thresholdCandidate = showThresholdMarkers
      ? data.find((point) => {
          const value = numericValue(point, projectedCurveKey);

          return value !== null && value < threshold;
        })
      : undefined;
    const thresholdValue = thresholdCandidate ? numericValue(thresholdCandidate, projectedCurveKey) : null;

    return {
      hasProjection,
      latestActualPoint,
      latestGap,
      meaningfulGap: latestGap !== null && latestGap > 15,
      thresholdPoint:
        thresholdCandidate && thresholdValue !== null
          ? {
              label: thresholdCandidate.label,
              value: thresholdValue
            }
          : null
    };
  }, [data, projectedShadow, projectedUser, shadowKey, showThresholdMarkers, threshold, userKey]);
  const lineOpacity = annotationState.meaningfulGap
    ? {
        user: 0.72,
        shadow: 0.98
      }
    : {
        user: 0.84,
        shadow: 0.82
      };

  return (
    <motion.section
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      className="rounded-md border border-line bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={compact ? "text-base font-semibold" : "text-xl font-semibold"}>{title}</h2>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-normal text-muted">
          {annotationState.meaningfulGap && annotationState.latestGap !== null ? (
            <span className="text-coral">gap {formatSigned(annotationState.latestGap)}</span>
          ) : null}
          <span>floor {threshold}</span>
          <span>0-100</span>
        </div>
      </div>
      <div className={compact ? "h-56" : "h-80"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--line-strong)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[20, 40, 60, 80]}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                boxShadow: "0 8px 22px rgba(32, 33, 36, 0.12)"
              }}
              wrapperStyle={{ transition: "opacity 180ms cubic-bezier(0.33, 1, 0.68, 1)" }}
              isAnimationActive
              animationDuration={180}
              animationEasing="ease-out"
            />
            {annotationState.thresholdPoint ? (
              <>
                <ReferenceLine y={threshold} stroke="var(--muted)" strokeDasharray="3 5" />
                <ReferenceDot
                  x={annotationState.thresholdPoint.label}
                  y={annotationState.thresholdPoint.value}
                  r={3.5}
                  fill="var(--card)"
                  stroke="var(--coral)"
                  strokeWidth={1.5}
                  label={{
                    value: `${threshold}`,
                    fill: "var(--coral)",
                    fontSize: 11,
                    position: "top"
                  }}
                />
              </>
            ) : null}
            {annotationState.latestActualPoint && annotationState.meaningfulGap ? (
              <ReferenceLine
                x={annotationState.latestActualPoint.label}
                stroke="var(--line-strong)"
                strokeDasharray="2 5"
                label={
                  compact || annotationState.latestGap === null
                    ? undefined
                    : {
                        value: `${formatSigned(annotationState.latestGap)} divergence`,
                        fill: "var(--coral)",
                        fontSize: 12,
                        position: "insideTopRight"
                      }
                }
              />
            ) : null}
            <Legend verticalAlign="top" align="right" height={30} iconType="line" />
            <Line
              type="monotone"
              dataKey={userKey}
              name="You"
              stroke="var(--accent)"
              strokeWidth={compact ? 2 : 3}
              strokeOpacity={lineOpacity.user}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationBegin={0}
              animationDuration={320}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey={shadowKey}
              name="Shadow"
              stroke="var(--coral)"
              strokeWidth={compact ? 2 : 3}
              strokeDasharray="7 6"
              strokeOpacity={lineOpacity.shadow}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationBegin={120}
              animationDuration={320}
              animationEasing="ease-out"
            />
            {annotationState.hasProjection ? (
              <>
                <Line
                  type="monotone"
                  dataKey={projectedUser}
                  name="You projected"
                  stroke="var(--accent)"
                  strokeWidth={compact ? 1.5 : 2}
                  strokeDasharray="2 6"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  isAnimationActive
                  animationBegin={180}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey={projectedShadow}
                  name="Shadow projected"
                  stroke="var(--coral)"
                  strokeWidth={compact ? 1.5 : 2}
                  strokeDasharray="2 6"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  isAnimationActive
                  animationBegin={260}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

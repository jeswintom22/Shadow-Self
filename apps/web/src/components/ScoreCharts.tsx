import { CRITICAL_THRESHOLDS, type ScoreAxis } from "@shadow-self/shared";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

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

export function ScoreChart({ title, axis, data, compact = false }: ScoreChartProps) {
  const { user: userKey, shadow: shadowKey, projectedUser, projectedShadow } = axisKeys[axis];
  const latestActualPoint = [...data]
    .reverse()
    .find((point) => numericValue(point, userKey) !== null && numericValue(point, shadowKey) !== null);
  const latestUser = latestActualPoint ? numericValue(latestActualPoint, userKey) : null;
  const latestShadow = latestActualPoint ? numericValue(latestActualPoint, shadowKey) : null;
  const latestGap = latestUser !== null && latestShadow !== null ? latestShadow - latestUser : null;
  const hasProjection = data.some(
    (point) => numericValue(point, projectedUser) !== null || numericValue(point, projectedShadow) !== null
  );
  const threshold = CRITICAL_THRESHOLDS[axis];

  return (
    <section className="rounded-md border border-[#dfe3ea] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={compact ? "text-base font-semibold" : "text-xl font-semibold"}>{title}</h2>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-normal text-[#626976]">
          {latestGap !== null ? <span>gap {formatSigned(latestGap)}</span> : null}
          <span>floor {threshold}</span>
          <span>0-100</span>
        </div>
      </div>
      <div className={compact ? "h-56" : "h-80"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e6e9ef" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#626976", fontSize: 12 }}
              axisLine={{ stroke: "#c9ced8" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[20, 40, 60, 80]}
              tick={{ fill: "#626976", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #dfe3ea",
                borderRadius: 8,
                boxShadow: "0 8px 22px rgba(32, 33, 36, 0.12)"
              }}
            />
            <ReferenceLine y={threshold} stroke="#aeb5c2" strokeDasharray="3 5" />
            {latestActualPoint ? (
              <ReferenceLine
                x={latestActualPoint.label}
                stroke="#c9ced8"
                strokeDasharray="2 5"
                label={
                  compact || latestGap === null
                    ? undefined
                    : {
                        value: `gap ${formatSigned(latestGap)}`,
                        fill: "#626976",
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
              stroke="#534AB7"
              strokeWidth={compact ? 2 : 3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey={shadowKey}
              name="Shadow"
              stroke="#D85A30"
              strokeWidth={compact ? 2 : 3}
              strokeDasharray="7 6"
              dot={false}
              activeDot={{ r: 5 }}
            />
            {hasProjection ? (
              <>
                <Line
                  type="monotone"
                  dataKey={projectedUser}
                  name="You projected"
                  stroke="#534AB7"
                  strokeWidth={compact ? 1.5 : 2}
                  strokeDasharray="2 6"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey={projectedShadow}
                  name="Shadow projected"
                  stroke="#D85A30"
                  strokeWidth={compact ? 1.5 : 2}
                  strokeDasharray="2 6"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

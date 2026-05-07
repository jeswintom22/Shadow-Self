import type { ScoreAxis } from "@shadow-self/shared";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
};

type ScoreChartProps = {
  title: string;
  axis: ScoreAxis;
  data: ChartDatum[];
  compact?: boolean;
};

const axisKeys = {
  energy: ["userEnergy", "shadowEnergy"],
  focus: ["userFocus", "shadowFocus"],
  mood: ["userMood", "shadowMood"]
} as const satisfies Record<ScoreAxis, readonly [keyof ChartDatum, keyof ChartDatum]>;

export function ScoreChart({ title, axis, data, compact = false }: ScoreChartProps) {
  const [userKey, shadowKey] = axisKeys[axis];

  return (
    <section className="rounded-md border border-[#dfe3ea] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={compact ? "text-base font-semibold" : "text-xl font-semibold"}>{title}</h2>
        <div className="text-xs font-medium uppercase tracking-normal text-[#626976]">0-100</div>
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

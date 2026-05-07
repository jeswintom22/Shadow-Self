import {
  SCORE_AXES,
  calculateDivergence,
  invertHabit,
  scoreDay,
  type HabitValues,
  type ScoreAxis,
  type Scores
} from "@shadow-self/shared";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import { controlledSpring, quickFade } from "../lib/motion.js";

type ShadowDivergencePreviewProps = {
  values: HabitValues;
};

const axisLabels = {
  energy: "Energy",
  focus: "Focus",
  mood: "Mood"
} as const satisfies Record<ScoreAxis, string>;

function formatSigned(value: number): string {
  const rounded = Math.round(value * 10) / 10;

  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

function createShadowValues(values: HabitValues): HabitValues {
  return {
    sleep: invertHabit("sleep", values.sleep),
    exercise: invertHabit("exercise", values.exercise),
    water: invertHabit("water", values.water),
    screen_time: invertHabit("screen_time", values.screen_time),
    social: invertHabit("social", values.social)
  };
}

function AxisDivergenceRow({
  axis,
  user,
  shadow
}: {
  axis: ScoreAxis;
  user: Scores;
  shadow: Scores;
}) {
  const userScore = user[axis];
  const shadowScore = shadow[axis];
  const gap = shadowScore - userScore;
  const meaningfulGap = gap > 15;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="w-8 text-right text-xs font-semibold tabular-nums text-[#534AB7]">{userScore}</span>
        <div className="flex h-2 min-w-0 flex-1 justify-end overflow-hidden rounded-full bg-[#eef0f4]">
          <motion.div
            aria-hidden="true"
            className="h-full w-full origin-right rounded-full bg-[#534AB7]"
            animate={{ scaleX: userScore / 100, opacity: meaningfulGap ? 0.72 : 0.58 }}
            transition={controlledSpring}
          />
        </div>
      </div>

      <div className="text-center text-[11px] font-semibold uppercase tracking-normal text-[#626976]">
        {axisLabels[axis]}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef0f4]">
          <motion.div
            aria-hidden="true"
            className="h-full w-full origin-left rounded-full bg-[#D85A30]"
            animate={{ scaleX: shadowScore / 100, opacity: meaningfulGap ? 0.94 : 0.62 }}
            transition={controlledSpring}
          />
        </div>
        <span className="w-8 text-xs font-semibold tabular-nums text-[#D85A30]">{shadowScore}</span>
      </div>
    </div>
  );
}

export const ShadowDivergencePreview = memo(function ShadowDivergencePreview({
  values
}: ShadowDivergencePreviewProps) {
  const preview = useMemo(() => {
    const shadowValues = createShadowValues(values);
    const userScores = scoreDay(values);
    const shadowScores = scoreDay(shadowValues);
    const divergence = calculateDivergence(userScores, shadowScores);

    return {
      userScores,
      shadowScores,
      divergence
    };
  }, [values]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickFade}
      className="rounded-md border border-[#dfe3ea] bg-white p-4"
      aria-label="Realtime shadow divergence"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[#626976]">Realtime divergence</p>
          <p className="mt-1 text-sm text-[#626976]">You vs Shadow</p>
        </div>
        <motion.output
          key={preview.divergence.totalGap.toFixed(1)}
          initial={{ opacity: 0.55, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={quickFade}
          className="text-2xl font-semibold tabular-nums text-[#202124]"
        >
          {formatSigned(preview.divergence.totalGap)}
        </motion.output>
      </div>

      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] gap-3 text-[11px] font-semibold uppercase tracking-normal">
        <span className="text-right text-[#534AB7]">You</span>
        <span aria-hidden="true" />
        <span className="text-[#D85A30]">Shadow</span>
      </div>

      <div className="space-y-3">
        {SCORE_AXES.map((axis) => (
          <AxisDivergenceRow
            key={axis}
            axis={axis}
            user={preview.userScores}
            shadow={preview.shadowScores}
          />
        ))}
      </div>
    </motion.section>
  );
});

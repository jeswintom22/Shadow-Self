import { SCORE_AXES, type ScoreAxis, type Scores } from "@shadow-self/shared";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect } from "react";
import { controlledSpring } from "../lib/motion.js";

type ShadowRaceProps = {
  user: Scores;
  shadow: Scores;
};

const axisLabels = {
  energy: "Energy",
  focus: "Focus",
  mood: "Mood"
} as const satisfies Record<ScoreAxis, string>;

function useCountUp(target: number): MotionValue<string> {
  const value = useMotionValue(0);
  const spring = useSpring(value, { stiffness: 90, damping: 22 });
  const text = useTransform(spring, (latest) => `${Math.round(latest)}`);

  useEffect(() => {
    value.set(target);
  }, [target, value]);

  return text;
}

function RaceBar({
  score,
  side,
  delay
}: {
  score: number;
  side: "user" | "shadow";
  delay: number;
}) {
  const text = useCountUp(score);
  const isUser = side === "user";

  return (
    <div className={`flex items-center gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="h-6 min-w-0 flex-1 overflow-hidden rounded-md bg-subtle"
        style={{ transform: "translateZ(0)" }}
      >
        <motion.div
          aria-hidden="true"
          className={`h-full w-full ${isUser ? "origin-right" : "origin-left"} rounded-md`}
          style={{
            background: isUser
              ? "linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--accent) / 0.72) 100%)"
              : "linear-gradient(90deg, rgb(var(--coral) / 0.72) 0%, rgb(var(--coral)) 100%)",
            boxShadow: "0 6px 18px rgb(0 0 0 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.25)",
            transform: "translateZ(18px)"
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(score, 2) / 100 }}
          transition={{ ...controlledSpring, delay }}
        />
      </div>
      <motion.span
        className={`w-10 text-base font-semibold tabular-nums ${isUser ? "text-right text-accent" : "text-coral"}`}
        style={{ transform: "translateZ(24px)" }}
      >
        {text}
      </motion.span>
    </div>
  );
}

export function ShadowRace({ user, shadow }: ShadowRaceProps) {
  const rotateX = useSpring(0, { stiffness: 140, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 140, damping: 18 });
  const userTotal = (user.energy + user.focus + user.mood) / 3;
  const shadowTotal = (shadow.energy + shadow.focus + shadow.mood) / 3;
  const leader = Math.abs(userTotal - shadowTotal) < 1 ? "tie" : userTotal > shadowTotal ? "user" : "shadow";

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(py * -6);
    rotateY.set(px * 6);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="rounded-md border border-line bg-card p-5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)]"
      aria-label="You versus Shadow score race"
    >
      <div style={{ transformStyle: "preserve-3d" }}>
        <div className="mb-5 flex items-end justify-between gap-4" style={{ transform: "translateZ(30px)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-muted">Score race</p>
            <h2 className="mt-1 text-xl font-semibold">You vs Shadow</h2>
          </div>
          <p className="text-sm font-medium text-muted">
            {leader === "tie"
              ? "Dead even — for now."
              : leader === "user"
                ? "You're ahead. Keep it that way."
                : "Your Shadow is pulling ahead."}
          </p>
        </div>

        <div className="space-y-5">
          {SCORE_AXES.map((axis, index) => (
            <div
              key={axis}
              className="grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-3"
              style={{ transform: `translateZ(${14 + index * 4}px)` }}
            >
              <RaceBar score={user[axis]} side="user" delay={index * 0.08} />
              <div className="text-center text-[11px] font-semibold uppercase tracking-normal text-muted">
                {axisLabels[axis]}
              </div>
              <RaceBar score={shadow[axis]} side="shadow" delay={index * 0.08 + 0.15} />
            </div>
          ))}
        </div>

        <div
          className="mt-5 flex justify-between text-[11px] font-semibold uppercase tracking-normal"
          style={{ transform: "translateZ(24px)" }}
        >
          <span className="text-accent">You</span>
          <span className="text-coral">Shadow</span>
        </div>
      </div>
    </motion.section>
  );
}

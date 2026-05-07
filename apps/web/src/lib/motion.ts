import type { Transition, Variants } from "framer-motion";

export const easeOutCubic = [0.33, 1, 0.68, 1] as const;

export const controlledSpring: Transition = {
  type: "spring",
  duration: 0.28,
  bounce: 0.04
};

export const quickFade: Transition = {
  duration: 0.22,
  ease: easeOutCubic
};

export const cardVariants: Variants = {
  rest: {
    y: 0
  },
  hover: {
    y: -2,
    transition: quickFade
  }
};

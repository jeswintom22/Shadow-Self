import { Droplets, Dumbbell, MonitorSmartphone, Moon, Users, type LucideIcon } from "lucide-react";
import type { HabitKey } from "@shadow-self/shared";

export const habitIcons = {
  sleep: Moon,
  exercise: Dumbbell,
  water: Droplets,
  screen_time: MonitorSmartphone,
  social: Users
} satisfies Record<HabitKey, LucideIcon>;

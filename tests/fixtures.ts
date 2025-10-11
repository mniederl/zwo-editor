import type { getWorkoutLength } from "../src/components/helpers";

// derive the bars type from the function signature
type Bars = Parameters<typeof getWorkoutLength>[0];

const bar = { type: "bar", time: 300, power: 0.75, length: 4000 } as const;
const trap = { type: "trapeze", time: 600, startPower: 0.7, endPower: 0.9, length: 6000 } as const;
const intv = {
  type: "interval",
  time: 0,
  repeat: 3,
  onDuration: 60,
  offDuration: 30,
  onPower: 1.0,
  offPower: 0.5,
  length: 3000,
} as const;
const free = { type: "freeRide", time: 900 } as const;

export const paced: Bars = [bar, trap, intv] as unknown as Bars;
export const allBars: Bars = [bar, trap, intv, free] as unknown as Bars;

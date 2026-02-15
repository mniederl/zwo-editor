export const Colors = {
  GRAY: "#807F80",
  BLUE: "#0E90D4",
  GREEN: "#00C46A",
  YELLOW: "#FFCB00",
  ORANGE: "#FF6430",
  RED: "#E90000",
  WHITE: "#FFFFFF",
} as const;

type ZoneKey = "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "Z6";

interface ZoneRange {
  min: number;
  max: number;
}

export const Zones: Record<ZoneKey, ZoneRange> = {
  Z1: { min: 0.1, max: 0.6 },
  Z2: { min: 0.6, max: 0.75 },
  Z3: { min: 0.75, max: 0.89 },
  Z4: { min: 0.89, max: 1.04 },
  Z5: { min: 1.04, max: 1.18 },
  Z6: { min: 1.18, max: 2.0 },
};

export const ZonesArray: [number, number][] = Object.values(Zones).map(({ min, max }) => [min, max]);

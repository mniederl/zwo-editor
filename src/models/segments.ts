// Lightweight class models for workout segments so code can hold a typed list of elements
// without changing existing runtime shapes. These are small wrappers around the plain
// data shapes used throughout the app and provide a common interface for iteration.

export type DurationType = "time" | "distance";

export interface ICommon {
  id: string;
  type: string;
  time: number;
  length?: number;
  cadence?: number;
}

export class Bar implements ICommon {
  id: string;
  type = "bar";
  time: number;
  length?: number;
  power: number;
  cadence: number;
  pace?: number;

  constructor({ id, time, length, power = 1, cadence = 0, pace = 0 }: Partial<Bar> & { id: string; time: number }) {
    this.id = id;
    this.time = time;
    this.length = length;
    this.power = power;
    this.cadence = cadence;
    this.pace = pace;
  }

  // returns duration in seconds (for time-mode workouts)
  duration(): number {
    return this.time;
  }
}

export class Trapeze implements ICommon {
  id: string;
  type = "trapeze";
  time: number;
  length?: number;
  startPower: number;
  endPower: number;
  cadence: number;
  pace?: number;

  constructor({
    id,
    time,
    length,
    startPower = 1,
    endPower = 1,
    cadence = 0,
    pace = 0,
  }: Partial<Trapeze> & { id: string; time: number }) {
    this.id = id;
    this.time = time;
    this.length = length;
    this.startPower = startPower;
    this.endPower = endPower;
    this.cadence = cadence;
    this.pace = pace;
  }

  duration(): number {
    return this.time;
  }
}

export class Interval implements ICommon {
  id: string;
  type = "interval";
  time: number;
  length?: number;
  repeat: number;
  onDuration: number;
  offDuration: number;
  onPower: number;
  offPower: number;
  cadence: number;
  restingCadence?: number;
  pace?: number;

  constructor({
    id,
    time,
    length,
    repeat = 1,
    onDuration = 0,
    offDuration = 0,
    onPower = 1,
    offPower = 1,
    cadence = 0,
    restingCadence,
    pace = 0,
  }: Partial<Interval> & { id: string; time: number }) {
    this.id = id;
    this.time = time;
    this.length = length;
    this.repeat = repeat;
    this.onDuration = onDuration;
    this.offDuration = offDuration;
    this.onPower = onPower;
    this.offPower = offPower;
    this.cadence = cadence;
    this.restingCadence = restingCadence;
    this.pace = pace;
  }

  duration(): number {
    return this.time;
  }
}

export class FreeRide implements ICommon {
  id: string;
  type = "freeRide";
  time: number;
  length?: number;
  cadence: number;

  constructor({ id, time, length, cadence = 0 }: Partial<FreeRide> & { id: string; time: number }) {
    this.id = id;
    this.time = time;
    this.length = length;
    this.cadence = cadence;
  }

  duration(): number {
    return this.time;
  }
}

export interface Instruction {
  id: string;
  text: string;
  time: number;
  length: number;
}

export type Segment = Bar | Trapeze | Interval | FreeRide;

// biome-ignore lint/suspicious/noExplicitAny: Number allows any input
const num = (v: any, d?: number): number | undefined => (v === undefined ? d : Number(v));

// Factory that converts a plain JS object (as used throughout the app) into a class instance.
export function fromPlain(obj: unknown): Segment | Instruction | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const type = typeof o.type === "string" ? (o.type as string) : undefined;

  const baseProps = {
    id: String(o.id),
    time: num(o.time, 0) || 0,
    length: num(o.length),
    cadence: num(o.cadence, 0),
  };

  switch (type) {
    case "bar":
      return new Bar({
        ...baseProps,
        power: num(o.power, 1),
        pace: num(o.pace, 0),
      });
    case "trapeze":
      return new Trapeze({
        ...baseProps,
        startPower: num(o.startPower, 1),
        endPower: num(o.endPower, 1),
        pace: num(o.pace, 0),
      });
    case "interval":
      return new Interval({
        ...baseProps,
        repeat: num(o.repeat, 1),
        onDuration: num(o.onDuration, 0),
        offDuration: num(o.offDuration, 0),
        onPower: num(o.onPower, 1),
        offPower: num(o.offPower, 1),
        restingCadence: num(o.restingCadence),
        pace: num(o.pace, 0),
      });
    case "freeRide":
      return new FreeRide(baseProps);
    default: {
      if (o.text !== undefined && o.time !== undefined && o.id !== undefined)
        return {
          id: String(o.id),
          text: String(o.text),
          time: num(o.time, 0),
          length: num(o.length, 0),
        } as Instruction;
      return null;
    }
  }
}

// Helper to build a typed list from an array of plain objects
export function mapToSegments(list: unknown[]): Array<Segment | Instruction> {
  return list.map((l) => fromPlain(l)).filter((x): x is Segment | Instruction => x !== null);
}

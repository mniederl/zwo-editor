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

  constructor({ id, time, length, startPower = 1, endPower = 1, cadence = 0, pace = 0 }: Partial<Trapeze> & { id: string; time: number }) {
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

// Factory that converts a plain JS object (as used throughout the app) into a class instance.
export function fromPlain(obj: unknown): Segment | Instruction | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const type = typeof o.type === "string" ? (o.type as string) : undefined;

  switch (type) {
    case "bar":
      return new Bar({
        id: String(o.id),
        time: Number(o.time) || 0,
        length: o.length === undefined ? undefined : Number(o.length),
        power: o.power === undefined ? 1 : Number(o.power),
        cadence: o.cadence === undefined ? 0 : Number(o.cadence),
        pace: o.pace === undefined ? 0 : Number(o.pace),
      });
    case "trapeze":
      return new Trapeze({
        id: String(o.id),
        time: Number(o.time) || 0,
        length: o.length === undefined ? undefined : Number(o.length),
        startPower: o.startPower === undefined ? 1 : Number(o.startPower),
        endPower: o.endPower === undefined ? 1 : Number(o.endPower),
        cadence: o.cadence === undefined ? 0 : Number(o.cadence),
        pace: o.pace === undefined ? 0 : Number(o.pace),
      });
    case "interval":
      return new Interval({
        id: String(o.id),
        time: Number(o.time) || 0,
        length: o.length === undefined ? undefined : Number(o.length),
        repeat: o.repeat === undefined ? 1 : Number(o.repeat),
        onDuration: o.onDuration === undefined ? 0 : Number(o.onDuration),
        offDuration: o.offDuration === undefined ? 0 : Number(o.offDuration),
        onPower: o.onPower === undefined ? 1 : Number(o.onPower),
        offPower: o.offPower === undefined ? 1 : Number(o.offPower),
        cadence: o.cadence === undefined ? 0 : Number(o.cadence),
        restingCadence: o.restingCadence === undefined ? undefined : Number(o.restingCadence),
        pace: o.pace === undefined ? 0 : Number(o.pace),
      });
    case "freeRide":
      return new FreeRide({
        id: String(o.id),
        time: Number(o.time) || 0,
        length: o.length === undefined ? undefined : Number(o.length),
        cadence: o.cadence === undefined ? 0 : Number(o.cadence),
      });
    default: {
      if (o.text !== undefined && o.time !== undefined && o.id !== undefined) {
        return {
          id: String(o.id),
          text: String(o.text),
          time: Number(o.time) || 0,
          length: o.length === undefined ? 0 : Number(o.length),
        } as Instruction;
      }
      return null;
    }
  }
}

// Helper to build a typed list from an array of plain objects
export function mapToSegments(list: unknown[]): Array<Segment | Instruction> {
  return list.map((l) => fromPlain(l)).filter((x): x is Segment | Instruction => x !== null);
}

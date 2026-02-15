export type SegmentKind = "bar" | "trapeze" | "interval" | "freeRide";

export interface SegmentBase {
  id: string;
  type: SegmentKind;
  time: number;
  length: number;
  cadence: number;
  pace?: number;
}

export interface SteadySegment extends SegmentBase {
  type: "bar";
  power: number;
}

export interface RampSegment extends SegmentBase {
  type: "trapeze";
  startPower: number;
  endPower: number;
}

export interface IntervalSegment extends SegmentBase {
  type: "interval";
  repeat: number;
  onDuration: number;
  offDuration: number;
  onPower: number;
  offPower: number;
  restingCadence: number;
  onLength: number;
  offLength: number;
}

export interface FreeRideSegment extends SegmentBase {
  type: "freeRide";
}

export type SegmentType = SteadySegment | RampSegment | IntervalSegment | FreeRideSegment;

export interface Instruction {
  id: string;
  text: string;
  time: number;
  length: number;
}

export type SportType = "bike" | "run";
export type DurationType = "time" | "distance";
export type PaceUnitType = "metric" | "imperial";

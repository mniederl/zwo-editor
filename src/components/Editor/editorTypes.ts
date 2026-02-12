import type { RunningTimes } from "./RunningTimesEditor";

export interface BarType {
  id: string;
  time: number;
  length?: number;
  type: string;
  power?: number;
  startPower?: number;
  endPower?: number;
  cadence: number;
  restingCadence?: number;
  onPower?: number;
  offPower?: number;
  onDuration?: number;
  offDuration?: number;
  repeat?: number;
  pace?: number;
  onLength?: number;
  offLength?: number;
}

export interface Instruction {
  id: string;
  text: string;
  time: number;
  length: number;
}

export type SportType = "bike" | "run";
export type DurationType = "time" | "distance";
export type PaceUnitType = "metric" | "imperial";

export const loadRunningTimes = (): RunningTimes => {
  const missingRunningTimes: RunningTimes = {
    oneMile: "",
    fiveKm: "",
    tenKm: "",
    halfMarathon: "",
    marathon: "",
  };
  const runningTimesJson = localStorage.getItem("runningTimes");
  if (runningTimesJson) {
    return JSON.parse(runningTimesJson);
  }

  // Fallback to old localStorage keys
  const oneMile = localStorage.getItem("oneMileTime") || "";
  const fiveKm = localStorage.getItem("fiveKmTime") || "";
  const tenKm = localStorage.getItem("tenKmTime") || "";
  const halfMarathon = localStorage.getItem("halfMarathonTime") || "";
  const marathon = localStorage.getItem("marathonTime") || "";
  if (oneMile || fiveKm || tenKm || halfMarathon || marathon) {
    return { oneMile, fiveKm, tenKm, halfMarathon, marathon };
  }

  return missingRunningTimes;
};

import type React from "react";
import { useCallback } from "react";
import TimePicker from "react-time-picker";

import { calculateEstimatedTimes } from "../helpers";

import "./RunningTimesEditor.css";

// TODO: undefined?
export interface RunningTimes {
  oneMile: string | undefined;
  fiveKm: string | undefined;
  tenKm: string | undefined;
  halfMarathon: string | undefined;
  marathon: string | undefined;
}

interface RunningTimesEditorProps {
  times: RunningTimes;
  onChange: (times: RunningTimes) => void;
}

export default function RunningTimesEditor({ times, onChange }: RunningTimesEditorProps) {
  const estimateRunningTimes = useCallback(() => {
    const distances = [1.60934, 5, 10, 21.0975, 42.195, 1.60934];
    const estimatedTimes = calculateEstimatedTimes(distances, [
      times.oneMile,
      times.fiveKm,
      times.tenKm,
      times.halfMarathon,
      times.marathon,
      "00:11:20",
    ]);

    onChange({
      oneMile: times.oneMile || estimatedTimes[0],
      fiveKm: times.fiveKm || estimatedTimes[1],
      tenKm: times.tenKm || estimatedTimes[2],
      halfMarathon: times.halfMarathon || estimatedTimes[3],
      marathon: times.marathon || estimatedTimes[4],
    });
  }, [times, onChange]);

  return (
    <div className="rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Run Profile</p>
        <h2 className="font-[var(--font-display)] text-2xl font-semibold text-slate-900">Benchmark Times</h2>
      </div>
      <div className="grid gap-3 xl:grid-cols-6">
        <RunTimeInput time={times.oneMile} onChange={(oneMile) => onChange({ ...times, oneMile })}>
          1 Mile Time
        </RunTimeInput>
        <RunTimeInput time={times.fiveKm} onChange={(fiveKm) => onChange({ ...times, fiveKm })}>
          5 km Time
        </RunTimeInput>
        <RunTimeInput time={times.tenKm} onChange={(tenKm) => onChange({ ...times, tenKm })}>
          10 km Time
        </RunTimeInput>
        <RunTimeInput time={times.halfMarathon} onChange={(halfMarathon) => onChange({ ...times, halfMarathon })}>
          Half Marathon Time
        </RunTimeInput>
        <RunTimeInput time={times.marathon} onChange={(marathon) => onChange({ ...times, marathon })}>
          Marathon Time
        </RunTimeInput>
        <div className="flex items-end">
          <button type="button" onClick={estimateRunningTimes} className="btn-estimate w-full">
            Estimate Missing Times
          </button>
        </div>
      </div>
    </div>
  );
}

const RunTimeInput: React.FC<{
  time: string | undefined;
  onChange: (time: string) => void;
  children: React.ReactNode;
}> = ({ time, onChange, children }) => (
  <label className="flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-3">
    <span className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
      <abbr title="hh:mm:ss">{children}</abbr>
    </span>

    <TimePicker
      value={time}
      onChange={(value) => onChange(value || "")}
      format="HH:mm:ss"
      maxDetail="second"
      disableClock
      hourPlaceholder="hh"
      minutePlaceholder="mm"
      secondPlaceholder="ss"
    />
  </label>
);

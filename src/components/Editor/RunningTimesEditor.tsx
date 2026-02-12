import type React from "react";
import { useCallback } from "react";
import TimePicker from "react-time-picker";

import { calculateEstimatedTimes } from "../helpers";

import "./RunningTimesEditor.css";

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

  const inputs: { label: string; key: keyof RunningTimes }[] = [
    { label: "1 Mile Time", key: "oneMile" },
    { label: "5 km Time", key: "fiveKm" },
    { label: "10 km Time", key: "tenKm" },
    { label: "Half Marathon Time", key: "halfMarathon" },
    { label: "Marathon Time", key: "marathon" },
  ];

  return (
    <div className="rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md">
      <div className="run-times-compact space-y-2">
        {inputs.map(({ label, key }) => (
          <RunTimeInput key={label} time={times[key]} onChange={(value) => onChange({ ...times, [key]: value })}>
            {label}
          </RunTimeInput>
        ))}

        <div className="pt-2">
          <button type="button" onClick={estimateRunningTimes} className="btn-estimate w-full btn-estimate-compact">
            Estimate Missing
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
  <label className="block">
    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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

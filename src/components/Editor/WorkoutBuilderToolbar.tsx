import { Bike, Footprints, MessageSquare, Pencil } from "lucide-react";
import { Tooltip } from "react-tooltip";

import { CooldownLogo, IntervalLogo, SteadyLogo, WarmupLogo } from "@/assets";
import { Colors, Zones } from "@/domain/workout/zones";

interface WorkoutBuilderToolbarProps {
  addBar: (zone: number, duration?: number, cadence?: number, pace?: number, length?: number) => void;
  addFreeRide: (duration?: number, cadence?: number, length?: number) => void;
  addInstruction: (text?: string, time?: number, length?: number) => void;
  addInterval: () => void;
  addTrapeze: (zone1: number, zone2: number, duration?: number, pace?: number, length?: number, cadence?: number) => void;
  onToggleTextEditor: () => void;
  sportType: "bike" | "run";
}

const segmentToolButtonClass =
  "inline-flex items-center justify-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900";

const zoneButtons = [
  { label: "Z1", color: Colors.GRAY, zone: 0.5, textColor: "#ffffff" },
  { label: "Z2", color: Colors.BLUE, zone: Zones.Z2.min, textColor: "#ffffff" },
  { label: "Z3", color: Colors.GREEN, zone: Zones.Z3.min, textColor: "#ffffff" },
  { label: "Z4", color: Colors.YELLOW, zone: Zones.Z4.min, textColor: "#111827" },
  { label: "Z5", color: Colors.ORANGE, zone: Zones.Z5.min, textColor: "#ffffff" },
  { label: "Z6", color: Colors.RED, zone: Zones.Z6.min, textColor: "#ffffff" },
];

export default function WorkoutBuilderToolbar({
  sportType,
  onToggleTextEditor,
  addBar,
  addTrapeze,
  addInterval,
  addFreeRide,
  addInstruction,
}: WorkoutBuilderToolbarProps) {
  return (
    <aside className="flex shrink-0 flex-col gap-2 xl:w-36">
      {sportType === "bike" ? (
        <>
          <Tooltip id="text-editor-tooltip" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600"
              onClick={onToggleTextEditor}
              data-tooltip-id="text-editor-tooltip"
              data-tooltip-content="Open text workout composer"
              aria-label="Open text editor"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {zoneButtons.map((zoneButton) => (
              <button
                key={zoneButton.label}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition hover:-translate-y-0.5"
                onClick={() => addBar(zoneButton.zone)}
                style={{ backgroundColor: zoneButton.color, color: zoneButton.textColor }}
              >
                {zoneButton.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button type="button" className={segmentToolButtonClass} onClick={() => addBar(1, 300, 0, 0, 1000)}>
          <SteadyLogo className="h-5 w-5" /> Steady Pace
        </button>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
        <button type="button" className={segmentToolButtonClass} onClick={() => addTrapeze(0.25, 0.75)}>
          <WarmupLogo className="h-5 w-5" /> Warm Up
        </button>
        <button type="button" className={segmentToolButtonClass} onClick={() => addTrapeze(0.75, 0.25)}>
          <CooldownLogo className="h-5 w-5" /> Cool Down
        </button>
        <button type="button" className={segmentToolButtonClass} onClick={addInterval}>
          <IntervalLogo className="h-5 w-5" /> Interval
        </button>
        <button type="button" className={segmentToolButtonClass} onClick={() => addFreeRide()}>
          {sportType === "bike" ? <Bike className="h-4 w-4" /> : <Footprints className="h-4 w-4" />} Free{" "}
          {sportType === "bike" ? "Ride" : "Run"}
        </button>
        <button type="button" className={segmentToolButtonClass} onClick={() => addInstruction()}>
          <MessageSquare className="h-4 w-4" /> Text Event
        </button>
      </div>
    </aside>
  );
}

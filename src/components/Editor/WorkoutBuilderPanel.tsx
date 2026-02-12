import {
  faArrowLeft,
  faArrowRight,
  faBicycle,
  faComment,
  faCopy,
  faPen,
  faRunning,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import { Tooltip } from "react-tooltip";

import { CooldownLogo, IntervalLogo, SteadyLogo, WarmupLogo } from "../../assets";
import { Colors, Zones } from "../constants";
import DistanceAxis from "./DistanceAxis";
import type { BarType, DurationType, Instruction, SportType } from "./editorTypes";
import TimeAxis from "./TimeAxis";
import ZoneAxis from "./ZoneAxis";

interface WorkoutBuilderPanelProps {
  sportType: SportType;
  durationType: DurationType;
  segmentsWidth: number;
  actionId: string | undefined;
  bars: BarType[];
  instructions: Instruction[];
  canvasRef: RefObject<HTMLDivElement | null>;
  segmentsRef: RefObject<HTMLDivElement | null>;
  setActionId: Dispatch<SetStateAction<string | undefined>>;
  toggleTextEditor: () => void;
  addBar: (zone: number, duration?: number, cadence?: number, pace?: number, length?: number) => void;
  addTrapeze: (
    zone1: number,
    zone2: number,
    duration?: number,
    pace?: number,
    length?: number,
    cadence?: number,
  ) => void;
  addInterval: (
    repeat?: number,
    onDuration?: number,
    offDuration?: number,
    onPower?: number,
    offPower?: number,
    cadence?: number,
    restingCadence?: number,
    pace?: number,
    onLength?: number,
    offLength?: number,
  ) => void;
  addFreeRide: (duration?: number, cadence?: number, length?: number) => void;
  addInstruction: (text?: string, time?: number, length?: number) => void;
  moveLeft: (id: string) => void;
  moveRight: (id: string) => void;
  removeBar: (id: string) => void;
  duplicateBar: (id: string) => void;
  setPace: (value: string, id: string) => void;
  getPace: (id: string) => number | undefined;
  renderSegment: (bar: BarType) => ReactNode;
  renderComment: (instruction: Instruction, index: number) => ReactNode;
}

export default function WorkoutBuilderPanel({
  sportType,
  durationType,
  segmentsWidth,
  actionId,
  bars,
  instructions,
  canvasRef,
  segmentsRef,
  setActionId,
  toggleTextEditor,
  addBar,
  addTrapeze,
  addInterval,
  addFreeRide,
  addInstruction,
  moveLeft,
  moveRight,
  removeBar,
  duplicateBar,
  setPace,
  getPace,
  renderSegment,
  renderComment,
}: WorkoutBuilderPanelProps) {
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

  return (
    <section className="rounded-3xl border border-white/50 bg-white/95 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Build Workout</p>
      <div className="flex flex-col gap-3 xl:flex-row xl:gap-6">
        <aside className="flex shrink-0 flex-col gap-2 xl:w-36">
          {sportType === "bike" ? (
            <>
              <Tooltip id="text-editor-tooltip" />
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600"
                  onClick={() => toggleTextEditor()}
                  data-tooltip-id="text-editor-tooltip"
                  data-tooltip-content="Open text workout composer"
                  aria-label="Open text editor"
                >
                  <FontAwesomeIcon icon={faPen} />
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
            <button type="button" className={segmentToolButtonClass} onClick={() => addInterval()}>
              <IntervalLogo className="h-5 w-5" /> Interval
            </button>
            <button type="button" className={segmentToolButtonClass} onClick={() => addFreeRide()}>
              <FontAwesomeIcon icon={sportType === "bike" ? faBicycle : faRunning} /> Free{" "}
              {sportType === "bike" ? "Ride" : "Run"}
            </button>
            <button type="button" className={segmentToolButtonClass} onClick={() => addInstruction()}>
              <FontAwesomeIcon icon={faComment} /> Text Event
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div id="editor" className="editor-shell">
            {actionId && (
              <div className="editor-actions">
                <button type="button" onClick={() => moveLeft(actionId)} title="Move Left" className="editor-action-button">
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <button type="button" onClick={() => moveRight(actionId)} title="Move Right" className="editor-action-button">
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                <button type="button" onClick={() => removeBar(actionId)} title="Delete" className="editor-action-button">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateBar(actionId)}
                  title="Duplicate"
                  className="editor-action-button"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                {sportType === "run" && (
                  <select
                    name="pace"
                    value={getPace(actionId)}
                    onChange={(event) => setPace(event.target.value, actionId)}
                    className="rounded-full border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 outline-none transition focus:border-cyan-400"
                  >
                    <option value="0">1 Mile Pace</option>
                    <option value="1">5K Pace</option>
                    <option value="2">10K Pace</option>
                    <option value="3">Half Marathon Pace</option>
                    <option value="4">Marathon Pace</option>
                  </select>
                )}
              </div>
            )}
            <div className="canvas" ref={canvasRef}>
              {actionId && (
                <div
                  className="fader"
                  style={{ width: canvasRef.current?.scrollWidth }}
                  onClick={() => setActionId(undefined)}
                ></div>
              )}
              <div className="segments" ref={segmentsRef}>
                {bars.map((bar) => renderSegment(bar))}
              </div>

              <div className="slider">{instructions.map((instruction, index) => renderComment(instruction, index))}</div>

              {durationType === "time" ? <TimeAxis width={segmentsWidth} /> : <DistanceAxis width={segmentsWidth} />}
            </div>

            <ZoneAxis />
          </div>
        </div>
      </div>
    </section>
  );
}

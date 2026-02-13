import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Copy,
  Footprints,
  ListOrdered,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { Tooltip } from "react-tooltip";

import { Colors, Zones } from "../constants";
import buildProgramRows from "./buildProgramRows";
import DistanceAxis from "./DistanceAxis";
import { useEditorContext } from "./EditorContext";
import type { BarType, Instruction } from "./editorTypes";
import TimeAxis from "./TimeAxis";
import WorkoutProgramPanel from "./WorkoutProgramPanel";
import ZoneAxis from "./ZoneAxis";
import { CooldownLogo, IntervalLogo, SteadyLogo, WarmupLogo } from "@/assets";
import { Bar, Comment, FreeRide, Interval, RightTrapezoid } from "@/components/WorkoutElements";
import { cn } from "@/utils/cssUtils";

export default function WorkoutBuilderPanel() {
  const { state, actions, helpers, refs } = useEditorContext();
  const { sportType, durationType, segmentsWidth, actionId, bars, instructions, ftp, weight, paceUnitType } = state;
  const [programVisible, setProgramVisible] = useState(true);
  const [dynamicShellHeight, setDynamicShellHeight] = useState<number>();
  const [shellViewportHeight, setShellViewportHeight] = useState(430);
  const [isPowerResizeActive, setIsPowerResizeActive] = useState(false);
  const [lockedVisibleMaxPower, setLockedVisibleMaxPower] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasViewportWidth = refs.canvasRef.current?.clientWidth || 0;
  const axisWidth = Math.max(canvasViewportWidth, segmentsWidth);
  const programRows = useMemo(
    () =>
      buildProgramRows({
        bars,
        sportType,
        durationType,
        ftp,
      }),
    [bars, sportType, durationType, ftp],
  );
  const maxWorkoutPower = useMemo(
    () =>
      bars.reduce((maxPower, bar) => {
        if (bar.type === "bar") {
          return Math.max(maxPower, bar.power || 0);
        }
        if (bar.type === "trapeze") {
          return Math.max(maxPower, bar.startPower || 0, bar.endPower || 0);
        }
        if (bar.type === "interval") {
          return Math.max(maxPower, bar.onPower || 0, bar.offPower || 0);
        }
        return maxPower;
      }, Zones.Z6.max),
    [bars],
  );
  const liveVisibleMaxPower = Math.max(Zones.Z6.max, maxWorkoutPower * 1.05);
  const visibleMaxPower = isPowerResizeActive && lockedVisibleMaxPower ? lockedVisibleMaxPower : liveVisibleMaxPower;
  const maxEditablePower = Math.max(Zones.Z6.max * 1.8, visibleMaxPower * 1.6);
  const verticalPlotHeight = Math.max(220, shellViewportHeight - 58);
  const powerScale = verticalPlotHeight / visibleMaxPower;

  const handleVerticalResizeStart = useCallback(() => {
    setIsPowerResizeActive(true);
    setLockedVisibleMaxPower((currentPower) => currentPower ?? liveVisibleMaxPower);
  }, [liveVisibleMaxPower]);

  const handleVerticalResizeEnd = useCallback(() => {
    setIsPowerResizeActive(false);
    setLockedVisibleMaxPower(null);
  }, []);

  const recalculateShellHeight = useCallback(() => {
    const sectionElement = sectionRef.current;
    const shellElement = shellRef.current;
    if (!sectionElement || !shellElement) {
      return;
    }

    const scrollRoot = sectionElement.closest<HTMLElement>("[data-editor-scroll-root='true']");
    if (!scrollRoot) {
      setDynamicShellHeight(undefined);
      return;
    }

    const scrollRootRect = scrollRoot.getBoundingClientRect();
    const sectionRect = sectionElement.getBoundingClientRect();
    const shellRect = shellElement.getBoundingClientRect();
    const scrollRootPaddingBottom = Number.parseFloat(window.getComputedStyle(scrollRoot).paddingBottom || "0") || 0;
    const sectionBottomOffset = sectionRect.bottom - shellRect.bottom;
    const availableHeight =
      scrollRootRect.bottom - scrollRootPaddingBottom - shellRect.top - Math.max(0, sectionBottomOffset);
    const maxAllowedHeight = Math.floor(Math.min(700, availableHeight));
    const minimumShellHeight = window.matchMedia("(max-width: 900px)").matches ? 390 : 430;
    const nextHeight = maxAllowedHeight >= minimumShellHeight ? maxAllowedHeight : undefined;
    const measuredShellHeight = Math.max(1, shellRect.height);

    setShellViewportHeight((currentHeight) => {
      if (Math.abs(currentHeight - measuredShellHeight) <= 1) {
        return currentHeight;
      }

      return measuredShellHeight;
    });

    setDynamicShellHeight((currentHeight) => {
      if (currentHeight === nextHeight) {
        return currentHeight;
      }

      if (currentHeight !== undefined && nextHeight !== undefined && Math.abs(currentHeight - nextHeight) <= 1) {
        return currentHeight;
      }

      return nextHeight;
    });
  }, []);

  useLayoutEffect(() => {
    recalculateShellHeight();
  }, [recalculateShellHeight, programVisible]);

  useEffect(() => {
    const handleResize = () => recalculateShellHeight();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [recalculateShellHeight]);

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

  const renderBar = (bar: (typeof bars)[number]) => (
    <Bar
      key={bar.id}
      id={bar.id}
      time={bar.time}
      length={bar.length || 200}
      power={bar.power || 100}
      cadence={bar.cadence}
      ftp={ftp}
      weight={weight}
      sportType={sportType}
      durationType={durationType}
      paceUnitType={paceUnitType}
      pace={bar.pace || 0}
      speed={helpers.calculateSpeed(bar.pace || 0)}
      powerScale={powerScale}
      maxEditablePower={maxEditablePower}
      onVerticalResizeStart={handleVerticalResizeStart}
      onVerticalResizeEnd={handleVerticalResizeEnd}
      onChange={(id: string, value: BarType) => actions.handleOnChange(id, value)}
      onClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
      showLabel={true}
    />
  );

  const renderTrapeze = (bar: (typeof bars)[number]) => (
    <RightTrapezoid
      key={bar.id}
      id={bar.id}
      time={bar.time}
      length={bar.length || 200}
      cadence={bar.cadence}
      startPower={bar.startPower || 80}
      endPower={bar.endPower || 160}
      ftp={ftp}
      sportType={sportType}
      durationType={durationType}
      paceUnitType={paceUnitType}
      pace={bar.pace || 0}
      speed={helpers.calculateSpeed(bar.pace || 0)}
      powerScale={powerScale}
      maxEditablePower={maxEditablePower}
      onVerticalResizeStart={handleVerticalResizeStart}
      onVerticalResizeEnd={handleVerticalResizeEnd}
      onChange={(id: string, value: BarType) => actions.handleOnChange(id, value)}
      onClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderFreeRide = (bar: (typeof bars)[number]) => (
    <FreeRide
      key={bar.id}
      id={bar.id}
      time={bar.time}
      length={bar.length}
      cadence={bar.cadence}
      durationType={durationType}
      sportType={sportType}
      onChange={(id: string, value: BarType) => actions.handleOnChange(id, value)}
      onClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderInterval = (bar: (typeof bars)[number]) => (
    <Interval
      key={bar.id}
      id={bar.id}
      repeat={bar.repeat || 3}
      onDuration={bar.onDuration || 10}
      offDuration={bar.offDuration || 50}
      onPower={bar.onPower || 250}
      offPower={bar.offPower || 120}
      onLength={bar.onLength || 200}
      offLength={bar.offLength || 200}
      cadence={bar.cadence}
      restingCadence={bar.restingCadence || 0}
      ftp={ftp}
      weight={weight}
      sportType={sportType}
      durationType={durationType}
      pace={bar.pace || 0}
      speed={helpers.calculateSpeed(bar.pace || 0)}
      powerScale={powerScale}
      maxEditablePower={maxEditablePower}
      onVerticalResizeStart={handleVerticalResizeStart}
      onVerticalResizeEnd={handleVerticalResizeEnd}
      handleIntervalChange={(id: string, value: BarType) => actions.handleOnChange(id, value)}
      handleIntervalClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderComment = (instruction: (typeof instructions)[number], index: number) => (
    <Comment
      key={instruction.id}
      instruction={instruction}
      durationType={durationType}
      width={axisWidth}
      onChange={(id: string, values: Instruction) => actions.changeInstruction(id, values)}
      onClick={(id: string) => state.setSelectedInstruction(instructions.find((item) => item.id === id))}
      index={index}
    />
  );

  return (
    <section
      ref={sectionRef}
      className="rounded-3xl border border-white/50 bg-white/95 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-4"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Build Workout</p>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition",
            programVisible
              ? "border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-100"
              : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800",
          )}
          onClick={() => setProgramVisible((value) => !value)}
          aria-pressed={programVisible}
        >
          <ListOrdered className="h-3.5 w-3.5" />
          {programVisible ? "Hide Program" : "Show Program"}
        </button>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:gap-6">
        <aside className="flex shrink-0 flex-col gap-2 xl:w-36">
          {sportType === "bike" ? (
            <>
              <Tooltip id="text-editor-tooltip" />
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600"
                  onClick={() => helpers.toggleTextEditor()}
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
                    onClick={() => actions.addBar(zoneButton.zone)}
                    style={{ backgroundColor: zoneButton.color, color: zoneButton.textColor }}
                  >
                    {zoneButton.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button type="button" className={segmentToolButtonClass} onClick={() => actions.addBar(1, 300, 0, 0, 1000)}>
              <SteadyLogo className="h-5 w-5" /> Steady Pace
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <button type="button" className={segmentToolButtonClass} onClick={() => actions.addTrapeze(0.25, 0.75)}>
              <WarmupLogo className="h-5 w-5" /> Warm Up
            </button>
            <button type="button" className={segmentToolButtonClass} onClick={() => actions.addTrapeze(0.75, 0.25)}>
              <CooldownLogo className="h-5 w-5" /> Cool Down
            </button>
            <button type="button" className={segmentToolButtonClass} onClick={() => actions.addInterval()}>
              <IntervalLogo className="h-5 w-5" /> Interval
            </button>
            <button type="button" className={segmentToolButtonClass} onClick={() => actions.addFreeRide()}>
              {sportType === "bike" ? <Bike className="h-4 w-4" /> : <Footprints className="h-4 w-4" />} Free{" "}
              {sportType === "bike" ? "Ride" : "Run"}
            </button>
            <button type="button" className={segmentToolButtonClass} onClick={() => actions.addInstruction()}>
              <MessageSquare className="h-4 w-4" /> Text Event
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className={cn("grid gap-3", programVisible && "2xl:grid-cols-[minmax(0,1fr)_20rem]")}>
            <div className="min-w-0">
              <div id="editor" ref={shellRef} className="editor-shell" style={{ height: dynamicShellHeight }}>
                {actionId && (
                  <div className="editor-actions">
                    <button
                      type="button"
                      onClick={() => actions.moveLeft(actionId)}
                      title="Move Left"
                      className="editor-action-button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.moveRight(actionId)}
                      title="Move Right"
                      className="editor-action-button"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.removeBar(actionId)}
                      title="Delete"
                      className="editor-action-button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.duplicateBar(actionId)}
                      title="Duplicate"
                      className="editor-action-button"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {sportType === "run" && (
                      <select
                        name="pace"
                        value={actions.getPace(actionId)}
                        onChange={(event) => actions.setPace(event.target.value, actionId)}
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
                <div className="canvas" ref={refs.canvasRef}>
                  {actionId && (
                    <div
                      className="fader"
                      style={{ width: refs.canvasRef.current?.scrollWidth }}
                      onClick={() => state.setActionId(undefined)}
                    ></div>
                  )}
                  <div className="segments" ref={refs.segmentsRef}>
                    {bars.map((bar) => {
                      if (bar.type === "bar") {
                        return renderBar(bar);
                      }
                      if (bar.type === "trapeze") {
                        return renderTrapeze(bar);
                      }
                      if (bar.type === "freeRide") {
                        return renderFreeRide(bar);
                      }
                      if (bar.type === "interval") {
                        return renderInterval(bar);
                      }
                      return false;
                    })}
                  </div>

                  <div className="slider">
                    {instructions.map((instruction, index) => renderComment(instruction, index))}
                  </div>

                  {durationType === "time" ? <TimeAxis width={axisWidth} /> : <DistanceAxis width={axisWidth} />}
                </div>

                <ZoneAxis powerScale={powerScale} />
              </div>
            </div>

            {programVisible && (
              <WorkoutProgramPanel
                rows={programRows}
                selectedSegmentId={actionId}
                onSelectSegment={(segmentId: string) =>
                  state.setActionId((currentId) => (currentId === segmentId ? undefined : segmentId))
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

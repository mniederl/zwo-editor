import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListOrdered } from "lucide-react";

import { Zones } from "@/domain/workout/zones";
import buildProgramRows from "./buildProgramRows";
import DistanceAxis from "./DistanceAxis";
import {
  useEditorActionsContext,
  useEditorHelpersContext,
  useEditorRefsContext,
  useEditorStateContext,
} from "./EditorContext";
import type { FreeRideSegment, Instruction, IntervalSegment, RampSegment, SteadySegment } from "@/domain/workout/types";
import TimeAxis from "./TimeAxis";
import useSegmentReorder from "./useSegmentReorder";
import useWorkoutBuilderLayout from "./useWorkoutBuilderLayout";
import SelectedSegmentActions from "./SelectedSegmentActions";
import WorkoutProgramPanel from "./WorkoutProgramPanel";
import WorkoutBuilderToolbar from "./WorkoutBuilderToolbar";
import ZoneAxis from "./ZoneAxis";
import { Bar, Comment, FreeRide, Interval, RightTrapezoid } from "@/components/WorkoutElements";
import { cn } from "@/utils/cssUtils";

export default function WorkoutBuilderPanel() {
  const state = useEditorStateContext();
  const actions = useEditorActionsContext();
  const helpers = useEditorHelpersContext();
  const refs = useEditorRefsContext();
  const { sportType, durationType, segmentsWidth, actionId, bars, instructions, ftp, weight, paceUnitType } = state;
  const dragReorderEnabled = !actionId;
  const [programVisible, setProgramVisible] = useState(true);
  const [isPowerResizeActive, setIsPowerResizeActive] = useState(false);
  const [lockedVisibleMaxPower, setLockedVisibleMaxPower] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const { dynamicShellHeight, shellViewportHeight, isProgramSideBySide } = useWorkoutBuilderLayout({
    programVisible,
    sectionRef,
    shellRef,
  });
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
          return Math.max(maxPower, bar.power);
        }
        if (bar.type === "trapeze") {
          return Math.max(maxPower, bar.startPower, bar.endPower);
        }
        if (bar.type === "interval") {
          return Math.max(maxPower, bar.onPower, bar.offPower);
        }
        return maxPower;
      }, Zones.Z6.max),
    [bars],
  );
  const liveVisibleMaxPower = Math.max(Zones.Z6.max, maxWorkoutPower * 1.05);
  const visibleMaxPower = isPowerResizeActive && lockedVisibleMaxPower ? lockedVisibleMaxPower : liveVisibleMaxPower;
  const maxEditablePower = Math.max(Zones.Z6.max * 1.8, visibleMaxPower * 1.6);
  const canvasAxisHeight = 42;
  const canvasBottomInset = 6;
  const canvasTopPadding = 28;
  const verticalPlotHeight = Math.max(
    220,
    shellViewportHeight - (canvasAxisHeight + canvasBottomInset + canvasTopPadding),
  );
  const canvasTopZoneFillHeight = Math.max(0, shellViewportHeight - (canvasAxisHeight + canvasBottomInset) - verticalPlotHeight);
  const z6BackgroundTint = "rgba(233, 0, 0, 0.088)";
  const powerScale = verticalPlotHeight / visibleMaxPower;
  const canvasZoneBackground = useMemo(() => {
    const zoneBands = [
      { max: Zones.Z1.max, color: "rgba(128, 127, 128, 0.105)" },
      { max: Zones.Z2.max, color: "rgba(14, 144, 212, 0.102)" },
      { max: Zones.Z3.max, color: "rgba(0, 196, 106, 0.102)" },
      { max: Zones.Z4.max, color: "rgba(255, 203, 0, 0.098)" },
      { max: Zones.Z5.max, color: "rgba(255, 100, 48, 0.104)" },
      { max: Number.POSITIVE_INFINITY, color: z6BackgroundTint },
    ];

    let lowerBound = 0;
    const stops: string[] = [];

    zoneBands.forEach(({ max, color }) => {
      const upperBound = Math.min(max, visibleMaxPower);
      if (upperBound <= lowerBound) {
        return;
      }

      const from = (lowerBound / visibleMaxPower) * 100;
      const to = (upperBound / visibleMaxPower) * 100;
      stops.push(`${color} ${from.toFixed(3)}%`, `${color} ${to.toFixed(3)}%`);
      lowerBound = upperBound;
    });

    return `linear-gradient(to top, ${stops.join(", ")})`;
  }, [visibleMaxPower]);

  const handleVerticalResizeStart = useCallback(() => {
    setIsPowerResizeActive(true);
    setLockedVisibleMaxPower((currentPower) => currentPower ?? liveVisibleMaxPower);
  }, [liveVisibleMaxPower]);

  const handleVerticalResizeEnd = useCallback(() => {
    setIsPowerResizeActive(false);
    setLockedVisibleMaxPower(null);
  }, []);

  const {
    draggingBarId,
    dropMarkerX,
    handleSegmentDragStart,
    handleLaneDragOver,
    handleLaneDrop,
    handleSegmentDragEnd,
  } = useSegmentReorder({
    barIds: bars.map((bar) => bar.id),
    moveBarToIndex: actions.moveBarToIndex,
  });

  useEffect(() => {
    if (!dragReorderEnabled) {
      handleSegmentDragEnd();
    }
  }, [dragReorderEnabled, handleSegmentDragEnd]);

  const renderBar = (bar: SteadySegment) => (
    <Bar
      id={bar.id}
      time={bar.time}
      length={bar.length}
      power={bar.power}
      cadence={bar.cadence}
      ftp={ftp}
      weight={weight}
      sportType={sportType}
      durationType={durationType}
      paceUnitType={paceUnitType}
      pace={bar.pace ?? 0}
      speed={helpers.calculateSpeed(bar.pace ?? 0)}
      powerScale={powerScale}
      maxEditablePower={maxEditablePower}
      onVerticalResizeStart={handleVerticalResizeStart}
      onVerticalResizeEnd={handleVerticalResizeEnd}
      onChange={(id: string, value: SteadySegment) => actions.handleOnChange(id, value)}
      onClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
      showLabel={true}
    />
  );

  const renderTrapeze = (bar: RampSegment) => (
    <RightTrapezoid
      id={bar.id}
      time={bar.time}
      length={bar.length}
      cadence={bar.cadence}
      startPower={bar.startPower}
      endPower={bar.endPower}
      ftp={ftp}
      sportType={sportType}
      durationType={durationType}
      paceUnitType={paceUnitType}
      pace={bar.pace ?? 0}
      speed={helpers.calculateSpeed(bar.pace ?? 0)}
      powerScale={powerScale}
      maxEditablePower={maxEditablePower}
      onVerticalResizeStart={handleVerticalResizeStart}
      onVerticalResizeEnd={handleVerticalResizeEnd}
      onChange={(id: string, value: RampSegment) => actions.handleOnChange(id, value)}
      onClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderFreeRide = (bar: FreeRideSegment) => (
    <FreeRide
      id={bar.id}
      time={bar.time}
      length={bar.length}
      cadence={bar.cadence}
      durationType={durationType}
      sportType={sportType}
      onChange={(id: string, value: FreeRideSegment) => actions.handleOnChange(id, value)}
      onClick={(id: string) => actions.handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderInterval = (bar: IntervalSegment) => (
    <Interval
      id={bar.id}
      repeat={bar.repeat}
      onDuration={bar.onDuration}
      offDuration={bar.offDuration}
      onPower={bar.onPower}
      offPower={bar.offPower}
      onLength={bar.onLength}
      offLength={bar.offLength}
      cadence={bar.cadence}
      restingCadence={bar.restingCadence}
      ftp={ftp}
      weight={weight}
      sportType={sportType}
      durationType={durationType}
      pace={bar.pace ?? 0}
      speed={helpers.calculateSpeed(bar.pace ?? 0)}
      powerScale={powerScale}
      maxEditablePower={maxEditablePower}
      onVerticalResizeStart={handleVerticalResizeStart}
      onVerticalResizeEnd={handleVerticalResizeEnd}
      handleIntervalChange={(id: string, value: IntervalSegment) => actions.handleOnChange(id, value)}
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
        <WorkoutBuilderToolbar
          sportType={sportType}
          onToggleTextEditor={helpers.toggleTextEditor}
          addBar={actions.addBar}
          addTrapeze={actions.addTrapeze}
          addInterval={() => actions.addInterval()}
          addFreeRide={actions.addFreeRide}
          addInstruction={actions.addInstruction}
        />

        <div className="min-w-0 flex-1">
          <div className={cn("grid min-h-0 gap-3", programVisible && "2xl:grid-cols-[minmax(0,1fr)_20rem]")}>
            <div className="min-w-0">
              <div id="editor" ref={shellRef} className="editor-shell" style={{ height: dynamicShellHeight }}>
                {actionId && <SelectedSegmentActions actionId={actionId} actions={actions} sportType={sportType} />}
                <div className="canvas" ref={refs.canvasRef}>
                  <div
                    className="canvas-zone-background"
                    style={{
                      width: axisWidth,
                      height: verticalPlotHeight,
                      bottom: canvasAxisHeight,
                      backgroundImage: canvasZoneBackground,
                    }}
                  />
                  {canvasTopZoneFillHeight > 0 && (
                    <div
                      className="canvas-zone-top-fill"
                      style={{
                        width: axisWidth,
                        height: canvasTopZoneFillHeight,
                        bottom: canvasAxisHeight + verticalPlotHeight,
                        backgroundColor: z6BackgroundTint,
                      }}
                    />
                  )}
                  {actionId && (
                    <div
                      className="fader"
                      style={{ width: refs.canvasRef.current?.scrollWidth }}
                      onClick={() => state.setActionId(undefined)}
                    ></div>
                  )}
                  <div
                    className="segments"
                    ref={refs.segmentsRef}
                    onDragOver={dragReorderEnabled ? handleLaneDragOver : undefined}
                    onDrop={dragReorderEnabled ? handleLaneDrop : undefined}
                  >
                    {bars.map((bar) => {
                      let content: ReturnType<typeof renderBar> | null = null;
                      if (bar.type === "bar") {
                        content = renderBar(bar);
                      } else if (bar.type === "trapeze") {
                        content = renderTrapeze(bar);
                      } else if (bar.type === "freeRide") {
                        content = renderFreeRide(bar);
                      } else if (bar.type === "interval") {
                        content = renderInterval(bar);
                      }

                      if (!content) {
                        return null;
                      }

                      return (
                        <div
                          key={bar.id}
                          className={cn(
                            "segment-dnd-item",
                            dragReorderEnabled && draggingBarId === bar.id && "segment-dnd-item-dragging",
                          )}
                          draggable={dragReorderEnabled}
                          onDragStart={dragReorderEnabled ? (event) => handleSegmentDragStart(event, bar.id) : undefined}
                          onDragEnd={dragReorderEnabled ? handleSegmentDragEnd : undefined}
                          title={dragReorderEnabled ? "Hold Alt and drag to reorder" : undefined}
                        >
                          {content}
                        </div>
                      );
                    })}
                    {dragReorderEnabled && dropMarkerX !== null && (
                      <div className="segment-dnd-drop-indicator" style={{ left: dropMarkerX }} />
                    )}
                  </div>

                  <div className="slider">
                    {instructions.map((instruction, index) => renderComment(instruction, index))}
                  </div>

                  {durationType === "time" ? <TimeAxis width={axisWidth} /> : <DistanceAxis width={axisWidth} />}
                </div>

                <ZoneAxis powerScale={powerScale} visibleMaxPower={visibleMaxPower} />
              </div>
            </div>

            {programVisible && (
              <div className="min-h-0" style={isProgramSideBySide ? { height: shellViewportHeight } : undefined}>
                <WorkoutProgramPanel
                  rows={programRows}
                  selectedSegmentId={actionId}
                  onSelectSegment={(segmentId: string) =>
                    state.setActionId((currentId) => (currentId === segmentId ? undefined : segmentId))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

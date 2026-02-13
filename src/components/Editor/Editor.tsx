import { useRef } from "react";
import { CircleX } from "lucide-react";

import { getStressScore, getWorkoutDistance, getWorkoutLength, getWorkoutPace, round } from "../helpers";
import { EditorProvider } from "./EditorContext";
import EditorHeaderPanel from "./EditorHeaderPanel";
import type { Instruction, SportType } from "./editorTypes";
import TextComposerPanel from "./TextComposerPanel";
import useEditorState from "./useEditorState";
import useWorkoutActions from "./useWorkoutActions";
import useWorkoutIO from "./useWorkoutIO";
import WorkoutBuilderPanel from "./WorkoutBuilderPanel";
import { EditComment } from "@/components/WorkoutElements";
import parseWorkoutText from "@/parsers/parseWorkoutText";
import { cn } from "@/utils/cssUtils";
import { formatTime, parseTime } from "@/utils/time";

import "./Editor.css";

type EditorProps = { id: string };

const Editor = ({ id }: EditorProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const state = useEditorState({ id, segmentsRef });

  function calculateSpeed(pace: number = 0) {
    if (state.sportType === "bike") return 0;

    const distances = [1.60934, 5, 10, 21.0975, 42.195];
    const times = [
      state.runningTimes.oneMile,
      state.runningTimes.fiveKm,
      state.runningTimes.tenKm,
      state.runningTimes.halfMarathon,
      state.runningTimes.marathon,
    ];
    const selected = times[pace];
    if (!selected) return 0;

    try {
      return (distances[pace] * 1000) / parseTime(selected);
    } catch {
      return 0;
    }
  }

  const actions = useWorkoutActions({
    bars: state.bars,
    setBars: state.setBars,
    instructions: state.instructions,
    setInstructions: state.setInstructions,
    actionId: state.actionId,
    setActionId: state.setActionId,
    durationType: state.durationType,
    ftp: state.ftp,
    calculateSpeed,
    setWorkoutId: state.setWorkoutId,
    setName: state.setName,
    setDescription: state.setDescription,
    setAuthor: state.setAuthor,
    setTags: state.setTags,
  });

  const io = useWorkoutIO({
    workoutId: state.workoutId,
    author: state.author,
    name: state.name,
    description: state.description,
    sportType: state.sportType,
    durationType: state.durationType,
    tags: state.tags,
    bars: state.bars,
    instructions: state.instructions,
    setBars: state.setBars,
    setInstructions: state.setInstructions,
    setAuthor: state.setAuthor,
    setName: state.setName,
    setDescription: state.setDescription,
    setTags: state.setTags,
    setSportType: state.setSportType,
    setDurationType: state.setDurationType,
    setMessage: state.setMessage,
  });

  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    const actionId = state.actionId || "";
    // Normalize key names to avoid capitalized object keys that trigger Biome's nested-component false positive.
    const normalizedKey = event.key.charAt(0).toLowerCase() + event.key.slice(1);
    const actionByKey: Record<string, () => void> = {
      backspace: () => actions.removeBar(actionId),
      arrowLeft: () => actions.removeTimeFromBar(actionId),
      arrowRight: () => actions.addTimeToBar(actionId),
      arrowUp: () => actions.addPowerToBar(actionId),
      arrowDown: () => actions.removePowerFromBar(actionId),
    };

    actionByKey[normalizedKey]?.();
  }

  function switchSportType(newSportType: SportType) {
    state.setSportType(newSportType);
    state.setDurationType(newSportType === "bike" ? "time" : "distance");
  }

  function toggleTextEditor() {
    if (state.bars.length > 0 && !state.textEditorIsVisible) {
      if (window.confirm("Editing a workout from the text editor will overwrite current workout")) {
        state.setTextEditorIsVisible(!state.textEditorIsVisible);
      }
    } else {
      state.setTextEditorIsVisible(!state.textEditorIsVisible);
    }
  }

  function transformTextToWorkout(textValue: string) {
    if (!textValue.trim()) {
      state.setBars([]);
      state.setInstructions([]);
      return;
    }

    try {
      const parsed = parseWorkoutText(textValue, {
        durationType: state.durationType,
        ftp: state.ftp,
        weight: state.weight,
        calculateSpeed,
      });
      state.setBars(parsed.segments);
      state.setInstructions(parsed.instructions);
      if (state.message?.class === "error") state.setMessage(undefined);
    } catch (error) {
      state.setBars([]);
      state.setInstructions([]);
      state.setMessage({
        visible: true,
        class: "error",
        text: error instanceof Error ? error.message : "Unable to parse workout text",
      });
    }
  }

  const normalizeEditableText = (value: string) => value.replace(/\u00A0/g, " ").trim();

  const barsForMetrics = state.bars as Parameters<typeof getWorkoutLength>[0];
  const barsForDistance = state.bars.filter((bar) => bar.type !== "freeRide") as Parameters<
    typeof getWorkoutDistance
  >[0];

  const metrics = {
    workoutTime: formatTime(getWorkoutLength(barsForMetrics, state.durationType)),
    workoutDistance: getWorkoutDistance(barsForDistance),
    trainingLoad: round(getStressScore(barsForMetrics, state.ftp), 1),
    averagePace: getWorkoutPace(barsForMetrics, state.durationType, state.paceUnitType),
  };

  const helpers = {
    calculateSpeed,
    normalizeEditableText,
    switchSportType,
    toggleTextEditor,
    transformTextToWorkout,
  };

  const refs = {
    canvasRef,
    segmentsRef,
    uploadInputRef,
  };

  const contextValue = {
    state,
    actions,
    io,
    metrics,
    helpers,
    refs,
  };

  const messageToneClass = cn(
    "border-emerald-200 bg-emerald-50 text-emerald-700",
    state.message?.class === "error" && "border-rose-200 bg-rose-50 text-rose-700",
    state.message?.class === "loading" && "border-slate-800 bg-slate-900 text-slate-100",
  );

  return (
    <EditorProvider value={contextValue}>
      <div
        data-editor-scroll-root="true"
        className="relative h-full overflow-y-auto overflow-x-hidden px-3 py-3 md:px-5 md:py-5"
        onKeyDown={handleKeyPress}
        tabIndex={0}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-28 -left-30 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(8,145,178,0.25)_0%,rgba(8,145,178,0)_70%)]" />
          <div className="absolute top-24 -right-35 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(14,165,133,0.26)_0%,rgba(14,165,133,0)_70%)]" />
          <div className="absolute -bottom-27.5 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.22)_0%,rgba(2,132,199,0)_70%)]" />
        </div>

        <div className="mx-auto flex w-full max-w-380 flex-col gap-3">
          {state.message?.visible && (
            <div
              className={`fixed left-1/2 top-6 z-1000 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-2xl border px-4 py-3 shadow-lg ${messageToneClass}`}
            >
              <p className="pr-3 text-sm font-semibold">{state.message.text}</p>
              <button
                type="button"
                className={cn(
                  "rounded-full p-1 transition",
                  state.message.class === "loading"
                    ? "text-slate-100 hover:bg-white/15"
                    : "text-current hover:bg-black/10",
                )}
                onClick={() => state.setMessage({ visible: false })}
                aria-label="Dismiss message"
              >
                <CircleX className="h-4 w-4" />
              </button>
            </div>
          )}

          {state.selectedInstruction && (
            <EditComment
              instruction={state.selectedInstruction}
              onChange={(instructionId: string, values: Instruction) => {
                actions.changeInstruction(instructionId, values);
                state.setSelectedInstruction(undefined);
              }}
              dismiss={() => state.setSelectedInstruction(undefined)}
              onDelete={(instructionId: string) => {
                actions.deleteInstruction(instructionId);
                state.setSelectedInstruction(undefined);
              }}
            />
          )}

          <EditorHeaderPanel />
          <WorkoutBuilderPanel />
          <TextComposerPanel />
        </div>
      </div>
    </EditorProvider>
  );
};

export default Editor;

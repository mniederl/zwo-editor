import { useEffect, useRef, useState } from "react";
import { CircleX } from "lucide-react";

import { getStressScore, getWorkoutDistance, getWorkoutLength, getWorkoutPace, round } from "../helpers";
import { EditorProvider } from "./EditorContext";
import EditorHeaderPanel from "./EditorHeaderPanel";
import type { Instruction, SportType } from "./editorTypes";
import TextComposerPanel from "./TextComposerPanel";
import WorkoutLibraryPanel, { WorkoutLibraryCollapsedToggle } from "./WorkoutLibraryPanel";
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
const LIBRARY_OPEN_STORAGE_KEY = "editor.workoutLibrary.open";

const Editor = ({ id }: EditorProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const [storedLibraryOpen, setStoredLibraryOpen] = useState<boolean | null | undefined>(undefined);
  const [libraryLayoutInitialized, setLibraryLayoutInitialized] = useState(false);
  const [isMessageExiting, setIsMessageExiting] = useState(false);

  const state = useEditorState({ id, segmentsRef });

  useEffect(() => {
    const storedValue = window.localStorage.getItem(LIBRARY_OPEN_STORAGE_KEY);
    if (storedValue === "1") {
      setStoredLibraryOpen(true);
      return;
    }
    if (storedValue === "0") {
      setStoredLibraryOpen(false);
      return;
    }
    setStoredLibraryOpen(null);
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const wideDesktopQuery = window.matchMedia("(min-width: 2200px)");

    const updateLayout = () => {
      setIsDesktopLayout(desktopQuery.matches);
      setIsWideDesktop(wideDesktopQuery.matches);
    };

    updateLayout();
    desktopQuery.addEventListener("change", updateLayout);
    wideDesktopQuery.addEventListener("change", updateLayout);

    return () => {
      desktopQuery.removeEventListener("change", updateLayout);
      wideDesktopQuery.removeEventListener("change", updateLayout);
    };
  }, []);

  useEffect(() => {
    if (storedLibraryOpen === undefined) {
      return;
    }

    if (!isDesktopLayout) {
      return;
    }

    if (libraryLayoutInitialized) {
      return;
    }

    setLibraryOpen(storedLibraryOpen ?? isWideDesktop);
    setLibraryLayoutInitialized(true);
  }, [isDesktopLayout, isWideDesktop, libraryLayoutInitialized, storedLibraryOpen]);

  useEffect(() => {
    if (!libraryLayoutInitialized) {
      return;
    }
    window.localStorage.setItem(LIBRARY_OPEN_STORAGE_KEY, libraryOpen ? "1" : "0");
  }, [libraryLayoutInitialized, libraryOpen]);

  useEffect(() => {
    if (!state.message?.visible) {
      return;
    }

    setIsMessageExiting(false);

    if (state.message.class === "loading") {
      return;
    }

    const dismissTimer = window.setTimeout(() => {
      setIsMessageExiting(true);
      window.setTimeout(() => {
        state.setMessage(undefined);
      }, 220);
    }, 3200);

    return () => {
      window.clearTimeout(dismissTimer);
    };
  }, [state.message?.visible, state.message?.class, state.setMessage]);

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
      arrowLeft: () => (event.ctrlKey ? actions.moveLeft(actionId) : actions.removeTimeFromBar(actionId)),
      arrowRight: () => (event.ctrlKey ? actions.moveRight(actionId) : actions.addTimeToBar(actionId)),
      arrowUp: () => actions.addPowerToBar(actionId, event.shiftKey),
      arrowDown: () => actions.removePowerFromBar(actionId, event.shiftKey),
    };

    if (actionByKey[normalizedKey]) {
      event.preventDefault();
      actionByKey[normalizedKey]();
    }
  }

  function switchSportType(newSportType: SportType) {
    state.setSportType(newSportType);
    state.setDurationType(newSportType === "bike" ? "time" : "distance");
  }

  function toggleTextEditor() {
    const scrollToComposer = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const scrollRoot = document.querySelector<HTMLElement>("[data-editor-scroll-root='true']");
          if (!scrollRoot) {
            return;
          }

          scrollRoot.scrollTo({
            top: scrollRoot.scrollHeight,
            behavior: "smooth",
          });
        });
      });
    };

    if (state.bars.length > 0 && !state.textEditorIsVisible) {
      if (window.confirm("Editing a workout from the text editor will overwrite current workout")) {
        state.setTextEditorIsVisible(true);
        scrollToComposer();
      }
    } else {
      const nextVisible = !state.textEditorIsVisible;
      state.setTextEditorIsVisible(nextVisible);
      if (nextVisible) {
        scrollToComposer();
      }
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
        className="editor-page-scroll relative h-full overflow-y-scroll overflow-x-hidden px-3 py-3 md:px-5 md:py-5"
        onKeyDown={handleKeyPress}
        tabIndex={0}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-28 -left-30 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(8,145,178,0.25)_0%,rgba(8,145,178,0)_70%)]" />
          <div className="absolute top-24 -right-35 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(14,165,133,0.26)_0%,rgba(14,165,133,0)_70%)]" />
          <div className="absolute -bottom-27.5 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(2,132,199,0.22)_0%,rgba(2,132,199,0)_70%)]" />
        </div>

        <WorkoutLibraryCollapsedToggle
          hidden={!isDesktopLayout || !libraryLayoutInitialized || libraryOpen}
          onClick={() => setLibraryOpen(true)}
        />

        <div className="mx-auto flex w-full max-w-[132rem] items-start gap-3">
          <WorkoutLibraryPanel
            open={isDesktopLayout && libraryOpen}
            onToggle={() => setLibraryOpen(false)}
            isWideDesktop={isWideDesktop}
          />

          <div className="min-w-0 flex-1">
            <div className="mx-auto flex w-full max-w-380 flex-col gap-3">
          {state.message?.visible && (
            <div
              className={cn(
                "fixed bottom-3 right-3 z-1000 flex w-[calc(100%-1.5rem)] max-w-md items-center justify-between rounded-2xl border px-4 py-3 shadow-lg transition-all duration-200 md:bottom-5 md:right-5",
                isMessageExiting ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100",
                messageToneClass,
              )}
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
                onClick={() => {
                  setIsMessageExiting(true);
                  window.setTimeout(() => {
                    state.setMessage(undefined);
                  }, 220);
                }}
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
        </div>
      </div>
    </EditorProvider>
  );
};

export default Editor;

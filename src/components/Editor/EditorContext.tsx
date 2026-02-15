import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";

import type { SportType } from "@/domain/workout/types";
import type { EditorStateModel } from "./useEditorState";
import type { WorkoutActions } from "./useWorkoutActions";
import type { WorkoutIOActions } from "./useWorkoutIO";

export interface EditorMetricsModel {
  workoutTime: string;
  workoutDistance: number;
  trainingLoad: number;
  averagePace: string;
}

export interface EditorHelpersModel {
  calculateSpeed: (pace?: number) => number;
  normalizeEditableText: (value: string) => string;
  switchSportType: (newSportType: SportType) => void;
  toggleTextEditor: () => void;
  transformTextToWorkout: (textValue: string) => void;
}

export interface EditorRefsModel {
  canvasRef: RefObject<HTMLDivElement | null>;
  segmentsRef: RefObject<HTMLDivElement | null>;
  uploadInputRef: RefObject<HTMLInputElement | null>;
}

export interface EditorContextValue {
  state: EditorStateModel;
  actions: WorkoutActions;
  io: WorkoutIOActions;
  metrics: EditorMetricsModel;
  helpers: EditorHelpersModel;
  refs: EditorRefsModel;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  value,
  children,
}: {
  value: EditorContextValue;
  children: ReactNode;
}) {
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used inside an EditorProvider");
  }
  return context;
}

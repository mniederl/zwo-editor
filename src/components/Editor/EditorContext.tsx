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

const EditorStateContext = createContext<EditorStateModel | null>(null);
const EditorActionsContext = createContext<WorkoutActions | null>(null);
const EditorIOContext = createContext<WorkoutIOActions | null>(null);
const EditorMetricsContext = createContext<EditorMetricsModel | null>(null);
const EditorHelpersContext = createContext<EditorHelpersModel | null>(null);
const EditorRefsContext = createContext<EditorRefsModel | null>(null);

export function EditorProvider({
  value,
  children,
}: {
  value: EditorContextValue;
  children: ReactNode;
}) {
  return (
    <EditorStateContext.Provider value={value.state}>
      <EditorActionsContext.Provider value={value.actions}>
        <EditorIOContext.Provider value={value.io}>
          <EditorMetricsContext.Provider value={value.metrics}>
            <EditorHelpersContext.Provider value={value.helpers}>
              <EditorRefsContext.Provider value={value.refs}>{children}</EditorRefsContext.Provider>
            </EditorHelpersContext.Provider>
          </EditorMetricsContext.Provider>
        </EditorIOContext.Provider>
      </EditorActionsContext.Provider>
    </EditorStateContext.Provider>
  );
}

export function useEditorStateContext(): EditorStateModel {
  const context = useContext(EditorStateContext);
  if (!context) {
    throw new Error("useEditorStateContext must be used inside an EditorProvider");
  }
  return context;
}

export function useEditorActionsContext(): WorkoutActions {
  const context = useContext(EditorActionsContext);
  if (!context) {
    throw new Error("useEditorActionsContext must be used inside an EditorProvider");
  }
  return context;
}

export function useEditorIOContext(): WorkoutIOActions {
  const context = useContext(EditorIOContext);
  if (!context) {
    throw new Error("useEditorIOContext must be used inside an EditorProvider");
  }
  return context;
}

export function useEditorMetricsContext(): EditorMetricsModel {
  const context = useContext(EditorMetricsContext);
  if (!context) {
    throw new Error("useEditorMetricsContext must be used inside an EditorProvider");
  }
  return context;
}

export function useEditorHelpersContext(): EditorHelpersModel {
  const context = useContext(EditorHelpersContext);
  if (!context) {
    throw new Error("useEditorHelpersContext must be used inside an EditorProvider");
  }
  return context;
}

export function useEditorRefsContext(): EditorRefsModel {
  const context = useContext(EditorRefsContext);
  if (!context) {
    throw new Error("useEditorRefsContext must be used inside an EditorProvider");
  }
  return context;
}

export function useEditorContext(): EditorContextValue {
  return {
    state: useEditorStateContext(),
    actions: useEditorActionsContext(),
    io: useEditorIOContext(),
    metrics: useEditorMetricsContext(),
    helpers: useEditorHelpersContext(),
    refs: useEditorRefsContext(),
  };
}

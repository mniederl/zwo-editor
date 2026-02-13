import { useCallback, useEffect, useReducer, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { genShortId } from "@utils/id";

import { loadRunningTimes } from "./editorTypes";
import type { BarType, DurationType, Instruction, PaceUnitType, SportType } from "./editorTypes";
import type { RunningTimes } from "./RunningTimesEditor";

export interface EditorMessage {
  visible: boolean;
  class?: string;
  text?: string;
}

interface UseEditorStateProps {
  id: string;
  segmentsRef: RefObject<HTMLDivElement | null>;
}

interface WorkoutState {
  bars: BarType[];
  instructions: Instruction[];
  actionId: string | undefined;
}

type WorkoutStateAction =
  | { type: "setBars"; value: SetStateAction<BarType[]> }
  | { type: "setInstructions"; value: SetStateAction<Instruction[]> }
  | { type: "setActionId"; value: SetStateAction<string | undefined> };

const resolveStateAction = <T>(value: SetStateAction<T>, previous: T): T =>
  typeof value === "function" ? (value as (prev: T) => T)(previous) : value;

function workoutReducer(state: WorkoutState, action: WorkoutStateAction): WorkoutState {
  switch (action.type) {
    case "setBars":
      return { ...state, bars: resolveStateAction(action.value, state.bars) };
    case "setInstructions":
      return { ...state, instructions: resolveStateAction(action.value, state.instructions) };
    case "setActionId":
      return { ...state, actionId: resolveStateAction(action.value, state.actionId) };
    default:
      return state;
  }
}

export interface EditorStateModel {
  workoutId: string;
  setWorkoutId: Dispatch<SetStateAction<string>>;
  bars: BarType[];
  setBars: (value: SetStateAction<BarType[]>) => void;
  actionId: string | undefined;
  setActionId: (value: SetStateAction<string | undefined>) => void;
  ftp: number;
  setFtp: Dispatch<SetStateAction<number>>;
  weight: number;
  setWeight: Dispatch<SetStateAction<number>>;
  instructions: Instruction[];
  setInstructions: (value: SetStateAction<Instruction[]>) => void;
  tags: string[];
  setTags: Dispatch<SetStateAction<string[]>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  author: string;
  setAuthor: Dispatch<SetStateAction<string>>;
  segmentsWidth: number;
  message: EditorMessage | undefined;
  setMessage: Dispatch<SetStateAction<EditorMessage | undefined>>;
  sportType: SportType;
  setSportType: Dispatch<SetStateAction<SportType>>;
  durationType: DurationType;
  setDurationType: Dispatch<SetStateAction<DurationType>>;
  paceUnitType: PaceUnitType;
  setPaceUnitType: Dispatch<SetStateAction<PaceUnitType>>;
  runningTimes: RunningTimes;
  setRunningTimes: Dispatch<SetStateAction<RunningTimes>>;
  textEditorIsVisible: boolean;
  setTextEditorIsVisible: Dispatch<SetStateAction<boolean>>;
  selectedInstruction: Instruction | undefined;
  setSelectedInstruction: Dispatch<SetStateAction<Instruction | undefined>>;
  isMetaEditing: boolean;
  setIsMetaEditing: Dispatch<SetStateAction<boolean>>;
}

export default function useEditorState({ id, segmentsRef }: UseEditorStateProps): EditorStateModel {
  const [workoutId, setWorkoutId] = useState(id === "new" ? localStorage.getItem("id") || genShortId() : id);
  const [workoutState, dispatchWorkout] = useReducer(workoutReducer, {
    bars: JSON.parse(localStorage.getItem("currentWorkout") || "[]"),
    instructions: JSON.parse(localStorage.getItem("instructions") || "[]"),
    actionId: undefined,
  } as WorkoutState);
  const { bars, instructions, actionId } = workoutState;
  const setBars = useCallback(
    (value: SetStateAction<BarType[]>) => dispatchWorkout({ type: "setBars", value }),
    [],
  );
  const setInstructions = useCallback(
    (value: SetStateAction<Instruction[]>) => dispatchWorkout({ type: "setInstructions", value }),
    [],
  );
  const setActionId = useCallback(
    (value: SetStateAction<string | undefined>) => dispatchWorkout({ type: "setActionId", value }),
    [],
  );
  const [ftp, setFtp] = useState(Number.parseInt(localStorage.getItem("ftp") || "200", 10));
  const [weight, setWeight] = useState(Number.parseInt(localStorage.getItem("weight") || "75", 10));
  const [tags, setTags] = useState<string[]>(JSON.parse(localStorage.getItem("tags") || "[]"));

  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [description, setDescription] = useState(localStorage.getItem("description") || "");
  const [author, setAuthor] = useState(localStorage.getItem("author") || "");

  const [segmentsWidth, setSegmentsWidth] = useState(1320);
  const [message, setMessage] = useState<EditorMessage>();

  const [sportType, setSportType] = useState<SportType>((localStorage.getItem("sportType") as SportType) || "bike");
  const [durationType, setDurationType] = useState<DurationType>(
    (localStorage.getItem("durationType") as DurationType) || "time",
  );
  const [paceUnitType, setPaceUnitType] = useState<PaceUnitType>(
    (localStorage.getItem("paceUnitType") as PaceUnitType) || "metric",
  );

  const [runningTimes, setRunningTimes] = useState(loadRunningTimes());
  const [textEditorIsVisible, setTextEditorIsVisible] = useState(false);
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction>();
  const [isMetaEditing, setIsMetaEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem("currentWorkout", JSON.stringify(bars));
    localStorage.setItem("ftp", ftp.toString());

    localStorage.setItem("instructions", JSON.stringify(instructions));
    localStorage.setItem("weight", weight.toString());

    localStorage.setItem("name", name);
    localStorage.setItem("description", description);
    localStorage.setItem("author", author);
    localStorage.setItem("tags", JSON.stringify(tags));
    localStorage.setItem("sportType", sportType);
    localStorage.setItem("durationType", durationType);
    localStorage.setItem("paceUnitType", paceUnitType);

    localStorage.setItem("runningTimes", JSON.stringify(runningTimes));

    setSegmentsWidth(segmentsRef.current?.scrollWidth || 1320);
  }, [
    segmentsRef,
    bars,
    ftp,
    instructions,
    weight,
    name,
    description,
    author,
    tags,
    sportType,
    durationType,
    paceUnitType,
    runningTimes,
  ]);

  return {
    workoutId,
    setWorkoutId,
    bars,
    setBars,
    actionId,
    setActionId,
    ftp,
    setFtp,
    weight,
    setWeight,
    instructions,
    setInstructions,
    tags,
    setTags,
    name,
    setName,
    description,
    setDescription,
    author,
    setAuthor,
    segmentsWidth,
    message,
    setMessage,
    sportType,
    setSportType,
    durationType,
    setDurationType,
    paceUnitType,
    setPaceUnitType,
    runningTimes,
    setRunningTimes,
    textEditorIsVisible,
    setTextEditorIsVisible,
    selectedInstruction,
    setSelectedInstruction,
    isMetaEditing,
    setIsMetaEditing,
  };
}

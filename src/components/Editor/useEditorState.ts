import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { genShortId } from "@utils/id";

import { loadRunningTimes } from "./editorTypes";
import type { BarType, DurationType, Instruction, PaceUnitType, SportType } from "./editorTypes";

export interface EditorMessage {
  visible: boolean;
  class?: string;
  text?: string;
}

interface UseEditorStateProps {
  id: string;
  segmentsRef: RefObject<HTMLDivElement | null>;
}

export default function useEditorState({ id, segmentsRef }: UseEditorStateProps) {
  const [workoutId, setWorkoutId] = useState(id === "new" ? localStorage.getItem("id") || genShortId() : id);
  const [bars, setBars] = useState<Array<BarType>>(JSON.parse(localStorage.getItem("currentWorkout") || "[]"));
  const [actionId, setActionId] = useState<string | undefined>(undefined);
  const [ftp, setFtp] = useState(Number.parseInt(localStorage.getItem("ftp") || "200", 10));
  const [weight, setWeight] = useState(Number.parseInt(localStorage.getItem("weight") || "75", 10));
  const [instructions, setInstructions] = useState<Array<Instruction>>(
    JSON.parse(localStorage.getItem("instructions") || "[]"),
  );
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

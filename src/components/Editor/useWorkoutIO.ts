import type { Dispatch, SetStateAction } from "react";

import createWorkoutXml from "./createWorkoutXml";
import type { BarType, DurationType, Instruction, SportType } from "./editorTypes";
import type { EditorMessage } from "./useEditorState";
import parseWorkoutXml from "@/parsers/parseWorkoutXml";
import { genId } from "@/utils/id";

interface UseWorkoutIOProps {
  workoutId: string;
  author: string;
  name: string;
  description: string;
  sportType: SportType;
  durationType: DurationType;
  tags: string[];
  bars: BarType[];
  instructions: Instruction[];
  setBars: Dispatch<SetStateAction<BarType[]>>;
  setInstructions: Dispatch<SetStateAction<Instruction[]>>;
  setAuthor: Dispatch<SetStateAction<string>>;
  setName: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setTags: Dispatch<SetStateAction<string[]>>;
  setSportType: Dispatch<SetStateAction<SportType>>;
  setDurationType: Dispatch<SetStateAction<DurationType>>;
  setMessage: Dispatch<SetStateAction<EditorMessage | undefined>>;
}

export interface WorkoutIOActions {
  downloadWorkout: () => void;
  handleUpload: (file: Blob) => Promise<boolean>;
}

export default function useWorkoutIO({
  workoutId,
  author,
  name,
  description,
  sportType,
  durationType,
  tags,
  bars,
  instructions,
  setBars,
  setInstructions,
  setAuthor,
  setName,
  setDescription,
  setTags,
  setSportType,
  setDurationType,
  setMessage,
}: UseWorkoutIOProps): WorkoutIOActions {
  function save() {
    setMessage({ visible: true, class: "loading", text: "Saving.." });

    const xml = createWorkoutXml({
      author,
      name,
      description,
      sportType,
      durationType,
      tags,
      bars,
      instructions,
    });

    return new Blob([xml], { type: "application/xml" });
  }

  function downloadWorkout() {
    const tempFile = save();
    const url = window.URL.createObjectURL(tempFile);

    const anchor = document.createElement("a");
    document.body.appendChild(anchor);
    anchor.style.display = "none";
    anchor.href = url;
    anchor.download = `${workoutId}.zwo`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  function applyParsedWorkout(parsed: ReturnType<typeof parseWorkoutXml>) {
    setBars(parsed.segments);
    setInstructions(parsed.instructions);
    setAuthor(parsed.meta.author || "");
    setName(parsed.meta.name || "");
    setDescription(parsed.meta.description || "");
    setTags(parsed.meta.tags || []);
    setSportType(parsed.meta.sportType || "bike");
    setDurationType(parsed.meta.durationType || "time");
  }

  async function handleUpload(file: Blob) {
    if (bars.length > 0 && !window.confirm("Are you sure you want to create a new workout?")) {
      return false;
    }

    try {
      const xml = await file.text();
      const parsed = parseWorkoutXml(xml, { idGenerator: genId });
      applyParsedWorkout(parsed);
      setMessage({ visible: true, class: "success", text: "Workout imported." });
      return true;
    } catch (error) {
      console.error(error);
      setMessage({
        visible: true,
        class: "error",
        text: error instanceof Error ? error.message : "Unable to parse workout XML",
      });
      return false;
    }
  }

  return {
    downloadWorkout,
    handleUpload,
  };
}

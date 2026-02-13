import type { Dispatch, SetStateAction } from "react";

import { Zones } from "../constants";
import { calculateDistance, calculateTime, round } from "../helpers";
import type { BarType, DurationType, Instruction } from "./editorTypes";
import { genId, genShortId } from "@/utils/id";

interface UseWorkoutActionsProps {
  bars: BarType[];
  setBars: Dispatch<SetStateAction<BarType[]>>;
  instructions: Instruction[];
  setInstructions: Dispatch<SetStateAction<Instruction[]>>;
  actionId: string | undefined;
  setActionId: Dispatch<SetStateAction<string | undefined>>;
  durationType: DurationType;
  ftp: number;
  calculateSpeed: (pace?: number) => number;
  setWorkoutId: Dispatch<SetStateAction<string>>;
  setName: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setAuthor: Dispatch<SetStateAction<string>>;
  setTags: Dispatch<SetStateAction<string[]>>;
}

export interface WorkoutActions {
  newWorkout: () => void;
  handleOnChange: (id: string, values: BarType) => void;
  handleOnClick: (id: string) => void;
  addBar: (zone: number, duration?: number, cadence?: number, pace?: number, length?: number) => void;
  addTrapeze: (
    zone1: number,
    zone2: number,
    duration?: number,
    pace?: number,
    length?: number,
    cadence?: number,
  ) => void;
  addFreeRide: (duration?: number, cadence?: number, length?: number) => void;
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
  addInstruction: (text?: string, time?: number, length?: number) => void;
  changeInstruction: (id: string, values: Instruction) => void;
  deleteInstruction: (id: string) => void;
  removeBar: (id: string) => void;
  addTimeToBar: (id: string) => void;
  removeTimeFromBar: (id: string) => void;
  addPowerToBar: (id: string) => void;
  removePowerFromBar: (id: string) => void;
  duplicateBar: (id: string) => void;
  moveLeft: (id: string) => void;
  moveRight: (id: string) => void;
  setPace: (value: string, id: string) => void;
  getPace: (id: string) => number | undefined;
}

export default function useWorkoutActions({
  bars,
  setBars,
  instructions,
  setInstructions,
  actionId,
  setActionId,
  durationType,
  ftp,
  calculateSpeed,
  setWorkoutId,
  setName,
  setDescription,
  setAuthor,
  setTags,
}: UseWorkoutActionsProps): WorkoutActions {
  function newWorkout() {
    setWorkoutId(genShortId());
    setBars([]);
    setInstructions([]);
    setName("");
    setDescription("");
    setAuthor("");
    setTags([]);
  }

  function handleOnChange(id: string, values: BarType) {
    const index = bars.findIndex((bar) => bar.id === id);
    const updatedArray = [...bars];
    updatedArray[index] = values;
    setBars(updatedArray);
  }

  function handleOnClick(id: string) {
    setActionId(id === actionId ? undefined : id);
  }

  function addBar(zone: number, duration: number = 300, cadence: number = 0, pace: number = 0, length: number = 200) {
    setBars((currentBars) => [
      ...currentBars,
      {
        time: durationType === "time" ? duration : round(calculateTime(length, calculateSpeed(pace)), 1),
        length: durationType === "time" ? round(calculateDistance(duration, calculateSpeed(pace)), 1) : length,
        power: zone,
        cadence,
        type: "bar",
        id: genId(),
        pace,
      },
    ]);
  }

  function addTrapeze(
    zone1: number,
    zone2: number,
    duration: number = 300,
    pace: number = 0,
    length: number = 1000,
    cadence: number = 0,
  ) {
    setBars((currentBars) => [
      ...currentBars,
      {
        time: durationType === "time" ? duration : round(calculateTime(length, calculateSpeed(pace)), 1),
        length: durationType === "time" ? round(calculateDistance(duration, calculateSpeed(pace)), 1) : length,
        startPower: zone1,
        endPower: zone2,
        cadence,
        pace,
        type: "trapeze",
        id: genId(),
      },
    ]);
  }

  function addFreeRide(duration: number = 600, cadence: number = 0, length: number = 1000) {
    setBars((currentBars) => [
      ...currentBars,
      {
        time: durationType === "time" ? duration : 0,
        length: durationType === "time" ? 0 : length,
        cadence,
        type: "freeRide",
        id: genId(),
      },
    ]);
  }

  function addInterval(
    repeat: number = 3,
    onDuration: number = 30,
    offDuration: number = 120,
    onPower: number = 1,
    offPower: number = 0.5,
    cadence: number = 0,
    restingCadence: number = 0,
    pace: number = 0,
    onLength: number = 200,
    offLength: number = 200,
  ) {
    setBars((currentBars) => [
      ...currentBars,
      {
        time:
          durationType === "time"
            ? (onDuration + offDuration) * repeat
            : round(calculateTime((onLength + offLength) * repeat, calculateSpeed(pace)), 1),
        length:
          durationType === "time"
            ? round(calculateDistance((onDuration + offDuration) * repeat, calculateSpeed(pace)), 1)
            : (onLength + offLength) * repeat,
        id: genId(),
        type: "interval",
        cadence,
        restingCadence,
        repeat,
        onDuration:
          durationType === "time"
            ? onDuration
            : round(calculateTime((onLength * 1) / onPower, calculateSpeed(pace)), 1),
        offDuration:
          durationType === "time"
            ? offDuration
            : round(calculateTime((offLength * 1) / offPower, calculateSpeed(pace)), 1),
        onPower,
        offPower,
        pace,
        onLength:
          durationType === "time"
            ? round(calculateDistance((onDuration * 1) / onPower, calculateSpeed(pace)), 1)
            : onLength,
        offLength:
          durationType === "time"
            ? round(calculateDistance((offDuration * 1) / offPower, calculateSpeed(pace)), 1)
            : offLength,
      },
    ]);
  }

  function addInstruction(text = "", time = 0, length = 0) {
    setInstructions((currentInstructions) => [
      ...currentInstructions,
      {
        text,
        time,
        length,
        id: genId(),
      },
    ]);
  }

  function changeInstruction(id: string, values: Instruction) {
    const index = instructions.findIndex((item) => item.id === id);
    const updatedArray = [...instructions];
    updatedArray[index] = values;
    setInstructions(updatedArray);
  }

  function deleteInstruction(id: string) {
    const updatedArray = [...instructions];
    setInstructions(updatedArray.filter((item) => item.id !== id));
  }

  function removeBar(id: string) {
    const updatedArray = [...bars];
    setBars(updatedArray.filter((item) => item.id !== id));
    setActionId(undefined);
  }

  function addTimeToBar(id: string) {
    const updatedArray = [...bars];
    const index = updatedArray.findIndex((bar) => bar.id === id);
    const element = updatedArray[index];

    if (element && durationType === "time") {
      element.time += 5;
      element.length = (calculateDistance(element.time, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
      setBars(updatedArray);
    }

    if (element && durationType === "distance") {
      element.length = (element.length || 0) + 200;
      element.time = (calculateTime(element.length, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
      setBars(updatedArray);
    }
  }

  function removeTimeFromBar(id: string) {
    const updatedArray = [...bars];
    const index = updatedArray.findIndex((bar) => bar.id === id);
    const element = updatedArray[index];

    if (element && element.time > 5 && durationType === "time") {
      element.time -= 5;
      element.length = (calculateDistance(element.time, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
      setBars(updatedArray);
    }

    if (element && (element.length || 0) > 200 && durationType === "distance") {
      element.length = (element.length || 0) - 200;
      element.time = (calculateTime(element.length, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
      setBars(updatedArray);
    }
  }

  function addPowerToBar(id: string) {
    const updatedArray = [...bars];
    const index = updatedArray.findIndex((bar) => bar.id === id);
    const element = updatedArray[index];

    if (element?.power) {
      element.power = parseFloat((element.power + 1 / ftp).toFixed(3));

      if (durationType === "time") {
        element.length = (calculateDistance(element.time, calculateSpeed(element.pace || 0)) * 1) / element.power;
      } else {
        element.time = (calculateTime(element.length || 0, calculateSpeed(element.pace || 0)) * 1) / element.power;
      }

      setBars(updatedArray);
    }
  }

  function removePowerFromBar(id: string) {
    const updatedArray = [...bars];
    const index = updatedArray.findIndex((bar) => bar.id === id);
    const element = updatedArray[index];

    if (element?.power && element.power >= Zones.Z1.min) {
      element.power = parseFloat((element.power - 1 / ftp).toFixed(3));

      if (durationType === "time") {
        element.length = (calculateDistance(element.time, calculateSpeed(element.pace || 0)) * 1) / element.power;
      } else {
        element.time = (calculateTime(element.length || 0, calculateSpeed(element.pace || 0)) * 1) / element.power;
      }

      setBars(updatedArray);
    }
  }

  function duplicateBar(id: string) {
    const index = bars.findIndex((bar) => bar.id === id);
    const element = [...bars][index];

    switch (element.type) {
      case "bar":
        addBar(element.power || 80, element.time, element.cadence, element.pace, element.length);
        break;
      case "freeRide":
        addFreeRide(element.time, element.cadence, element.length);
        break;
      case "trapeze":
        addTrapeze(
          element.startPower || 80,
          element.endPower || 160,
          element.time,
          element.pace || 0,
          element.length,
          element.cadence,
        );
        break;
      case "interval":
        addInterval(
          element.repeat,
          element.onDuration,
          element.offDuration,
          element.onPower,
          element.offPower,
          element.cadence,
          element.restingCadence,
          element.pace,
          element.onLength,
          element.offLength,
        );
        break;
    }

    setActionId(undefined);
  }

  function moveLeft(id: string) {
    const index = bars.findIndex((bar) => bar.id === id);
    if (index > 0) {
      const updatedArray = [...bars];
      const element = [...bars][index];
      updatedArray.splice(index, 1);
      updatedArray.splice(index - 1, 0, element);
      setBars(updatedArray);
    }
  }

  function moveRight(id: string) {
    const index = bars.findIndex((bar) => bar.id === id);
    if (index < bars.length - 1) {
      const updatedArray = [...bars];
      const element = [...bars][index];
      updatedArray.splice(index, 1);
      updatedArray.splice(index + 1, 0, element);
      setBars(updatedArray);
    }
  }

  function setPace(value: string, id: string) {
    const index = bars.findIndex((bar) => bar.id === id);
    if (index !== -1) {
      const updatedArray = [...bars];
      const element = [...updatedArray][index];
      element.pace = Number.parseInt(value, 10);

      if (durationType === "time") {
        element.length = (calculateDistance(element.time, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
      } else {
        element.time = (calculateTime(element.length || 0, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
      }

      setBars(updatedArray);
    }
  }

  function getPace(id: string) {
    const index = bars.findIndex((bar) => bar.id === id);
    if (index !== -1) {
      const element = [...bars][index];
      return element.pace;
    }
  }

  return {
    newWorkout,
    handleOnChange,
    handleOnClick,
    addBar,
    addTrapeze,
    addFreeRide,
    addInterval,
    addInstruction,
    changeInstruction,
    deleteInstruction,
    removeBar,
    addTimeToBar,
    removeTimeFromBar,
    addPowerToBar,
    removePowerFromBar,
    duplicateBar,
    moveLeft,
    moveRight,
    setPace,
    getPace,
  };
}

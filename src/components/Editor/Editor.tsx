import { useEffect, useRef, useState } from "react";
import {
  faArrowLeft,
  faArrowRight,
  faBicycle,
  faBiking,
  faClock,
  faComment,
  faCopy,
  faDownload,
  faFile,
  faPen,
  faRuler,
  faRunning,
  faTimesCircle,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";

import { genId, genShortId } from "@utils/id";
import { formatTime, parseTime } from "@utils/time";
import { CooldownLogo, IntervalLogo, SteadyLogo, WarmupLogo } from "../../assets";
import parseWorkoutText from "../../parsers/parseWorkoutText";
import parseWorkoutXml from "../../parsers/parseWorkoutXml";
import Bar from "../Bar/Bar";
import Comment from "../Comment/Comment";
import EditComment from "../Comment/EditComment";
import { Colors, Zones } from "../constants";
import FreeRide from "../FreeRide/FreeRide";
import {
  calculateDistance,
  calculateTime,
  getStressScore,
  getWorkoutDistance,
  getWorkoutLength,
  getWorkoutPace,
  round,
} from "../helpers";
import Interval from "../Interval/Interval";
import RightTrapezoid from "../Trapeze/Trapeze";
import createWorkoutXml from "./createWorkoutXml";
import DistanceAxis from "./DistanceAxis";
import LeftRightToggle from "./LeftRightToggle";
import RunningTimesEditor, { type RunningTimes } from "./RunningTimesEditor";
import TimeAxis from "./TimeAxis";
import ZoneAxis from "./ZoneAxis";

import "./Editor.css";

export interface BarType {
  id: string;
  time: number;
  length?: number;
  type: string;
  power?: number;
  startPower?: number;
  endPower?: number;
  cadence: number;
  restingCadence?: number;
  onPower?: number;
  offPower?: number;
  onDuration?: number;
  offDuration?: number;
  repeat?: number;
  pace?: number;
  onLength?: number;
  offLength?: number;
}

export interface Instruction {
  id: string;
  text: string;
  time: number;
  length: number;
}

interface Message {
  visible: boolean;
  class?: string;
  text?: string;
}

const loadRunningTimes = (): RunningTimes => {
  const missingRunningTimes: RunningTimes = {
    oneMile: "",
    fiveKm: "",
    tenKm: "",
    halfMarathon: "",
    marathon: "",
  };
  const runningTimesJson = localStorage.getItem("runningTimes");
  if (runningTimesJson) {
    return JSON.parse(runningTimesJson);
  }

  // Fallback to old localStorage keys
  const oneMile = localStorage.getItem("oneMileTime") || "";
  const fiveKm = localStorage.getItem("fiveKmTime") || "";
  const tenKm = localStorage.getItem("tenKmTime") || "";
  const halfMarathon = localStorage.getItem("halfMarathonTime") || "";
  const marathon = localStorage.getItem("marathonTime") || "";
  if (oneMile || fiveKm || tenKm || halfMarathon || marathon) {
    return { oneMile, fiveKm, tenKm, halfMarathon, marathon };
  }

  return missingRunningTimes;
};
export type SportType = "bike" | "run";
export type DurationType = "time" | "distance";
export type PaceUnitType = "metric" | "imperial";

type EditorProps = { id: string };

const Editor = ({ id }: EditorProps) => {
  const S3_URL = "https://zwift-workout.s3-eu-west-1.amazonaws.com";

  const [workoutId, setId] = useState(id === "new" ? localStorage.getItem("id") || genShortId() : id);
  const [bars, setBars] = useState<Array<BarType>>(JSON.parse(localStorage.getItem("currentWorkout") || "[]"));
  const [actionId, setActionId] = useState<string | undefined>(undefined);
  const [ftp, setFtp] = useState(parseInt(localStorage.getItem("ftp") || "200"));
  const [weight, setWeight] = useState(parseInt(localStorage.getItem("weight") || "75"));
  const [instructions, setInstructions] = useState<Array<Instruction>>(
    JSON.parse(localStorage.getItem("instructions") || "[]"),
  );
  const [tags, setTags] = useState(JSON.parse(localStorage.getItem("tags") || "[]"));

  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [description, setDescription] = useState(localStorage.getItem("description") || "");
  const [author, setAuthor] = useState(localStorage.getItem("author") || "");

  const canvasRef = useRef<HTMLInputElement>(null);
  const segmentsRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [segmentsWidth, setSegmentsWidth] = useState(1320);

  const [message, setMessage] = useState<Message>();

  // bike or run
  const [sportType, setSportType] = useState<SportType>((localStorage.getItem("sportType") as SportType) || "bike");

  // distance or time
  const [durationType, setDurationType] = useState<DurationType>(
    (localStorage.getItem("durationType") as DurationType) || "time",
  );

  // min / km or min / mi
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

  useEffect(() => {
    if (id !== "new") {
      void fetchAndParse(id);
    }
  }, [id]);

  function newWorkout() {
    console.log("New workout");

    setId(genShortId());
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

  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    // TODO: allow to combine with shift key for bigger steps (10s, 10W etc.)
    // TODO: when pressing alt key with left/right, move bar instead of changing time
    const actionDict: Record<string, () => void> = {
      "Backspace": () => removeBar(actionId || ""),
      "ArrowLeft": () => removeTimeFromBar(actionId || ""),
      "ArrowRight": () => addTimeToBar(actionId || ""),
      "ArrowUp": () => addPowerToBar(actionId || ""),
      "ArrowDown": () => removePowerFromBar(actionId || ""),
    };

    if (event.key in actionDict) {
      actionDict[event.key]();
    }
  }

  function addBar(zone: number, duration: number = 300, cadence: number = 0, pace: number = 0, length: number = 200) {
    setBars((bars) => [
      ...bars,
      {
        time: durationType === "time" ? duration : round(calculateTime(length, calculateSpeed(pace)), 1),
        length: durationType === "time" ? round(calculateDistance(duration, calculateSpeed(pace)), 1) : length,
        power: zone,
        cadence: cadence,
        type: "bar",
        id: genId(),
        pace: pace,
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
    setBars((bars) => [
      ...bars,
      {
        time: durationType === "time" ? duration : round(calculateTime(length, calculateSpeed(pace)), 1),
        length: durationType === "time" ? round(calculateDistance(duration, calculateSpeed(pace)), 1) : length,
        startPower: zone1,
        endPower: zone2,
        cadence: cadence,
        pace: pace,
        type: "trapeze",
        id: genId(),
      },
    ]);
  }

  function addFreeRide(duration: number = 600, cadence: number = 0, length: number = 1000) {
    setBars((bars) => [
      ...bars,
      {
        time: durationType === "time" ? duration : 0,
        length: durationType === "time" ? 0 : length,
        cadence: cadence,
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
    setBars((bars) => [
      ...bars,
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
        cadence: cadence,
        restingCadence: restingCadence,
        repeat: repeat,
        onDuration:
          durationType === "time"
            ? onDuration
            : round(calculateTime((onLength * 1) / onPower, calculateSpeed(pace)), 1),
        offDuration:
          durationType === "time"
            ? offDuration
            : round(calculateTime((offLength * 1) / offPower, calculateSpeed(pace)), 1),
        onPower: onPower,
        offPower: offPower,
        pace: pace,
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
    setInstructions((instructions) => [
      ...instructions,
      {
        text: text,
        time: time,
        length: length,
        id: genId(),
      },
    ]);
  }

  function changeInstruction(id: string, values: Instruction) {
    const index = instructions.findIndex((instructions) => instructions.id === id);

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
      element.time = element.time + 5;
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
      element.time = element.time - 5;
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
    // not first position of array
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
    // not first position of array
    if (index < bars.length - 1) {
      const updatedArray = [...bars];
      const element = [...bars][index];
      updatedArray.splice(index, 1);
      updatedArray.splice(index + 1, 0, element);
      setBars(updatedArray);
    }
  }

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

    const file = new Blob([xml], { type: "application/xml" });
    return file;
  }

  function downloadWorkout() {
    const tempFile = save();
    const url = window.URL.createObjectURL(tempFile);

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `${workoutId}.zwo`;
    a.click();
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

  async function fetchAndParse(id: string) {
    setBars([]);
    setInstructions([]);

    try {
      const response = await fetch(`${S3_URL}/${id}.zwo`);
      const xml = await response.text();
      const parsed = parseWorkoutXml(xml, { idGenerator: genId });
      applyParsedWorkout(parsed);
    } catch (error) {
      console.error(error);
      setMessage({
        visible: true,
        class: "error",
        text: error instanceof Error ? error.message : "Unable to fetch workout",
      });
    }
  }

  function calculateSpeed(pace: number = 0) {
    if (sportType === "bike") return 0;

    // return speed in m/s
    // speed  = distance / time
    const distances = [1.60934, 5, 10, 21.0975, 42.195];
    const times = [
      runningTimes.oneMile,
      runningTimes.fiveKm,
      runningTimes.tenKm,
      runningTimes.halfMarathon,
      runningTimes.marathon,
    ];
    const selected = times[pace];
    if (!selected) return 0;

    try {
      return (distances[pace] * 1000) / parseTime(selected);
    } catch {
      return 0;
    }
  }

  const renderBar = (bar: BarType) => (
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
      speed={calculateSpeed(bar.pace || 0)}
      onChange={(id: string, value: any) => handleOnChange(id, value)} // Change any to Interface Bar?
      onClick={(id: string) => handleOnClick(id)}
      selected={bar.id === actionId}
      showLabel={true}
    />
  );

  const renderTrapeze = (bar: BarType) => (
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
      speed={calculateSpeed(bar.pace || 0)}
      onChange={(id: string, value: any) => handleOnChange(id, value)} // Change any to Interface Bar?
      onClick={(id: string) => handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderFreeRide = (bar: BarType) => (
    <FreeRide
      key={bar.id}
      id={bar.id}
      time={bar.time}
      length={bar.length}
      cadence={bar.cadence}
      durationType={durationType}
      sportType={sportType}
      onChange={(id: string, value: any) => handleOnChange(id, value)} // Change any to Interface Bar?
      onClick={(id: string) => handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderInterval = (bar: BarType) => (
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
      speed={calculateSpeed(bar.pace || 0)}
      handleIntervalChange={(id: string, value: any) => handleOnChange(id, value)}
      handleIntervalClick={(id: string) => handleOnClick(id)}
      selected={bar.id === actionId}
    />
  );

  const renderComment = (instruction: Instruction, index: number) => (
    <Comment
      key={instruction.id}
      instruction={instruction}
      durationType={durationType}
      width={
        durationType === "distance"
          ? getWorkoutDistance(barsForDistance) * 100
          : getWorkoutLength(barsForMetrics, durationType) / 3
      }
      onChange={(id: string, values: Instruction) => changeInstruction(id, values)}
      onClick={(id: string) => setSelectedInstruction(instructions.find((i) => i.id === id))}
      index={index}
    />
  );

  function setPace(value: string, id: string) {
    const index = bars.findIndex((bar) => bar.id === id);

    if (index !== -1) {
      const updatedArray = [...bars];
      const element = [...updatedArray][index];
      element.pace = parseInt(value);

      if (durationType === "time") {
        element.length =
          (calculateDistance(element.time, calculateSpeed(element.pace || 0)) * 1) / (element.power || 1);
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

  function switchSportType(newSportType: SportType) {
    setSportType(newSportType);
    setDurationType(newSportType === "bike" ? "time" : "distance");
  }

  function toggleTextEditor() {
    if (bars.length > 0 && !textEditorIsVisible) {
      if (window.confirm("Editing a workout from the text editor will overwrite current workout"))
        setTextEditorIsVisible(!textEditorIsVisible);
    } else {
      setTextEditorIsVisible(!textEditorIsVisible);
    }
  }

  function transformTextToWorkout(textValue: string) {
    if (!textValue.trim()) {
      setBars([]);
      setInstructions([]);
      return;
    }

    try {
      const parsed = parseWorkoutText(textValue, { durationType, ftp, weight, calculateSpeed });
      setBars(parsed.segments);
      setInstructions(parsed.instructions);
      if (message?.class === "error") setMessage(undefined);
    } catch (error) {
      setBars([]);
      setInstructions([]);
      setMessage({
        visible: true,
        class: "error",
        text: error instanceof Error ? error.message : "Unable to parse workout text",
      });
    }
  }

  const normalizeEditableText = (value: string) => value.replace(/\u00A0/g, " ").trim();

  const barsForMetrics = bars as Parameters<typeof getWorkoutLength>[0];
  const barsForDistance = bars.filter((bar) => bar.type !== "freeRide") as Parameters<typeof getWorkoutDistance>[0];
  const workoutTime = formatTime(getWorkoutLength(barsForMetrics, durationType));
  const workoutDistance = getWorkoutDistance(barsForDistance);
  const trainingLoad = round(getStressScore(barsForMetrics, ftp), 1);
  const averagePace = getWorkoutPace(barsForMetrics, durationType, paceUnitType);

  const zoneButtons = [
    { label: "Z1", color: Colors.GRAY, zone: 0.5, textColor: "#ffffff" },
    { label: "Z2", color: Colors.BLUE, zone: Zones.Z2.min, textColor: "#ffffff" },
    { label: "Z3", color: Colors.GREEN, zone: Zones.Z3.min, textColor: "#ffffff" },
    { label: "Z4", color: Colors.YELLOW, zone: Zones.Z4.min, textColor: "#111827" },
    { label: "Z5", color: Colors.ORANGE, zone: Zones.Z5.min, textColor: "#ffffff" },
    { label: "Z6", color: Colors.RED, zone: Zones.Z6.min, textColor: "#ffffff" },
  ];

  const messageToneClass =
    message?.class === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : message?.class === "loading"
        ? "border-slate-800 bg-slate-900 text-slate-100"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const fieldLabelClass = "mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500";
  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
  const segmentToolButtonClass =
    "inline-flex items-center justify-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900";
  const composerActionButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900";
  const topSectionClass =
    sportType === "run"
      ? "grid gap-3 xl:grid-cols-[230px_196px_minmax(0,1fr)]"
      : "grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)]";
  const setupStackClass = sportType === "run" ? "space-y-5" : "space-y-3";

  return (
    // Adding tabIndex allows div element to receive keyboard events
    <div
      className="relative h-full overflow-y-auto overflow-x-hidden px-3 py-3 md:px-5 md:py-5"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-[-120px] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(8,145,178,0.25)_0%,_rgba(8,145,178,0)_70%)]" />
        <div className="absolute top-24 right-[-140px] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(14,165,133,0.26)_0%,_rgba(14,165,133,0)_70%)]" />
        <div className="absolute bottom-[-110px] left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(2,132,199,0.22)_0%,_rgba(2,132,199,0)_70%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3">
        {message?.visible && (
          <div
            className={`fixed left-1/2 top-6 z-[1000] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-2xl border px-4 py-3 shadow-lg ${messageToneClass}`}
          >
            <p className="pr-3 text-sm font-semibold">{message.text}</p>
            <button
              type="button"
              className={`rounded-full p-1 transition ${
                message.class === "loading" ? "text-slate-100 hover:bg-white/15" : "text-current hover:bg-black/10"
              }`}
              onClick={() => setMessage({ visible: false })}
              aria-label="Dismiss message"
            >
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
        )}

        {selectedInstruction && (
          <EditComment
            instruction={selectedInstruction}
            onChange={(instructionId: string, values: Instruction) => {
              changeInstruction(instructionId, values);
              setSelectedInstruction(undefined);
            }}
            dismiss={() => setSelectedInstruction(undefined)}
            onDelete={(instructionId: string) => {
              deleteInstruction(instructionId);
              setSelectedInstruction(undefined);
            }}
          />
        )}

        <section className={topSectionClass}>
          <aside className="rounded-3xl border border-white/50 bg-white/85 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Workout Setup</p>
            <div className={setupStackClass}>
              <LeftRightToggle<"bike", "run">
                label="Sport Type"
                leftValue="bike"
                rightValue="run"
                leftIcon={faBiking}
                rightIcon={faRunning}
                selected={sportType}
                onChange={switchSportType}
              />
              {sportType === "bike" && (
                <>
                  <label className="block">
                    <span className={fieldLabelClass}>FTP (W)</span>
                    <input
                      className={inputClass}
                      type="number"
                      name="ftp"
                      value={ftp}
                      onChange={(event) => setFtp(Math.max(1, Number.parseInt(event.target.value, 10) || 0))}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabelClass}>Body Weight (kg)</span>
                    <input
                      className={inputClass}
                      type="number"
                      name="weight"
                      value={weight}
                      onChange={(event) => setWeight(Math.max(1, Number.parseInt(event.target.value, 10) || 0))}
                    />
                  </label>
                </>
              )}
              {sportType === "run" && (
                <>
                  <LeftRightToggle<"time", "distance">
                    label="Duration Type"
                    leftValue="time"
                    rightValue="distance"
                    leftIcon={faClock}
                    rightIcon={faRuler}
                    selected={durationType}
                    onChange={setDurationType}
                  />
                  <LeftRightToggle<"metric", "imperial">
                    label="Pace Unit"
                    leftValue="metric"
                    rightValue="imperial"
                    leftLabel="min/km"
                    rightLabel="min/mi"
                    selected={paceUnitType}
                    onChange={setPaceUnitType}
                  />
                </>
              )}
            </div>
          </aside>

          {sportType === "run" && <RunningTimesEditor times={runningTimes} onChange={setRunningTimes} />}

          <header className="flex h-full flex-col rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="w-full max-w-3xl">
                <div className="mb-2 flex items-center gap-2">
                  <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    ZWO Composer
                  </p>
                  <button
                    type="button"
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${
                      isMetaEditing
                        ? "border-cyan-300 bg-cyan-100 text-cyan-700"
                        : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
                    }`}
                    onClick={() => setIsMetaEditing((value) => !value)}
                    aria-label={isMetaEditing ? "Stop editing workout details" : "Edit workout details"}
                    title={isMetaEditing ? "Stop editing" : "Edit title, description, and author"}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                </div>

                <h1
                  contentEditable={isMetaEditing}
                  suppressContentEditableWarning
                  onBlur={(event) => {
                    const value = normalizeEditableText(event.currentTarget.textContent || "");
                    setName(value === "Untitled workout" ? "" : value);
                  }}
                  className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900 outline-none md:text-4xl"
                >
                  {name || "Untitled workout"}
                </h1>

                {(description || isMetaEditing) && (
                  <p
                    contentEditable={isMetaEditing}
                    suppressContentEditableWarning
                    onBlur={(event) => {
                      const value = normalizeEditableText(event.currentTarget.textContent || "");
                      setDescription(value === "Add workout description" ? "" : value);
                    }}
                    className="mt-2 max-w-2xl text-sm text-slate-600 outline-none"
                  >
                    {description || "Add workout description"}
                  </p>
                )}

                <p
                  contentEditable={isMetaEditing}
                  suppressContentEditableWarning
                  onBlur={(event) => {
                    const value = normalizeEditableText(event.currentTarget.textContent || "");
                    const withoutBy = value.toLowerCase().startsWith("by ") ? value.slice(3) : value;
                    setAuthor(withoutBy);
                  }}
                  className="mt-3 text-sm font-medium text-slate-500 outline-none"
                >
                  {author ? `By ${author}` : isMetaEditing ? "By " : "No author set"}
                </p>
              </div>

              <div className="grid w-full gap-2 [grid-template-columns:repeat(auto-fit,minmax(132px,1fr))] xl:max-w-[720px]">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Workout Time</p>
                  <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                    {workoutTime}
                  </p>
                </div>
                {sportType === "run" ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Distance</p>
                    <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                      {workoutDistance} km
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Training Load
                    </p>
                    <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                      {trainingLoad}
                    </p>
                  </div>
                )}
                {sportType === "run" && (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Avg Pace</p>
                    <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                      {averagePace}
                    </p>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Segments</p>
                  <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                    {bars.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Text Events</p>
                  <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                    {instructions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                onClick={() => {
                  if (window.confirm("Are you sure you want to create a new workout?")) newWorkout();
                }}
              >
                <FontAwesomeIcon icon={faFile} /> New Workout
              </button>
              <button type="button" className={composerActionButtonClass} onClick={() => downloadWorkout()}>
                <FontAwesomeIcon icon={faDownload} /> Download .zwo
              </button>
              <input
                accept=".xml,.zwo"
                ref={uploadInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  if (selectedFile) void handleUpload(selectedFile);
                }}
              />
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-100"
                onClick={() => uploadInputRef.current?.click()}
              >
                <FontAwesomeIcon icon={faUpload} /> Upload Workout
              </button>
            </div>
          </header>
        </section>

        {textEditorIsVisible && sportType === "bike" && (
          <section className="grid gap-3 rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md lg:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Text Composer</p>
              <textarea
                onChange={(event) => transformTextToWorkout(event.target.value)}
                rows={10}
                spellCheck={false}
                className="h-full min-h-[210px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/40"
                placeholder="Add one block per line here:&#10;steady 3.0wkg 30s"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <h2 className="text-xl font-semibold text-slate-900">Syntax Guide</h2>
              <p className="mt-2">Each line maps to one workout block.</p>
              <div className="mt-4 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Blocks</h3>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {["steady", "warmup", "cooldown", "ramp", "intervals", "freeride", "message"].map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700"
                      >
                        {item}
                      </span>
                    ))}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Examples</h3>
                  <div className="mt-1 space-y-1">
                    <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                      steady 3.0wkg 30s
                    </code>
                    <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                      warmup 2.0wkg-3.5wkg 10m
                    </code>
                    <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                      interval 10x 30s-30s 4.0wkg-1.0wkg 110rpm-85rpm
                    </code>
                    <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                      message "Last one!" 20:00m
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/50 bg-white/95 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Build Workout</p>
          <div className="flex flex-col gap-3 xl:flex-row xl:gap-6">
            <aside className="flex shrink-0 flex-col gap-2 xl:w-36">
              {sportType === "bike" ? (
                <>
                  <Tooltip id="text-editor-tooltip" />
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-2">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600"
                      onClick={() => toggleTextEditor()}
                      data-tooltip-id="text-editor-tooltip"
                      data-tooltip-content="Open text workout composer"
                      aria-label="Open text editor"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    {zoneButtons.map((zoneButton) => (
                      <button
                        key={zoneButton.label}
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition hover:-translate-y-0.5"
                        onClick={() => addBar(zoneButton.zone)}
                        style={{ backgroundColor: zoneButton.color, color: zoneButton.textColor }}
                      >
                        {zoneButton.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <button type="button" className={segmentToolButtonClass} onClick={() => addBar(1, 300, 0, 0, 1000)}>
                  <SteadyLogo className="h-5 w-5" /> Steady Pace
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <button type="button" className={segmentToolButtonClass} onClick={() => addTrapeze(0.25, 0.75)}>
                  <WarmupLogo className="h-5 w-5" /> Warm Up
                </button>
                <button type="button" className={segmentToolButtonClass} onClick={() => addTrapeze(0.75, 0.25)}>
                  <CooldownLogo className="h-5 w-5" /> Cool Down
                </button>
                <button type="button" className={segmentToolButtonClass} onClick={() => addInterval()}>
                  <IntervalLogo className="h-5 w-5" /> Interval
                </button>
                <button type="button" className={segmentToolButtonClass} onClick={() => addFreeRide()}>
                  <FontAwesomeIcon icon={sportType === "bike" ? faBicycle : faRunning} /> Free{" "}
                  {sportType === "bike" ? "Ride" : "Run"}
                </button>
                <button type="button" className={segmentToolButtonClass} onClick={() => addInstruction()}>
                  <FontAwesomeIcon icon={faComment} /> Text Event
                </button>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div id="editor" className="editor-shell">
                {actionId && (
                  <div className="editor-actions">
                    <button
                      type="button"
                      onClick={() => moveLeft(actionId)}
                      title="Move Left"
                      className="editor-action-button"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRight(actionId)}
                      title="Move Right"
                      className="editor-action-button"
                    >
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBar(actionId)}
                      title="Delete"
                      className="editor-action-button"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateBar(actionId)}
                      title="Duplicate"
                      className="editor-action-button"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </button>
                    {sportType === "run" && (
                      <select
                        name="pace"
                        value={getPace(actionId)}
                        onChange={(event) => setPace(event.target.value, actionId)}
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
                <div className="canvas" ref={canvasRef}>
                  {actionId && (
                    <div
                      className="fader"
                      style={{ width: canvasRef.current?.scrollWidth }}
                      onClick={() => setActionId(undefined)}
                    ></div>
                  )}
                  <div className="segments" ref={segmentsRef}>
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

                  {durationType === "time" ? (
                    <TimeAxis width={segmentsWidth} />
                  ) : (
                    <DistanceAxis width={segmentsWidth} />
                  )}
                </div>

                <ZoneAxis />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Editor;


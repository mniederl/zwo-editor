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
  faList,
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
import parseWorkoutText from "../../parsers/parseWorkoutText";
import parseWorkoutXml from "../../parsers/parseWorkoutXml";
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
  const [segmentsWidth, setSegmentsWidth] = useState(1320);

  const [message, setMessage] = useState<Message>();

  const [_, setShowWorkouts] = useState(false);

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

  const barsForMetrics = bars as Parameters<typeof getWorkoutLength>[0];
  const barsForDistance = bars.filter((bar) => bar.type !== "freeRide") as Parameters<typeof getWorkoutDistance>[0];

  return (
    // Adding tabIndex allows div element to receive keyboard events
    <div className="container" onKeyDown={handleKeyPress} tabIndex={0}>
      {/* react-helmet removed; head updated via useEffect earlier */}

      {message?.visible && (
        <div className={`message ${message.class}`}>
          {message.text}
          <button type="button" className="close" onClick={() => setMessage({ visible: false })}>
            <FontAwesomeIcon icon={faTimesCircle} size="lg" />
          </button>
        </div>
      )}

      {selectedInstruction && (
        <EditComment
          instruction={selectedInstruction}
          onChange={(id: string, values: Instruction) => {
            changeInstruction(id, values);
            setSelectedInstruction(undefined);
          }}
          dismiss={() => setSelectedInstruction(undefined)}
          onDelete={(id: string) => {
            deleteInstruction(id);
            setSelectedInstruction(undefined);
          }}
        />
      )}

      <div className="info">
        <div className="title">
          <h1>{name}</h1>
          <div className="description">{description}</div>
          <p>{author ? `by ${author}` : ""}</p>
        </div>
        <div className="workout">
          <div className="form-input">
            <label>Workout Time</label>
            <input className="textInput" value={formatTime(getWorkoutLength(barsForMetrics, durationType))} disabled />
          </div>
          {sportType === "run" && (
            <div className="form-input">
              <label>Workout Distance</label>
              <input className="textInput" value={getWorkoutDistance(barsForDistance)} disabled />
            </div>
          )}
          {sportType === "bike" && (
            <div className="form-input">
              <label title="Training Load">Training Load</label>
              <input className="textInput" value={round(getStressScore(barsForMetrics, ftp), 1)} disabled />
            </div>
          )}
          {sportType === "run" && (
            <div className="form-input">
              <label>Avg. Workout Pace</label>
              <input className="textInput" value={getWorkoutPace(barsForMetrics, durationType, paceUnitType)} disabled />
            </div>
          )}
          {sportType === "run" && (
            <LeftRightToggle<"time", "distance">
              label="Duration Type"
              leftValue="time"
              rightValue="distance"
              leftIcon={faClock}
              rightIcon={faRuler}
              selected={durationType}
              onChange={setDurationType}
            />
          )}
          {sportType === "run" && (
            <LeftRightToggle<"metric", "imperial">
              label="Pace Unit"
              leftValue="metric"
              rightValue="imperial"
              leftLabel="min/km"
              rightLabel="min/mi"
              selected={paceUnitType}
              onChange={setPaceUnitType}
            />
          )}
          <LeftRightToggle<"bike", "run">
            label="Sport Type"
            leftValue="bike"
            rightValue="run"
            leftIcon={faBiking}
            rightIcon={faRunning}
            selected={sportType}
            onChange={switchSportType}
          />
        </div>
      </div>
      {sportType === "run" && <RunningTimesEditor times={runningTimes} onChange={setRunningTimes} />}
      {textEditorIsVisible && sportType === "bike" && (
        <div className="text-editor">
          <textarea
            onChange={(e) => transformTextToWorkout(e.target.value)}
            rows={10}
            spellCheck={false}
            className="text-editor-textarea"
            placeholder="Add one block per line here: &#10;steady 3.0wkg 30s"
          ></textarea>
          <div className="text-editor-instructions">
            <h2>Instructions</h2>
            <p>Every row correspond to a workout block. Scroll down to see some examples.</p>
            <h3>Blocks</h3>
            <p>
              <span>steady</span> <span>warmup</span> <span>cooldown</span> <span>ramp</span> <span>intervals</span>{" "}
              <span>freeride</span> <span>message</span>
            </p>
            <h3>Time</h3>
            <p>
              <span>30s</span> or <span>0:30m</span>
            </p>
            <h3>Power</h3>
            <p>
              <span>250w</span> or <span>3.0wkg</span> or <span>75%</span> (FTP)
            </p>
            <h3>Cadence</h3>
            <p>
              <span>120rpm</span>
            </p>
            <h2>Examples</h2>
            <h3>Steady block</h3>
            <p>
              <code>steady 3.0wkg 30s</code>
              <code>steady 120w 10m 85rpm</code>
            </p>
            <h3>Warmup / Cooldown / Ramp block</h3>
            <p>
              <code>warmup 2.0wkg-3.5wkg 10m</code>
              <code>cooldown 180w-100w 5m 110rpm</code>
            </p>
            <h3>Intervals</h3>
            <p>
              <code>interval 10x 30s-30s 4.0wkg-1.0wkg 110rpm-85rpm</code>
              <code>interval 3x 1:00m-5:00m 300w-180w</code>
            </p>
            <h3>Free Ride</h3>
            <p>
              <code>freeride 10m 85rpm</code>
            </p>
            <h3>Text Event</h3>
            <p>
              <code>message "Get ready to your first set!" 30s</code>
              <code>message "Last one!" 20:00m</code>
            </p>
          </div>
        </div>
      )}
      <div id="editor" className="editor">
        {actionId && (
          <div className="actions">
            <button type="button" onClick={() => moveLeft(actionId)} title="Move Left">
              <FontAwesomeIcon icon={faArrowLeft} size="lg" />
            </button>
            <button type="button" onClick={() => moveRight(actionId)} title="Move Right">
              <FontAwesomeIcon icon={faArrowRight} size="lg" />
            </button>
            <button type="button" onClick={() => removeBar(actionId)} title="Delete">
              <FontAwesomeIcon icon={faTrash} size="lg" />
            </button>
            <button type="button" onClick={() => duplicateBar(actionId)} title="Duplicate">
              <FontAwesomeIcon icon={faCopy} size="lg" />
            </button>
            {sportType === "run" && (
              <select
                name="pace"
                value={getPace(actionId)}
                onChange={(e) => setPace(e.target?.value, actionId)}
                className="selectInput"
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

          <div className="slider">{instructions.map((instruction, index) => renderComment(instruction, index))}</div>

          {durationType === "time" ? <TimeAxis width={segmentsWidth} /> : <DistanceAxis width={segmentsWidth} />}
        </div>

        <ZoneAxis />
      </div>
      <div className="cta">
        {sportType === "bike" ? (
          <div>
            <Tooltip id="my-tooltip" />
            <button
              type="button"
              className="btn btn-square"
              onClick={() => toggleTextEditor()}
              style={{ backgroundColor: "palevioletred" }}
              data-tip="New! Workout text editor!"
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button
              type="button"
              className="btn btn-square"
              onClick={() => addBar(0.5)}
              style={{ backgroundColor: Colors.GRAY }}
            >
              Z1
            </button>
            <button
              type="button"
              className="btn btn-square"
              onClick={() => addBar(Zones.Z2.min)}
              style={{ backgroundColor: Colors.BLUE }}
            >
              Z2
            </button>
            <button
              type="button"
              className="btn btn-square"
              onClick={() => addBar(Zones.Z3.min)}
              style={{ backgroundColor: Colors.GREEN }}
            >
              Z3
            </button>
            <button
              type="button"
              className="btn btn-square"
              onClick={() => addBar(Zones.Z4.min)}
              style={{ backgroundColor: Colors.YELLOW }}
            >
              Z4
            </button>
            <button
              type="button"
              className="btn btn-square"
              onClick={() => addBar(Zones.Z5.min)}
              style={{ backgroundColor: Colors.ORANGE }}
            >
              Z5
            </button>
            <button
              type="button"
              className="btn btn-square"
              onClick={() => addBar(Zones.Z6.min)}
              style={{ backgroundColor: Colors.RED }}
            >
              Z6
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => addBar(1, 300, 0, 0, 1000)}
            style={{ backgroundColor: Colors.WHITE }}
          >
            <SteadyLogo className="btn-icon" /> Steady Pace
          </button>
        )}

        <button
          type="button"
          className="btn"
          onClick={() => addTrapeze(0.25, 0.75)}
          style={{ backgroundColor: Colors.WHITE }}
        >
          <WarmupLogo className="btn-icon" /> Warm up
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => addTrapeze(0.75, 0.25)}
          style={{ backgroundColor: Colors.WHITE }}
        >
          <CooldownLogo className="btn-icon" /> Cool down
        </button>
        <button type="button" className="btn" onClick={() => addInterval()} style={{ backgroundColor: Colors.WHITE }}>
          <IntervalLogo className="btn-icon" /> Interval
        </button>
        <button type="button" className="btn" onClick={() => addFreeRide()} style={{ backgroundColor: Colors.WHITE }}>
          <FontAwesomeIcon icon={sportType === "bike" ? faBicycle : faRunning} size="lg" />
          Free {sportType === "bike" ? "Ride" : "Run"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => addInstruction()}
          style={{ backgroundColor: Colors.WHITE }}
        >
          <FontAwesomeIcon icon={faComment} size="lg" /> Text Event
        </button>
        {sportType === "bike" && (
          <div className="form-input">
            <label htmlFor="ftp">FTP (W)</label>
            <input
              className="textInput"
              type="number"
              name="ftp"
              value={ftp}
              onChange={(e) => setFtp(parseInt(e.target.value))}
            />
          </div>
        )}

        {sportType === "bike" && (
          <div className="form-input">
            <label htmlFor="weight">Body Weight (Kg)</label>
            <input
              className="textInput"
              type="number"
              name="weight"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
            />
          </div>
        )}

        <button
          type="button"
          className="btn"
          onClick={() => {
            if (window.confirm("Are you sure you want to create a new workout?")) newWorkout();
          }}
        >
          <FontAwesomeIcon icon={faFile} size="lg" /> New
        </button>
        <button type="button" className="btn">
          <FontAwesomeIcon icon={faTrash} size="lg" /> Delete
        </button>
        <button type="button" className="btn" onClick={() => downloadWorkout()}>
          <FontAwesomeIcon icon={faDownload} size="lg" /> Download
        </button>
        <input
          accept=".xml,.zwo"
          id="contained-button-file"
          type="file"
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files![0])}
        />
        <button type="button" className="btn" onClick={() => document.getElementById("contained-button-file")!.click()}>
          <FontAwesomeIcon icon={faUpload} size="lg" /> Upload
        </button>
        <button type="button" className="btn" onClick={() => setShowWorkouts(true)}>
          <FontAwesomeIcon icon={faList} size="lg" /> Workouts
        </button>
      </div>
    </div>
  );
};

export default Editor;

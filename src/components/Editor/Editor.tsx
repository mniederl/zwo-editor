import { useEffect, useRef } from "react";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { formatTime, parseTime } from "@utils/time";
import parseWorkoutText from "../../parsers/parseWorkoutText";
import Bar from "../Bar/Bar";
import Comment from "../Comment/Comment";
import EditComment from "../Comment/EditComment";
import FreeRide from "../FreeRide/FreeRide";
import { getStressScore, getWorkoutDistance, getWorkoutLength, getWorkoutPace, round } from "../helpers";
import Interval from "../Interval/Interval";
import RightTrapezoid from "../Trapeze/Trapeze";
import EditorHeaderPanel from "./EditorHeaderPanel";
import type { BarType, Instruction, SportType } from "./editorTypes";
import TextComposerPanel from "./TextComposerPanel";
import useEditorState from "./useEditorState";
import useWorkoutActions from "./useWorkoutActions";
import useWorkoutIO from "./useWorkoutIO";
import WorkoutBuilderPanel from "./WorkoutBuilderPanel";

import "./Editor.css";

type EditorProps = { id: string };

const Editor = ({ id }: EditorProps) => {
  const S3_URL = "https://zwift-workout.s3-eu-west-1.amazonaws.com";

  const canvasRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const {
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
  } = useEditorState({ id, segmentsRef });

  const {
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
  } = useWorkoutActions({
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
  });

  const { downloadWorkout, handleUpload, fetchAndParse } = useWorkoutIO({
    s3Url: S3_URL,
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
  });

  useEffect(() => {
    if (id !== "new") {
      void fetchAndParse(id);
    }
  }, [id]);

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

  const messageToneClass =
    message?.class === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : message?.class === "loading"
        ? "border-slate-800 bg-slate-900 text-slate-100"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

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

        <EditorHeaderPanel
          sportType={sportType}
          durationType={durationType}
          paceUnitType={paceUnitType}
          ftp={ftp}
          weight={weight}
          setFtp={setFtp}
          setWeight={setWeight}
          switchSportType={switchSportType}
          setDurationType={setDurationType}
          setPaceUnitType={setPaceUnitType}
          runningTimes={runningTimes}
          setRunningTimes={setRunningTimes}
          isMetaEditing={isMetaEditing}
          setIsMetaEditing={setIsMetaEditing}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          author={author}
          setAuthor={setAuthor}
          workoutTime={workoutTime}
          workoutDistance={workoutDistance}
          trainingLoad={trainingLoad}
          averagePace={averagePace}
          barsCount={bars.length}
          instructionsCount={instructions.length}
          newWorkout={newWorkout}
          downloadWorkout={downloadWorkout}
          uploadInputRef={uploadInputRef}
          handleUpload={handleUpload}
          normalizeEditableText={normalizeEditableText}
        />

        <TextComposerPanel
          isVisible={textEditorIsVisible}
          sportType={sportType}
          onChangeText={transformTextToWorkout}
        />

        <WorkoutBuilderPanel
          sportType={sportType}
          durationType={durationType}
          segmentsWidth={segmentsWidth}
          actionId={actionId}
          bars={bars}
          instructions={instructions}
          canvasRef={canvasRef}
          segmentsRef={segmentsRef}
          setActionId={setActionId}
          toggleTextEditor={toggleTextEditor}
          addBar={addBar}
          addTrapeze={addTrapeze}
          addInterval={addInterval}
          addFreeRide={addFreeRide}
          addInstruction={addInstruction}
          moveLeft={moveLeft}
          moveRight={moveRight}
          removeBar={removeBar}
          duplicateBar={duplicateBar}
          setPace={setPace}
          getPace={getPace}
          renderSegment={(bar) => {
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
          }}
          renderComment={renderComment}
        />
      </div>
    </div>
  );
};

export default Editor;



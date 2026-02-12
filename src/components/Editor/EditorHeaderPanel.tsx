import {
  faBiking,
  faClock,
  faDownload,
  faFile,
  faPen,
  faRuler,
  faRunning,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Dispatch, RefObject, SetStateAction } from "react";

import type { DurationType, PaceUnitType, SportType } from "./editorTypes";
import LeftRightToggle from "./LeftRightToggle";
import RunningTimesEditor, { type RunningTimes } from "./RunningTimesEditor";

interface EditorHeaderPanelProps {
  sportType: SportType;
  durationType: DurationType;
  paceUnitType: PaceUnitType;
  ftp: number;
  weight: number;
  setFtp: Dispatch<SetStateAction<number>>;
  setWeight: Dispatch<SetStateAction<number>>;
  switchSportType: (newSportType: SportType) => void;
  setDurationType: Dispatch<SetStateAction<DurationType>>;
  setPaceUnitType: Dispatch<SetStateAction<PaceUnitType>>;
  runningTimes: RunningTimes;
  setRunningTimes: Dispatch<SetStateAction<RunningTimes>>;
  isMetaEditing: boolean;
  setIsMetaEditing: Dispatch<SetStateAction<boolean>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  author: string;
  setAuthor: Dispatch<SetStateAction<string>>;
  workoutTime: string;
  workoutDistance: number;
  trainingLoad: number;
  averagePace: string;
  barsCount: number;
  instructionsCount: number;
  newWorkout: () => void;
  downloadWorkout: () => void;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  handleUpload: (file: Blob) => Promise<boolean>;
  normalizeEditableText: (value: string) => string;
}

export default function EditorHeaderPanel({
  sportType,
  durationType,
  paceUnitType,
  ftp,
  weight,
  setFtp,
  setWeight,
  switchSportType,
  setDurationType,
  setPaceUnitType,
  runningTimes,
  setRunningTimes,
  isMetaEditing,
  setIsMetaEditing,
  name,
  setName,
  description,
  setDescription,
  author,
  setAuthor,
  workoutTime,
  workoutDistance,
  trainingLoad,
  averagePace,
  barsCount,
  instructionsCount,
  newWorkout,
  downloadWorkout,
  uploadInputRef,
  handleUpload,
  normalizeEditableText,
}: EditorHeaderPanelProps) {
  const fieldLabelClass = "mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500";
  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
  const composerActionButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900";
  const topSectionClass =
    sportType === "run"
      ? "grid gap-3 xl:grid-cols-[230px_196px_minmax(0,1fr)]"
      : "grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)]";
  const setupStackClass = sportType === "run" ? "space-y-5" : "space-y-3";

  return (
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Training Load</p>
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
                {barsCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Text Events</p>
              <p className="mt-1 font-[var(--font-display)] text-[1.75rem] leading-none text-slate-900 tabular-nums">
                {instructionsCount}
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
  );
}

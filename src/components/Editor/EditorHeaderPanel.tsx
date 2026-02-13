import { Bike, Clock3, Download, FileText, Footprints, Pencil, Ruler, Upload } from "lucide-react";

import { useEditorContext } from "./EditorContext";
import LeftRightToggle from "./LeftRightToggle";
import RunningTimesEditor from "./RunningTimesEditor";
import { cn } from "@/utils/cssUtils";

export default function EditorHeaderPanel() {
  const { state, actions, io, metrics, helpers, refs } = useEditorContext();
  const {
    sportType,
    durationType,
    paceUnitType,
    ftp,
    weight,
    runningTimes,
    isMetaEditing,
    name,
    description,
    author,
    bars,
    instructions,
  } = state;
  const { switchSportType, normalizeEditableText } = helpers;

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

  const renderStatCard = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-(--font-display) text-[1.75rem] leading-none text-slate-900 tabular-nums">{value}</p>
    </div>
  );

  return (
    <section className={topSectionClass}>
      <aside className="rounded-3xl border border-white/50 bg-white/85 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Workout Setup</p>
        <div className={setupStackClass}>
          <LeftRightToggle<"bike", "run">
            label="Sport Type"
            leftValue="bike"
            rightValue="run"
            leftIcon={Bike}
            rightIcon={Footprints}
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
                  onChange={(event) => state.setFtp(Math.max(1, Number.parseInt(event.target.value, 10) || 0))}
                />
              </label>
              <label className="block">
                <span className={fieldLabelClass}>Body Weight (kg)</span>
                <input
                  className={inputClass}
                  type="number"
                  name="weight"
                  value={weight}
                  onChange={(event) => state.setWeight(Math.max(1, Number.parseInt(event.target.value, 10) || 0))}
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
                leftIcon={Clock3}
                rightIcon={Ruler}
                selected={durationType}
                onChange={state.setDurationType}
              />
              <LeftRightToggle<"metric", "imperial">
                label="Pace Unit"
                leftValue="metric"
                rightValue="imperial"
                leftLabel="min/km"
                rightLabel="min/mi"
                selected={paceUnitType}
                onChange={state.setPaceUnitType}
              />
            </>
          )}
        </div>
      </aside>

      {sportType === "run" && <RunningTimesEditor times={runningTimes} onChange={state.setRunningTimes} />}

      <header className="flex h-full flex-col rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="w-full max-w-3xl">
            <div className="mb-2 flex items-center gap-2">
              <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                ZWO Composer
              </p>
              <button
                type="button"
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs transition",
                  isMetaEditing
                    ? "border-cyan-300 bg-cyan-100 text-cyan-700"
                    : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700",
                )}
                onClick={() => state.setIsMetaEditing((value) => !value)}
                aria-label={isMetaEditing ? "Stop editing workout details" : "Edit workout details"}
                title={isMetaEditing ? "Stop editing" : "Edit title, description, and author"}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <h1
              contentEditable={isMetaEditing}
              suppressContentEditableWarning
              onBlur={(event) => {
                const value = normalizeEditableText(event.currentTarget.textContent || "");
                state.setName(value === "Untitled workout" ? "" : value);
              }}
              className="text-2xl font-semibold tracking-tight text-slate-900 outline-none md:text-3xl"
            >
              {name || "Untitled workout"}
            </h1>

            {(description || isMetaEditing) && (
              <p
                contentEditable={isMetaEditing}
                suppressContentEditableWarning
                onBlur={(event) => {
                  const value = normalizeEditableText(event.currentTarget.textContent || "");
                  state.setDescription(value === "Add workout description" ? "" : value);
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
                state.setAuthor(withoutBy);
              }}
              className="mt-3 text-sm font-medium text-slate-500 outline-none"
            >
              {author ? `By ${author}` : isMetaEditing ? "By " : "No author set"}
            </p>
          </div>

          <div className="grid w-full gap-2 grid-cols-2 xl:max-w-90">
            {renderStatCard("Workout Time", metrics.workoutTime)}
            {sportType === "run"
              ? renderStatCard("Distance", `${metrics.workoutDistance} km`)
              : renderStatCard("Training Load", metrics.trainingLoad)}
            {sportType === "run" && renderStatCard("Avg Pace", metrics.averagePace)}
            {renderStatCard("Segments", bars.length)}
            {renderStatCard("Text Events", instructions.length)}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            onClick={() => {
              if (window.confirm("Are you sure you want to create a new workout?")) actions.newWorkout();
            }}
          >
            <FileText className="h-4 w-4" /> New Workout
          </button>
          <button type="button" className={composerActionButtonClass} onClick={() => io.downloadWorkout()}>
            <Download className="h-4 w-4" /> Download .zwo
          </button>
          <input
            accept=".xml,.zwo"
            ref={refs.uploadInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) void io.handleUpload(selectedFile);
            }}
          />
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-100"
            onClick={() => refs.uploadInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Upload Workout
          </button>
        </div>
      </header>
    </section>
  );
}

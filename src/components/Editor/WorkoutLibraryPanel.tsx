import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react";

import serializeWorkoutXml from "@/domain/workout/xml/serializeWorkoutXml";
import { useEditorIOContext, useEditorStateContext } from "./EditorContext";
import WorkoutLibraryItemCard from "./WorkoutLibraryItemCard";
import type { FileHandleLike, LibraryWorkoutItem } from "./workoutLibraryTypes";
import useWorkoutLibraryDirectory from "./useWorkoutLibraryDirectory";
import { getUniqueWorkoutFileName, normalizeWorkoutFileName, stripWorkoutFileExtension } from "./workoutLibraryUtils";
import { cn } from "@/utils/cssUtils";

interface WorkoutLibraryPanelProps {
  isWideDesktop: boolean;
  onToggle: () => void;
  open: boolean;
}

export default function WorkoutLibraryPanel({ open, onToggle, isWideDesktop }: WorkoutLibraryPanelProps) {
  const state = useEditorStateContext();
  const io = useEditorIOContext();
  const { ftp, setMessage } = state;
  const handleDirectoryError = useCallback(
    (text: string) => {
      setMessage({
        class: "error",
        text,
        visible: true,
      });
    },
    [setMessage],
  );
  const { canUseDirectoryPicker, directoryHandle, isLoading, libraryItems, pickDirectory, refreshDirectory } =
    useWorkoutLibraryDirectory({
      ftp,
      onError: handleDirectoryError,
    });
  const [activeFileName, setActiveFileName] = useState<string>();

  const panelWidthClass = isWideDesktop ? "w-[40rem]" : "w-[20rem]";
  const libraryGridClass = isWideDesktop ? "grid grid-cols-2 gap-2 pb-1" : "space-y-2 pb-1";

  const openWorkout = useCallback(
    async (item: LibraryWorkoutItem) => {
      const file = await item.handle.getFile();
      const imported = await io.handleUpload(file, { confirmOverwrite: false });
      if (imported) {
        setActiveFileName(item.fileName);
        state.setWorkoutId(item.fileName.replace(/\.(zwo|xml)$/i, ""));
      }
    },
    [io, state],
  );

  const deleteWorkout = useCallback(
    async (item: LibraryWorkoutItem) => {
      if (!directoryHandle) {
        return;
      }
      if (!window.confirm(`Delete "${item.fileName}" from this directory?`)) {
        return;
      }

      await directoryHandle.removeEntry(item.fileName);
      if (activeFileName === item.fileName) {
        setActiveFileName(undefined);
      }
      await refreshDirectory(directoryHandle);
    },
    [activeFileName, directoryHandle, refreshDirectory],
  );

  const targetFileName = normalizeWorkoutFileName(state.workoutId || "workout");

  useEffect(() => {
    if (!activeFileName) {
      return;
    }

    const activeExists = libraryItems.some((item) => item.fileName.toLowerCase() === activeFileName.toLowerCase());
    const stillMatchesCurrentWorkout = activeFileName.toLowerCase() === targetFileName.toLowerCase();

    if (!activeExists || !stillMatchesCurrentWorkout) {
      setActiveFileName(undefined);
    }
  }, [activeFileName, libraryItems, targetFileName]);

  const hasSelectedLibraryWorkout = Boolean(activeFileName);

  const buildCurrentWorkoutXml = useCallback(
    () =>
      serializeWorkoutXml({
        author: state.author,
        bars: state.bars,
        description: state.description,
        durationType: state.durationType,
        instructions: state.instructions,
        name: state.name,
        sportType: state.sportType,
        tags: state.tags,
      }),
    [
      state.author,
      state.bars,
      state.description,
      state.durationType,
      state.instructions,
      state.name,
      state.sportType,
      state.tags,
    ],
  );

  const writeWorkoutFile = useCallback(
    async (fileHandle: FileHandleLike): Promise<boolean> => {
      if (!fileHandle.createWritable) {
        state.setMessage({
          class: "error",
          text: "This browser cannot write files in the selected directory.",
          visible: true,
        });
        return false;
      }

      const writable = await fileHandle.createWritable();
      try {
        await writable.write(buildCurrentWorkoutXml());
      } finally {
        await writable.close();
      }

      return true;
    },
    [buildCurrentWorkoutXml, state],
  );

  const saveSelectedWorkout = useCallback(async () => {
    if (!directoryHandle || !activeFileName) {
      state.setMessage({
        class: "error",
        text: "Select a workout from the library first.",
        visible: true,
      });
      return;
    }

    const fileHandle = await directoryHandle.getFileHandle(activeFileName, { create: true });
    const wasWritten = await writeWorkoutFile(fileHandle);
    if (!wasWritten) {
      return;
    }

    state.setMessage({
      class: "success",
      text: `Updated ${activeFileName}.`,
      visible: true,
    });
    await refreshDirectory(directoryHandle);
  }, [activeFileName, directoryHandle, refreshDirectory, state, writeWorkoutFile]);

  const addCurrentWorkoutToLibrary = useCallback(async () => {
    if (!directoryHandle) {
      state.setMessage({
        class: "error",
        text: "Pick a workout directory first.",
        visible: true,
      });
      return;
    }

    const fileName = getUniqueWorkoutFileName(
      state.workoutId || "workout",
      libraryItems.map((item) => item.fileName),
    );
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const wasWritten = await writeWorkoutFile(fileHandle);
    if (!wasWritten) {
      return;
    }

    setActiveFileName(fileName);
    state.setWorkoutId(stripWorkoutFileExtension(fileName));
    state.setMessage({
      class: "success",
      text: `Added ${fileName} to the library.`,
      visible: true,
    });
    await refreshDirectory(directoryHandle);
  }, [directoryHandle, libraryItems, refreshDirectory, state]);

  const duplicateCurrentWorkout = useCallback(async () => {
    if (!directoryHandle) {
      state.setMessage({
        class: "error",
        text: "Pick a workout directory first.",
        visible: true,
      });
      return;
    }

    const baseName = activeFileName ? stripWorkoutFileExtension(activeFileName) : state.workoutId || "workout";
    const duplicateFileName = getUniqueWorkoutFileName(baseName, libraryItems.map((item) => item.fileName));
    const fileHandle = await directoryHandle.getFileHandle(duplicateFileName, { create: true });
    const wasWritten = await writeWorkoutFile(fileHandle);
    if (!wasWritten) {
      return;
    }

    setActiveFileName(duplicateFileName);
    state.setWorkoutId(stripWorkoutFileExtension(duplicateFileName));
    state.setMessage({
      class: "success",
      text: `Duplicated as ${duplicateFileName}.`,
      visible: true,
    });
    await refreshDirectory(directoryHandle);
  }, [activeFileName, directoryHandle, libraryItems, refreshDirectory, state, writeWorkoutFile]);

  return (
    <aside
      className={cn(
        "hidden lg:sticky lg:top-0 lg:flex lg:shrink-0 lg:self-start lg:transition-[width,opacity] lg:duration-250",
        open ? "lg:overflow-visible" : "lg:overflow-hidden lg:pointer-events-none",
        open ? `opacity-100 ${panelWidthClass}` : "w-0 opacity-0",
      )}
    >
      <section className="flex w-full min-w-0 max-h-[calc(100dvh-(var(--editor-page-padding-y)*2))] flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/92 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Workout Library</p>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            onClick={onToggle}
            aria-label="Collapse workout library"
            title="Collapse library"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-100"
            onClick={() => void pickDirectory()}
          >
            <FolderOpen className="h-4 w-4" /> Select Zwift Folder
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!directoryHandle || isLoading}
              onClick={() => void refreshDirectory(directoryHandle)}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
            </button>
            <button
              type="button"
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!directoryHandle}
              onClick={() => void (hasSelectedLibraryWorkout ? saveSelectedWorkout() : addCurrentWorkoutToLibrary())}
              title={hasSelectedLibraryWorkout ? "Save selected workout" : `Add ${targetFileName} to library`}
            >
              {hasSelectedLibraryWorkout ? (
                <>
                  <Save className="h-4 w-4" /> Save
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add
                </>
              )}
            </button>
            {hasSelectedLibraryWorkout && (
              <button
                type="button"
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!directoryHandle}
                onClick={() => void duplicateCurrentWorkout()}
                title="Duplicate selected workout to a new file"
              >
                <Copy className="h-4 w-4" /> Duplicate
              </button>
            )}
          </div>
        </div>

        <div className="workout-library-scroll mt-3 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1 pb-1">
          {!canUseDirectoryPicker && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Directory mode needs a Chromium browser.
            </p>
          )}

          {canUseDirectoryPicker && !directoryHandle && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              Pick your Zwift workouts directory to browse workouts here.
            </div>
          )}

          {directoryHandle && (
            <p className="mb-2 truncate text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {directoryHandle.name}
            </p>
          )}

          <div className={libraryGridClass}>
            {libraryItems.map((item) => (
              <WorkoutLibraryItemCard
                key={item.id}
                item={item}
                isActive={activeFileName === item.fileName}
                onOpen={(selectedItem) => void openWorkout(selectedItem)}
                onDelete={(selectedItem) => void deleteWorkout(selectedItem)}
              />
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}

export function WorkoutLibraryCollapsedToggle({
  hidden,
  onClick,
}: {
  hidden?: boolean;
  onClick: () => void;
}) {
  if (hidden) {
    return null;
  }

  return (
    <button
      type="button"
      className="hidden lg:inline-flex lg:fixed lg:left-5 lg:top-5 lg:z-30 lg:h-10 lg:w-10 lg:items-center lg:justify-center lg:rounded-xl lg:border lg:border-slate-300 lg:bg-white/95 lg:text-slate-700 lg:shadow-sm lg:transition lg:hover:border-slate-400 lg:hover:text-slate-900"
      onClick={onClick}
      aria-label="Open workout library"
      title="Open workout library"
    >
      <PanelLeftOpen className="h-4 w-4" />
    </button>
  );
}

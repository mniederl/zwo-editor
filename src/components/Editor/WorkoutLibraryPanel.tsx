import { useCallback, useMemo, useState } from "react";
import {
  Clock3,
  FileSearch,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import { Colors, Zones } from "../constants";
import { getStressScore, getWorkoutLength, round } from "../helpers";
import createWorkoutXml from "./createWorkoutXml";
import { useEditorContext } from "./EditorContext";
import type { SegmentType } from "./editorTypes";
import parseWorkoutXml from "@/parsers/parseWorkoutXml";
import { cn } from "@/utils/cssUtils";
import { formatTime } from "@/utils/time";

interface FileWritableLike {
  close: () => Promise<void>;
  write: (data: string | Blob) => Promise<void>;
}

interface FileHandleLike {
  kind: string;
  name: string;
  getFile: () => Promise<File>;
  createWritable?: () => Promise<FileWritableLike>;
}

interface DirectoryHandleLike {
  name: string;
  entries: () => AsyncIterableIterator<[string, FileHandleLike]>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>;
  removeEntry: (name: string) => Promise<void>;
}

interface LibraryWorkoutItem {
  author: string;
  fileName: string;
  handle: FileHandleLike;
  id: string;
  name: string;
  segments: SegmentType[];
  stressScore: number;
  workoutTime: string;
}

interface PreviewBlock {
  background: string;
  height: number;
  widthWeight: number;
}

interface WorkoutLibraryPanelProps {
  isWideDesktop: boolean;
  onToggle: () => void;
  open: boolean;
}

const zoneToColor = (power: number) => {
  if (power < Zones.Z2.min) return Colors.GRAY;
  if (power < Zones.Z3.min) return Colors.BLUE;
  if (power < Zones.Z4.min) return Colors.GREEN;
  if (power < Zones.Z5.min) return Colors.YELLOW;
  if (power < Zones.Z6.min) return Colors.ORANGE;
  return Colors.RED;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function normalizeWorkoutFileName(name: string) {
  if (name.toLowerCase().endsWith(".zwo")) {
    return name;
  }
  return `${name}.zwo`;
}

function buildPreviewBlocks(segments: SegmentType[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];

  segments.forEach((segment) => {
    const segmentWidthWeight = Math.max(0.1, segment.time);

    if (segment.type === "bar") {
      blocks.push({
        background: zoneToColor(segment.power),
        height: clamp(20 + segment.power * 42, 18, 68),
        widthWeight: segmentWidthWeight,
      });
      return;
    }

    if (segment.type === "trapeze") {
      const startColor = zoneToColor(segment.startPower);
      const endColor = zoneToColor(segment.endPower);
      blocks.push({
        background:
          startColor === endColor ? startColor : `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`,
        height: clamp(20 + ((segment.startPower + segment.endPower) / 2) * 42, 18, 68),
        widthWeight: segmentWidthWeight,
      });
      return;
    }

    if (segment.type === "interval") {
      blocks.push({
        background: zoneToColor(segment.onPower),
        height: clamp(20 + segment.onPower * 42, 18, 68),
        widthWeight: Math.max(0.1, segment.onDuration * segment.repeat),
      });
      blocks.push({
        background: zoneToColor(segment.offPower),
        height: clamp(20 + segment.offPower * 42, 18, 68),
        widthWeight: Math.max(0.1, segment.offDuration * segment.repeat),
      });
      return;
    }

    blocks.push({
      background: Colors.GRAY,
      height: 26,
      widthWeight: segmentWidthWeight,
    });
  });

  const maxPreviewBlocks = 14;
  if (blocks.length <= maxPreviewBlocks) {
    return blocks;
  }

  const chunkSize = Math.ceil(blocks.length / maxPreviewBlocks);
  const compacted: PreviewBlock[] = [];
  for (let startIndex = 0; startIndex < blocks.length; startIndex += chunkSize) {
    const chunk = blocks.slice(startIndex, startIndex + chunkSize);
    const widthWeight = chunk.reduce((sum, block) => sum + block.widthWeight, 0);
    const height = chunk.reduce((sum, block) => sum + block.height, 0) / chunk.length;
    compacted.push({
      background: chunk[chunk.length - 1]?.background || Colors.GRAY,
      height,
      widthWeight,
    });
  }
  return compacted;
}

export default function WorkoutLibraryPanel({ open, onToggle, isWideDesktop }: WorkoutLibraryPanelProps) {
  const { state, io } = useEditorContext();
  const [directoryHandle, setDirectoryHandle] = useState<DirectoryHandleLike | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryWorkoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string>();

  const panelWidthClass = isWideDesktop ? "w-[24rem]" : "w-[20rem]";
  const canUseDirectoryPicker =
    typeof window !== "undefined" &&
    typeof (window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandleLike> }).showDirectoryPicker ===
      "function";

  const refreshDirectory = useCallback(
    async (targetDirectory = directoryHandle) => {
      if (!targetDirectory) {
        return;
      }

      setIsLoading(true);
      try {
        const nextItems: LibraryWorkoutItem[] = [];

        for await (const [fileName, handle] of targetDirectory.entries()) {
          if (handle.kind !== "file" || !/\.(zwo|xml)$/i.test(fileName)) {
            continue;
          }

          const file = await handle.getFile();
          const xml = await file.text();

          try {
            const parsed = parseWorkoutXml(xml);
            const workoutLength = getWorkoutLength(
              parsed.segments as Parameters<typeof getWorkoutLength>[0],
              parsed.meta.durationType,
            );
            const stressScore = round(
              getStressScore(parsed.segments as Parameters<typeof getStressScore>[0], state.ftp),
              1,
            );

            nextItems.push({
              author: parsed.meta.author,
              fileName,
              handle,
              id: `${fileName}-${parsed.meta.name}`,
              name: parsed.meta.name || fileName.replace(/\.(zwo|xml)$/i, ""),
              segments: parsed.segments,
              stressScore,
              workoutTime: formatTime(workoutLength),
            });
          } catch {
            // Ignore files that are not valid workout XML.
          }
        }

        nextItems.sort((a, b) => a.name.localeCompare(b.name));
        setLibraryItems(nextItems);
      } finally {
        setIsLoading(false);
      }
    },
    [directoryHandle, state.ftp],
  );

  const pickDirectory = useCallback(async () => {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandleLike> })
      .showDirectoryPicker;
    if (!picker) {
      state.setMessage({
        class: "error",
        text: "Directory access is only available in Chromium-based browsers.",
        visible: true,
      });
      return;
    }

    try {
      const handle = await picker();
      setDirectoryHandle(handle);
      await refreshDirectory(handle);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      state.setMessage({
        class: "error",
        text: "Could not open the selected directory.",
        visible: true,
      });
    }
  }, [refreshDirectory, state]);

  const openWorkout = useCallback(
    async (item: LibraryWorkoutItem) => {
      const file = await item.handle.getFile();
      const imported = await io.handleUpload(file);
      if (imported) {
        setActiveFileName(item.fileName);
      }
    },
    [io],
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
      await refreshDirectory();
    },
    [activeFileName, directoryHandle, refreshDirectory],
  );

  const saveCurrentWorkout = useCallback(async () => {
    if (!directoryHandle) {
      state.setMessage({
        class: "error",
        text: "Pick a workout directory first.",
        visible: true,
      });
      return;
    }

    const fileName = normalizeWorkoutFileName(state.workoutId || "workout");
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    if (!fileHandle.createWritable) {
      state.setMessage({
        class: "error",
        text: "This browser cannot write files in the selected directory.",
        visible: true,
      });
      return;
    }

    const writable = await fileHandle.createWritable();
    try {
      const xml = createWorkoutXml({
        author: state.author,
        bars: state.bars,
        description: state.description,
        durationType: state.durationType,
        instructions: state.instructions,
        name: state.name,
        sportType: state.sportType,
        tags: state.tags,
      });
      await writable.write(xml);
    } finally {
      await writable.close();
    }

    setActiveFileName(fileName);
    state.setMessage({
      class: "success",
      text: `Saved ${fileName} to selected directory.`,
      visible: true,
    });
    await refreshDirectory();
  }, [directoryHandle, refreshDirectory, state]);

  const cards = useMemo(() => libraryItems, [libraryItems]);

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
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!directoryHandle || isLoading}
              onClick={() => void refreshDirectory()}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
            </button>
            <button
              type="button"
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!directoryHandle}
              onClick={() => void saveCurrentWorkout()}
            >
              <Save className="h-4 w-4" /> Save Current
            </button>
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

          <div className="space-y-2 pb-1">
            {cards.map((item) => {
              const previewBlocks = buildPreviewBlocks(item.segments);
              const totalWidthWeight = previewBlocks.reduce((sum, block) => sum + block.widthWeight, 0) || 1;
              const isActive = activeFileName === item.fileName;

              return (
                <article
                  key={item.id}
                  className={cn(
                    "group rounded-2xl border bg-white p-2 transition",
                    isActive ? "border-cyan-400" : "border-slate-200",
                  )}
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => void openWorkout(item)}
                    title={`Open ${item.fileName}`}
                  >
                    <div className="mb-2 flex h-12 items-end overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {previewBlocks.map((block, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          className="rounded-t-sm"
                          style={{
                            background: block.background,
                            height: `${block.height}px`,
                            flexBasis: 0,
                            flexGrow: block.widthWeight / totalWidthWeight,
                          }}
                        />
                      ))}
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="truncate text-xs text-slate-500">{item.author || "Unknown author"}</p>
                  </button>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Clock3 className="h-3.5 w-3.5" /> {item.workoutTime}
                      </span>
                      <span className="whitespace-nowrap">{item.stressScore} TSS</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                        onClick={() => void openWorkout(item)}
                        title="Open workout"
                      >
                        <FileSearch className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-rose-300 bg-rose-50 text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                        onClick={() => void deleteWorkout(item)}
                        title="Delete from directory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
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

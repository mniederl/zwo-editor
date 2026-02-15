import { Clock3, FileSearch, Trash2 } from "lucide-react";

import { cn } from "@/utils/cssUtils";

import type { LibraryWorkoutItem } from "./workoutLibraryTypes";
import { buildPreviewBlocks } from "./workoutLibraryUtils";

interface WorkoutLibraryItemCardProps {
  isActive: boolean;
  item: LibraryWorkoutItem;
  onDelete: (item: LibraryWorkoutItem) => void;
  onOpen: (item: LibraryWorkoutItem) => void;
}

export default function WorkoutLibraryItemCard({ isActive, item, onDelete, onOpen }: WorkoutLibraryItemCardProps) {
  const previewBlocks = buildPreviewBlocks(item.segments);
  const totalWidthWeight = previewBlocks.reduce((sum, block) => sum + block.widthWeight, 0) || 1;

  return (
    <article
      className={cn("group rounded-2xl border bg-white p-2 transition", isActive ? "border-cyan-400" : "border-slate-200")}
    >
      <button type="button" className="block w-full text-left" onClick={() => onOpen(item)} title={`Open ${item.fileName}`}>
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
            onClick={() => onOpen(item)}
            title="Open workout"
          >
            <FileSearch className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-rose-300 bg-rose-50 text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
            onClick={() => onDelete(item)}
            title="Delete from directory"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

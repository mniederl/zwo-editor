import type { ReactNode } from "react";
import { ListOrdered } from "lucide-react";

import type { ProgramRow } from "./buildProgramRows";
import { cn } from "@/utils/cssUtils";

interface WorkoutProgramPanelProps {
  rows: ProgramRow[];
  selectedSegmentId?: string;
  onSelectSegment: (segmentId: string) => void;
}

export default function WorkoutProgramPanel({ rows, selectedSegmentId, onSelectSegment }: WorkoutProgramPanelProps) {
  const renderedRows: ReactNode[] = [];
  const rowButtonClass =
    "flex w-full items-center justify-end rounded-md px-3 py-[0.1875rem] text-left text-sm font-semibold transition hover:brightness-105";

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const isIntervalOn = row.variant === "intervalOn";
    const maybeOffRow = rows[index + 1];
    const hasIntervalPair =
      isIntervalOn &&
      maybeOffRow?.variant === "intervalOff" &&
      maybeOffRow.segmentId === row.segmentId &&
      maybeOffRow.repeatCount === row.repeatCount;

    if (hasIntervalPair) {
      const offRow = maybeOffRow;
      if (!offRow) {
        continue;
      }
      renderedRows.push(
        <div key={`${row.id}-group`} className="flex items-start gap-2 pl-3">
          <span className="mt-1 inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 shadow-sm">
            x{row.repeatCount ?? 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <button
              type="button"
              onClick={() => onSelectSegment(row.segmentId)}
              className={cn(
                rowButtonClass,
                row.textColor === "#ffffff" && "[text-shadow:0_1px_1px_rgba(0,0,0,0.28)]",
                selectedSegmentId === row.segmentId && "ring-2 ring-slate-400/70 ring-offset-1",
              )}
              style={{ background: row.background, color: row.textColor }}
            >
              <span className="w-full truncate text-right">{row.text}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSegment(offRow.segmentId)}
              className={cn(
                rowButtonClass,
                offRow.textColor === "#ffffff" && "[text-shadow:0_1px_1px_rgba(0,0,0,0.28)]",
                selectedSegmentId === offRow.segmentId && "ring-2 ring-slate-400/70 ring-offset-1",
              )}
              style={{ background: offRow.background, color: offRow.textColor }}
            >
              <span className="w-full truncate text-right">{offRow.text}</span>
            </button>
          </div>
        </div>,
      );
      index += 1;
      continue;
    }

    renderedRows.push(
      <button
        key={row.id}
        type="button"
        onClick={() => onSelectSegment(row.segmentId)}
        className={cn(
          rowButtonClass,
          row.textColor === "#ffffff" && "[text-shadow:0_1px_1px_rgba(0,0,0,0.28)]",
          selectedSegmentId === row.segmentId && "ring-2 ring-slate-400/70 ring-offset-1",
        )}
        style={{ background: row.background, color: row.textColor }}
      >
        <span className="w-full truncate text-right">{row.text}</span>
      </button>,
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800">
          <ListOrdered className="h-3.5 w-3.5" /> Program
        </p>
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          {rows.length} {rows.length === 1 ? "step" : "steps"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
          Add segments to generate the program list.
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto pr-1 2xl:max-h-[430px]">
          <div className="space-y-2">{renderedRows}</div>
        </div>
      )}
    </section>
  );
}

import { ArrowLeft, ArrowRight, Copy, Trash2 } from "lucide-react";

import type { WorkoutActions } from "./useWorkoutActions";

interface SelectedSegmentActionsProps {
  actionId: string;
  actions: WorkoutActions;
  sportType: "bike" | "run";
}

export default function SelectedSegmentActions({ actionId, actions, sportType }: SelectedSegmentActionsProps) {
  return (
    <div className="editor-actions">
      <button type="button" onClick={() => actions.moveLeft(actionId)} title="Move Left" className="editor-action-button">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => actions.moveRight(actionId)} title="Move Right" className="editor-action-button">
        <ArrowRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => actions.removeBar(actionId)} title="Delete" className="editor-action-button">
        <Trash2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => actions.duplicateBar(actionId)} title="Duplicate" className="editor-action-button">
        <Copy className="h-4 w-4" />
      </button>
      {sportType === "run" && (
        <select
          name="pace"
          value={actions.getPace(actionId)}
          onChange={(event) => actions.setPace(event.target.value, actionId)}
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
  );
}

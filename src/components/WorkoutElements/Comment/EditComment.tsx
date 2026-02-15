import { useState } from "react";
import { Save, Trash2, X } from "lucide-react";

import type { Instruction } from "@/domain/workout/types";
import { formatTime, parseTime } from "@/utils/time";

const EditComment = (props: {
  instruction: Instruction;
  onChange: (id: string, instruction: Instruction) => void;
  onDelete: (id: string) => void;
  dismiss: () => void;
}) => {
  const [text, setText] = useState(props.instruction.text);
  const [time, setTime] = useState(formatTime(props.instruction.time));
  const [timeError, setTimeError] = useState("");

  function save() {
    let parsedTime: number;
    try {
      parsedTime = parseTime(time);
      setTimeError("");
    } catch {
      setTimeError("Use HH:MM:SS or MM:SS");
      return;
    }

    props.onChange(props.instruction.id, {
      id: props.instruction.id,
      text,
      length: props.instruction.length,
      time: parsedTime,
    });
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Text Event</p>
        <textarea
          name="comment"
          value={text}
          placeholder="Enter message"
          className="h-52 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="button"
            onClick={() => save()}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            type="button"
            onClick={() => props.dismiss()}
          >
            <X className="h-4 w-4" />
            Dismiss
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            type="button"
            onClick={() => props.onDelete(props.instruction.id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="flex items-center gap-2 ml-5">
            <label
              htmlFor="text-event-time"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
            >
              Time
            </label>
            <input
              id="text-event-time"
              type="text"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              onBlur={() => {
                try {
                  const parsedTime = parseTime(time);
                  setTime(formatTime(parsedTime));
                  setTimeError("");
                } catch {
                  setTimeError("Use HH:MM:SS or MM:SS");
                }
              }}
              placeholder="00:00:00"
              className="h-10 w-33 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
        </div>
        {timeError && <p className="mt-2 text-sm font-medium text-rose-600">{timeError}</p>}
      </div>
    </div>
  );
};

export default EditComment;

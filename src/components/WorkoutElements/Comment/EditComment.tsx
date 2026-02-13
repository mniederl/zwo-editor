import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { Instruction } from "@/components/Editor/editorTypes";

const EditComment = (props: {
  instruction: Instruction;
  onChange: (id: string, instruction: Instruction) => void;
  onDelete: (id: string) => void;
  dismiss: () => void;
}) => {
  const [text, setText] = useState(props.instruction.text);
  const [showInput, setShowInput] = useState(false);

  function save() {
    props.onChange(props.instruction.id, {
      id: props.instruction.id,
      text: text,
      length: props.instruction.length,
      time: props.instruction.time,
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
          onBlur={() => setShowInput(!showInput)}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="button"
            onClick={() => save()}
          >
            Save
          </button>
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            type="button"
            onClick={() => props.dismiss()}
          >
            Dismiss
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
            type="button"
            onClick={() => props.onDelete(props.instruction.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditComment;

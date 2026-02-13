import { useEditorContext } from "./EditorContext";

export default function TextComposerPanel() {
  const { state, helpers } = useEditorContext();
  const { isVisible, sportType } = { isVisible: state.textEditorIsVisible, sportType: state.sportType };
  if (!isVisible || sportType !== "bike") {
    return null;
  }

  return (
    <section className="grid gap-3 rounded-3xl border border-white/50 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] backdrop-blur-md lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Text Composer</p>
        <textarea
          onChange={(event) => helpers.transformTextToWorkout(event.target.value)}
          rows={10}
          spellCheck={false}
          className="block h-72 max-h-[55vh] w-full max-w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/40"
          placeholder="Add one block per line here:&#10;steady 3.0wkg 30s"
        />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">Syntax Guide</h2>
        <p className="mt-2">Each line maps to one workout block.</p>
        <div className="mt-4 space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Blocks</h3>
            <p className="mt-1 flex flex-wrap gap-1">
              {["steady", "warmup", "cooldown", "ramp", "intervals", "freeride", "message"].map((item) => (
                <span key={item} className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                  {item}
                </span>
              ))}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Examples</h3>
            <div className="mt-1 space-y-1">
              <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">steady 3.0wkg 30s</code>
              <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                warmup 2.0wkg-3.5wkg 10m
              </code>
              <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                interval 10x 30s-30s 4.0wkg-1.0wkg 110rpm-85rpm
              </code>
              <code className="block rounded-md bg-slate-900 px-2 py-1 text-xs text-emerald-200">
                message "Last one!" 20:00m
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

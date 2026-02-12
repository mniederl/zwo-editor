import { FLOAT, INTEGER, full, raw } from "./regex";

// Legacy experimental module kept for compatibility while parser work is migrated.
// New parser code should prefer src/utils/regex.ts directly.

export { FLOAT, INTEGER };

export const INTENSITY: RegExp = full(
  raw(String.raw`(?<value>(?:\d+(?:\.\d+)?|\d+))\s*(?<unit>w\/?kg|w|%)`),
  "i",
);

export function parseIntensity(input: string): { value: number; unit: "w/kg" | "w" | "%" } | null {
  const m = INTENSITY.exec(input.trim());
  if (!m?.groups) return null;

  const value = Number(m.groups.value);
  if (!Number.isFinite(value)) return null;

  const unitRaw = m.groups.unit.toLowerCase();
  const unit = (unitRaw === "wkg" ? "w/kg" : unitRaw) as "w/kg" | "w" | "%";
  return { value, unit };
}

export const re = (strings: TemplateStringsArray, ...values: (string | RegExp)[]): RegExp =>
  new RegExp(
    strings.reduce(
      (acc, str, i) =>
        acc +
        str +
        (i < values.length ? (values[i] instanceof RegExp ? values[i].source : values[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : ""),
      "",
    ),
  );

export const rf =
  (flags: string) =>
  (strings: TemplateStringsArray, ...values: (string | RegExp)[]): RegExp =>
    new RegExp(
      strings.reduce(
        (acc, str, i) =>
          acc +
          str +
          (i < values.length ? (values[i] instanceof RegExp ? values[i].source : values[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : ""),
        "",
      ),
      flags,
    );

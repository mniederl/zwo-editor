import { RANGE, TIME_TOKEN, WS, CADENCE_TOKEN, POWER_TOKEN, cap, full, opt, raw, seq } from "../utils/regex";

type Seconds = number;
export type Unit = "w" | "wkg" | "%";
export type PowerValue = { unit: Unit; value: number };
export type Range<T> = { a: T; b: T };

export type Steady = { t: "steady"; time?: Seconds; power?: PowerValue | Range<PowerValue>; cad?: number | Range<number> };
export type Ramp = { t: "ramp" | "warmup" | "cooldown"; time: Seconds; power: Range<PowerValue>; cad?: number | Range<number> };
export type Free = { t: "freeride"; time: Seconds; cad?: number | Range<number> };
export type Interval = { t: "interval"; reps: number; time: Range<Seconds>; power?: Range<PowerValue>; cad?: Range<number> };
export type Msg = { t: "message"; text: string; time?: Seconds };
export type Block = Steady | Ramp | Free | Interval | Msg;

const MESSAGE_TEXT = raw(String.raw`(?:\"(?<textD>[^\"]*)\"|'(?<textS>[^']*)')`);
const POWER_OR_RANGE = seq(POWER_TOKEN, opt(seq(raw("-"), POWER_TOKEN)));
const CADENCE_OR_RANGE = seq(CADENCE_TOKEN, opt(seq(raw("-"), CADENCE_TOKEN)));

const RX = {
  steady: full(
    seq(
      raw("steady"),
      opt(seq(WS, cap("power", POWER_OR_RANGE))),
      opt(seq(WS, cap("time", TIME_TOKEN))),
      opt(seq(WS, cap("cad", CADENCE_OR_RANGE))),
    ),
    "i",
  ),
  ramp: full(
    seq(
      cap("kind", raw(String.raw`(?:ramp|warmup|cooldown)`)),
      WS,
      cap("powerR", RANGE(POWER_TOKEN)),
      WS,
      cap("time", TIME_TOKEN),
      opt(seq(WS, cap("cad", CADENCE_OR_RANGE))),
    ),
    "i",
  ),
  freeride: full(seq(raw("freeride"), WS, cap("time", TIME_TOKEN), opt(seq(WS, cap("cad", CADENCE_OR_RANGE)))), "i"),
  interval: full(
    seq(
      raw("interval"),
      opt(seq(WS, cap("reps", raw(String.raw`\d+x`)))),
      WS,
      cap("timeR", RANGE(TIME_TOKEN)),
      opt(seq(WS, cap("powerR", RANGE(POWER_TOKEN)))),
      opt(seq(WS, cap("cadR", RANGE(CADENCE_TOKEN)))),
    ),
    "i",
  ),
  message: full(seq(raw("message"), WS, MESSAGE_TEXT, opt(seq(WS, cap("time", TIME_TOKEN)))), "i"),
};

const toSeconds = (s: string): Seconds => {
  if (s.includes(":")) {
    const [m, secWithSuffix] = s.split(":");
    return Number(m) * 60 + Number(secWithSuffix.slice(0, -1));
  }
  const n = Number(s.slice(0, -1));
  return /m$/i.test(s) ? n * 60 : n;
};

const parsePowerSingle = (s: string): PowerValue => {
  const m = s.match(/^(\d+(?:\.\d+)?)(wkg|w|%)$/i);
  if (!m) throw new Error(`invalid power token: ${s}`);
  return { unit: m[2].toLowerCase() as Unit, value: Number(m[1]) };
};

const parsePowerOrRange = (s?: string): PowerValue | Range<PowerValue> | undefined =>
  !s
    ? undefined
    : s.includes("-")
      ? (([a, b]) => ({ a: parsePowerSingle(a), b: parsePowerSingle(b) }))(s.split("-"))
      : parsePowerSingle(s);

const parseCadence = (s?: string): number | Range<number> | undefined =>
  !s
    ? undefined
    : s.includes("-")
      ? (([a, b]) => ({ a: Number(a.slice(0, -3)), b: Number(b.slice(0, -3)) }))(s.split("-"))
      : Number(s.slice(0, -3));

const parseSecondsRange = (s: string): Range<Seconds> => {
  const [a, b] = s.split("-");
  return { a: toSeconds(a), b: toSeconds(b) };
};

export function parseLine(line: string): Block {
  const s = line.trim();
  if (!s) throw new Error("invalid line");

  {
    const m = s.match(RX.message);
    if (m?.groups) {
      return {
        t: "message",
        text: m.groups.textD ?? m.groups.textS ?? "",
        time: m.groups.time ? toSeconds(m.groups.time) : undefined,
      };
    }
  }

  {
    const m = s.match(RX.interval);
    if (m?.groups) {
      return {
        t: "interval",
        reps: m.groups.reps ? Number(m.groups.reps.slice(0, -1)) : 3,
        time: parseSecondsRange(m.groups.timeR),
        power: m.groups.powerR
          ? (([a, b]) => ({ a: parsePowerSingle(a), b: parsePowerSingle(b) }))(m.groups.powerR.split("-"))
          : undefined,
        cad: m.groups.cadR
          ? (([a, b]) => ({ a: Number(a.slice(0, -3)), b: Number(b.slice(0, -3)) }))(m.groups.cadR.split("-"))
          : undefined,
      };
    }
  }

  {
    const m = s.match(RX.freeride);
    if (m?.groups) return { t: "freeride", time: toSeconds(m.groups.time), cad: parseCadence(m.groups.cad) };
  }

  {
    const m = s.match(RX.ramp);
    if (m?.groups) {
      return {
        t: m.groups.kind.toLowerCase() as Ramp["t"],
        time: toSeconds(m.groups.time),
        power: (([a, b]) => ({ a: parsePowerSingle(a), b: parsePowerSingle(b) }))(m.groups.powerR.split("-")),
        cad: parseCadence(m.groups.cad),
      };
    }
  }

  {
    const m = s.match(RX.steady);
    if (m?.groups) {
      return {
        t: "steady",
        time: m.groups.time ? toSeconds(m.groups.time) : undefined,
        power: parsePowerOrRange(m.groups.power),
        cad: parseCadence(m.groups.cad),
      };
    }
  }

  throw new Error("invalid line");
}

export const parseLines = (lines: string[]): Block[] =>
  lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine);

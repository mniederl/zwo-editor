import { XMLParser } from "fast-xml-parser";

import { genId } from "@utils/id";
import type { BarType, DurationType, Instruction, SportType } from "../components/Editor/Editor";

export interface ParsedWorkoutXml {
  meta: {
    author: string;
    name: string;
    description: string;
    tags: string[];
    sportType: SportType;
    durationType: DurationType;
  };
  segments: BarType[];
  instructions: Instruction[];
}

interface ParseWorkoutXmlOptions {
  idGenerator?: () => string;
}

type OrderedNode = Record<string, unknown> & { ":@"?: Record<string, unknown> };

const parser = new XMLParser({
  ignoreAttributes: false,
  preserveOrder: true,
  attributeNamePrefix: "",
  processEntities: true,
});

const toArray = <T>(v: T | T[] | undefined): T[] => (Array.isArray(v) ? v : v === undefined ? [] : [v]);

const asNumber = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const readText = (nodes: OrderedNode[] | undefined, key: string): string => {
  const node = nodes?.find((n) => key in n);
  if (!node) return "";
  const children = toArray(node[key] as OrderedNode[] | undefined);
  const textNode = children.find((c) => "#text" in c);
  return String(textNode?.["#text"] ?? "");
};

const readAttributes = (node: OrderedNode): Record<string, unknown> => node[":@"] || {};

const readAttr = (attrs: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    if (attrs[key] !== undefined) return String(attrs[key]);
  }
  return "";
};

export function parseWorkoutXml(xmlString: string, { idGenerator = genId }: ParseWorkoutXmlOptions = {}): ParsedWorkoutXml {
  const parsed = parser.parse(xmlString) as OrderedNode[];

  const rootNode = parsed.find((n) => "workout_file" in n);
  if (!rootNode) {
    throw new Error("Invalid workout file format: missing workout_file element");
  }
  const rootChildren = toArray(rootNode?.workout_file as OrderedNode[] | undefined);

  const author = readText(rootChildren, "author");
  const name = readText(rootChildren, "name");
  const description = readText(rootChildren, "description");

  const sportTypeRaw = readText(rootChildren, "sportType").toLowerCase();
  const durationTypeRaw = readText(rootChildren, "durationType").toLowerCase();
  const sportType: SportType = sportTypeRaw === "run" ? "run" : "bike";
  const durationType: DurationType = durationTypeRaw === "distance" ? "distance" : "time";

  const tagsNode = rootChildren.find((n) => "tags" in n);
  const tagsChildren = toArray(tagsNode?.tags as OrderedNode[] | undefined);
  const tags = tagsChildren
    .filter((n) => "tag" in n)
    .map((n) => String(readAttributes(n).name || ""))
    .filter(Boolean);

  const workoutNode = rootChildren.find((n) => "workout" in n);
  const workoutChildren = toArray(workoutNode?.workout as OrderedNode[] | undefined);

  const segments: BarType[] = [];
  const instructions: Instruction[] = [];

  let totalTime = 0;
  let totalLength = 0;

  workoutChildren.forEach((entry) => {
    const segmentName = Object.keys(entry).find((k) => k !== ":@");
    if (!segmentName) return;

    const attrs = readAttributes(entry);
    const childNodes = toArray(entry[segmentName] as OrderedNode[] | undefined);
    const segmentStartTime = totalTime;
    const segmentStartLength = totalLength;
    let segmentSpan = 0;

    if (segmentName === "SteadyState") {
      const duration = asNumber(readAttr(attrs, "Duration"));
      const pace = asNumber(readAttr(attrs, "pace", "Pace"));
      const bar: BarType = {
        id: idGenerator(),
        type: "bar",
        time: durationType === "time" ? duration : 0,
        length: durationType === "distance" ? duration : 0,
        power: asNumber(readAttr(attrs, "Power", "PowerLow"), 1),
        cadence: asNumber(readAttr(attrs, "Cadence"), 0),
        pace,
      };
      segments.push(bar);
      segmentSpan = duration;
    } else if (segmentName === "Ramp" || segmentName === "Warmup" || segmentName === "Cooldown") {
      const duration = asNumber(readAttr(attrs, "Duration"));
      const pace = asNumber(readAttr(attrs, "pace", "Pace"));
      const bar: BarType = {
        id: idGenerator(),
        type: "trapeze",
        time: durationType === "time" ? duration : 0,
        length: durationType === "distance" ? duration : 0,
        startPower: asNumber(readAttr(attrs, "PowerLow"), 1),
        endPower: asNumber(readAttr(attrs, "PowerHigh"), 1),
        cadence: asNumber(readAttr(attrs, "Cadence"), 0),
        pace,
      };
      segments.push(bar);
      segmentSpan = duration;
    } else if (segmentName === "IntervalsT") {
      const repeat = asNumber(readAttr(attrs, "Repeat"), 1);
      const on = asNumber(readAttr(attrs, "OnDuration"), 30);
      const off = asNumber(readAttr(attrs, "OffDuration"), 120);
      const duration = (on + off) * repeat;
      const pace = asNumber(readAttr(attrs, "pace", "Pace"));

      const bar: BarType = {
        id: idGenerator(),
        type: "interval",
        time: durationType === "time" ? duration : 0,
        length: durationType === "distance" ? duration : 0,
        repeat,
        onDuration: durationType === "time" ? on : undefined,
        offDuration: durationType === "time" ? off : undefined,
        onLength: durationType === "distance" ? on : undefined,
        offLength: durationType === "distance" ? off : undefined,
        onPower: asNumber(readAttr(attrs, "OnPower"), 1),
        offPower: asNumber(readAttr(attrs, "OffPower"), 0.5),
        cadence: asNumber(readAttr(attrs, "Cadence"), 0),
        restingCadence: asNumber(readAttr(attrs, "CadenceResting"), 0),
        pace,
      };
      segments.push(bar);
      segmentSpan = duration;
    } else if (segmentName === "FreeRide") {
      const duration = asNumber(readAttr(attrs, "Duration"));
      const bar: BarType = {
        id: idGenerator(),
        type: "freeRide",
        time: durationType === "time" ? duration : 0,
        length: durationType === "distance" ? duration : 0,
        cadence: asNumber(readAttr(attrs, "Cadence"), 0),
      };
      segments.push(bar);
      segmentSpan = duration;
    }

    childNodes
      .filter((n) => "textevent" in n)
      .forEach((n) => {
        const textAttrs = readAttributes(n);
        instructions.push({
          id: idGenerator(),
          text: String(readAttr(textAttrs, "message")),
          time:
            durationType === "time"
              ? segmentStartTime + asNumber(readAttr(textAttrs, "timeoffset"), 0)
              : 0,
          length:
            durationType === "distance"
              ? segmentStartLength + asNumber(readAttr(textAttrs, "distoffset"), 0)
              : 0,
        });
      });

    totalTime += durationType === "time" ? segmentSpan : 0;
    totalLength += durationType === "distance" ? segmentSpan : 0;
  });

  return {
    meta: {
      author,
      name,
      description,
      tags,
      sportType,
      durationType,
    },
    segments,
    instructions,
  };
}

export default parseWorkoutXml;

import { XMLBuilder } from "fast-xml-parser";

import type { DurationType, Instruction, SegmentType, SportType } from "@/domain/workout/types";

interface Workout {
  author: string;
  name: string;
  description: string;
  sportType: SportType;
  durationType: DurationType;
  tags: string[];
  bars: Array<SegmentType>;
  instructions: Array<Instruction>;
}

export default function createWorkoutXml({
  author,
  name,
  description,
  sportType,
  durationType,
  tags,
  bars,
  instructions,
}: Workout): string {
  let totalTime = 0;
  let totalLength = 0;
  const workoutNodes: Array<Record<string, unknown>> = [];

  const addTextEvents = (nodeChildren: Array<Record<string, unknown>>, bar: SegmentType) => {
    if (durationType === "time") {
      instructions
        .filter((instruction) => instruction.time >= totalTime && instruction.time < totalTime + bar.time)
        .forEach((instruction) => {
          nodeChildren.push({
            textevent: [],
            ":@": {
              timeoffset: instruction.time - totalTime,
              message: instruction.text,
            },
          });
        });
      totalTime += bar.time;
      totalLength += bar.length;
      return;
    }

    instructions
      .filter((instruction) => instruction.length >= totalLength && instruction.length < totalLength + bar.length)
      .forEach((instruction) => {
        nodeChildren.push({
          textevent: [],
          ":@": {
            distoffset: instruction.length - totalLength,
            message: instruction.text,
          },
        });
      });
    totalTime += bar.time;
    totalLength += bar.length;
  };

  bars.forEach((bar, index) => {
    const children: Array<Record<string, unknown>> = [];
    let nodeName = "FreeRide";
    let attrs: Record<string, unknown> = {};

    if (bar.type === "bar") {
      nodeName = "SteadyState";
      attrs = {
        Duration: durationType === "time" ? bar.time : bar.length,
        Power: bar.power,
        pace: bar.pace,
      };
      if (bar.cadence !== 0) attrs.Cadence = bar.cadence;
    } else if (bar.type === "trapeze") {
      nodeName = "Ramp";
      if (index === 0) nodeName = "Warmup";
      if (index === bars.length - 1 && bar.startPower > bar.endPower) nodeName = "Cooldown";
      if (bar.startPower < bar.endPower) {
        attrs = {
          Duration: durationType === "time" ? bar.time : bar.length,
          PowerLow: bar.startPower,
          PowerHigh: bar.endPower,
          pace: bar.pace,
        };
      } else {
        attrs = {
          Duration: durationType === "time" ? bar.time : bar.length,
          // Keep legacy behavior for Zwift compatibility.
          PowerLow: bar.startPower,
          PowerHigh: bar.endPower,
          pace: bar.pace,
        };
      }
      if (bar.cadence !== 0) attrs.Cadence = bar.cadence;
    } else if (bar.type === "interval") {
      nodeName = "IntervalsT";
      attrs = {
        Repeat: bar.repeat,
        OnDuration: durationType === "time" ? bar.onDuration : bar.onLength,
        OffDuration: durationType === "time" ? bar.offDuration : bar.offLength,
        OnPower: bar.onPower,
        OffPower: bar.offPower,
        pace: bar.pace,
      };
      if (bar.cadence !== 0) attrs.Cadence = bar.cadence;
      if (bar.restingCadence !== 0) attrs.CadenceResting = bar.restingCadence;
    } else {
      nodeName = "FreeRide";
      attrs = {
        Duration: durationType === "time" ? bar.time : bar.length,
        FlatRoad: 0,
      };
      if (bar.cadence !== 0) attrs.Cadence = bar.cadence;
    }

    addTextEvents(children, bar);
    workoutNodes.push({
      [nodeName]: children,
      ":@": attrs,
    });
  });

  const root = [
    {
      workout_file: [
        { author: [{ "#text": author }] },
        { name: [{ "#text": name }] },
        { description: [{ "#text": description }] },
        { sportType: [{ "#text": sportType }] },
        { durationType: [{ "#text": durationType }] },
        {
          tags: tags.map((tag) => ({
            tag: [],
            ":@": { name: tag },
          })),
        },
        { workout: workoutNodes },
      ],
    },
  ];

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
    attributeNamePrefix: "",
    format: true,
    suppressEmptyNode: true,
  });

  return builder.build(root);
}

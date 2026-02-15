import { describe, expect, it } from "vitest";

import createWorkoutXml from "../src/components/Editor/createWorkoutXml";
import { parseWorkoutXml } from "@/parsers/parseWorkoutXml";

describe("parseWorkoutXml + createWorkoutXml", () => {
  it("throws on invalid xml root", () => {
    expect(() => parseWorkoutXml("<invalid></invalid>")).toThrow(/workout_file/i);
  });

  it("round-trips a time-based workout", () => {
    const xml = createWorkoutXml({
      author: "tester",
      name: "sample",
      description: "time workout",
      sportType: "bike",
      durationType: "time",
      tags: ["tagA", "tagB"],
      bars: [
        {
          id: "b1",
          type: "bar",
          time: 60,
          length: 0,
          power: 0.7,
          cadence: 90,
          pace: 0,
        },
        {
          id: "i1",
          type: "interval",
          time: 180,
          length: 0,
          repeat: 2,
          onDuration: 30,
          offDuration: 60,
          onPower: 1.1,
          offPower: 0.5,
          cadence: 95,
          restingCadence: 80,
          pace: 0,
          onLength: 200,
          offLength: 200,
        },
      ],
      instructions: [
        { id: "t1", text: "go", time: 20, length: 0 },
        { id: "t2", text: "again", time: 120, length: 0 },
      ],
    });

    let n = 0;
    const parsed = parseWorkoutXml(xml, { idGenerator: () => `id-${++n}` });

    expect(parsed.meta.author).toBe("tester");
    expect(parsed.meta.name).toBe("sample");
    expect(parsed.meta.durationType).toBe("time");
    expect(parsed.meta.tags).toEqual(["tagA", "tagB"]);

    expect(parsed.segments.length).toBe(2);
    expect(parsed.segments[0].type).toBe("bar");
    expect(parsed.segments[1].type).toBe("interval");
    const secondSegment = parsed.segments[1];
    if (secondSegment?.type !== "interval") {
      throw new Error("Expected second segment to be interval");
    }
    expect(secondSegment.repeat).toBe(2);
    expect(secondSegment.onDuration).toBe(30);
    expect(secondSegment.offDuration).toBe(60);

    expect(parsed.instructions.length).toBe(2);
    expect(parsed.instructions[0].text).toBe("go");
    expect(parsed.instructions[0].time).toBe(20);
    expect(parsed.instructions[1].text).toBe("again");
    expect(parsed.instructions[1].time).toBe(120);
  });

  it("round-trips a distance-based workout with distoffset text events", () => {
    const xml = createWorkoutXml({
      author: "runner",
      name: "distance sample",
      description: "distance workout",
      sportType: "run",
      durationType: "distance",
      tags: ["run"],
      bars: [
        {
          id: "b1",
          type: "bar",
          time: 0,
          length: 1000,
          power: 0.8,
          cadence: 0,
          pace: 0,
        },
      ],
      instructions: [{ id: "d1", text: "halfway", time: 0, length: 500 }],
    });

    let n = 0;
    const parsed = parseWorkoutXml(xml, { idGenerator: () => `id-${++n}` });

    expect(parsed.meta.sportType).toBe("run");
    expect(parsed.meta.durationType).toBe("distance");
    expect(parsed.segments.length).toBe(1);
    expect(parsed.segments[0].length).toBe(1000);
    expect(parsed.instructions.length).toBe(1);
    expect(parsed.instructions[0].length).toBe(500);
  });

  it("keeps a single ramp-up trapeze as Warmup (not Cooldown)", () => {
    const xml = createWorkoutXml({
      author: "tester",
      name: "warmup check",
      description: "single trapeze should remain warmup",
      sportType: "bike",
      durationType: "time",
      tags: [],
      bars: [
        {
          id: "t1",
          type: "trapeze",
          time: 120,
          length: 0,
          startPower: 0.5,
          endPower: 0.8,
          cadence: 90,
          pace: 0,
        },
      ],
      instructions: [],
    });

    expect(xml).toContain("<Warmup");
    expect(xml).not.toContain("<Cooldown");
  });
});



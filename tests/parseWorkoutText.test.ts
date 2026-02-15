import { describe, expect, it } from "vitest";

import type { FreeRideSegment, IntervalSegment, RampSegment, SteadySegment } from "@/domain/workout/types";
import { calculateTime, round } from "@/domain/workout/metrics";
import { parseWorkoutText } from "@/parsers/parseWorkoutText";

describe("parseWorkoutText", () => {
  it("parses a simple steady block with seconds", () => {
    const { segments, instructions } = parseWorkoutText("steady 120w 30s");
    expect(segments.length).toBe(1);
    const s = segments[0] as SteadySegment;
    expect(s.type).toBe("bar");
    expect(s.time).toBe(30);
    // power is scaled by default ftp=200 -> 120/200 = 0.6
    expect(s.power).toBeCloseTo(120 / 200, 6);
    expect(s.cadence).toBe(0);
    expect(instructions.length).toBe(0);
  });

  it("parses multiple block types including ramp, freeride, interval and message", () => {
    const input = [
      "steady 120w 30s",
      "ramp 120w-140w 1m",
      "freeride 5m 90rpm",
      "interval 3x 30s-60s 200w-100w 100rpm-80rpm",
      'message "Be ready" 15s',
    ].join("\n");

    const { segments, instructions } = parseWorkoutText(input);
    expect(segments.length).toBe(4);
    // steady
    expect(segments[0].type).toBe("bar");
    expect(segments[0].time).toBe(30);
    // ramp/trapeze
    const t = segments[1] as RampSegment;
    expect(t.type).toBe("trapeze");
    expect(t.startPower).toBeCloseTo(120 / 200, 6);
    expect(t.endPower).toBeCloseTo(140 / 200, 6);
    expect(t.time).toBe(60);

    // freeride
    const f = segments[2] as FreeRideSegment;
    expect(f.type).toBe("freeRide");
    expect(f.time).toBe(300);
    expect(f.cadence).toBe(90);

    // interval
    const itv = segments[3] as IntervalSegment;
    expect(itv.type).toBe("interval");
    expect(itv.repeat).toBe(3);
    expect(itv.time).toBe(270);
    expect(itv.onDuration).toBe(30);
    expect(itv.offDuration).toBe(60);
    expect(itv.onPower).toBeCloseTo(200 / 200, 6);
    expect(itv.offPower).toBeCloseTo(100 / 200, 6);

    expect(instructions.length).toBe(1);
    expect(instructions[0].text).toBe("Be ready");
    expect(instructions[0].time).toBe(15);
  });

  it("respects distance mode when calculateSpeed is provided", () => {
    // In distance mode the parser uses a default length (200) and converts to time using calculateTime
    const calcSpeed = () => 2; // m/s
    const { segments } = parseWorkoutText("steady 120w", { durationType: "distance", calculateSpeed: calcSpeed });
    expect(segments.length).toBe(1);
    const s = segments[0];
    // expected time = calculateTime(lengthDefault, speed) where lengthDefault=200
    const expected = round(calculateTime(200, calcSpeed()), 1);
    expect(s.time).toBe(expected);
    expect(s.length).toBe(200);
  });

  it("parses watts-per-kg and percentage FTP power tokens", () => {
    // 3.0wkg with default weight 75 -> 3*75 / 200 = 1.125
    const { segments: s1 } = parseWorkoutText("steady 3.0wkg 30s");
    expect(s1[0].type).toBe("bar");
    expect((s1[0] as SteadySegment).power).toBeCloseTo((3.0 * 75) / 200, 6);

    // 75% should translate to 0.75
    const { segments: s2 } = parseWorkoutText("steady 75% 20s");
    expect((s2[0] as SteadySegment).power).toBeCloseTo(0.75, 6);
  });

  it("handles interval multipliers and message defaults", () => {
    const input = [
      "interval 10x 30s-30s 300w-180w",
      "", // empty line should be ignored
      'message "No time specified"',
    ].join("\n");
    const { segments, instructions } = parseWorkoutText(input);
    expect(segments.length).toBe(1);
    const itv = segments[0] as IntervalSegment;
    expect(itv.repeat).toBe(10);

    // message without a duration should default to 0
    expect(instructions.length).toBe(1);
    expect(instructions[0].time).toBe(0);
    expect(instructions[0].text).toContain("No time specified");
  });

  it("accepts single-quoted messages", () => {
    const { instructions } = parseWorkoutText("message 'Stay focused' 10s");
    expect(instructions).toHaveLength(1);
    expect(instructions[0].text).toBe("Stay focused");
    expect(instructions[0].time).toBe(10);
  });

  describe("invalid inputs (should fail)", () => {
    it("throws on malformed power token (missing number before 'w')", () => {
      expect(() => parseWorkoutText("steady w 30s")).toThrow();
    });

    it("throws on malformed duration token (missing number before 's')", () => {
      expect(() => parseWorkoutText("steady 120w s")).toThrow();
    });

    it("throws on malformed interval multiplier (missing digits before 'x')", () => {
      expect(() => parseWorkoutText("interval x 30s-30s 100w-80w")).toThrow();
    });

    it("throws on message with unclosed quote", () => {
      expect(() => parseWorkoutText('message "Unclosed 10s')).toThrow();
    });
  });
  /* it("parses a message containing other keywords (like 'steady') as an instruction", () => {
    const input = 'message "Keep steady until the end" 10s';
    const { segments, instructions } = parseWorkoutText(input);
    // no segments should be created
    expect(segments.length, "Expected no segments to be created").toBe(0);
    expect(instructions.length, "Expected one instruction to be created").toBe(1);
    expect(instructions[0].text).toBe("Keep steady until the end");
    expect(instructions[0].time).toBe(10);
  }) */
});

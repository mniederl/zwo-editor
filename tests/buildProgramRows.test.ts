import { describe, expect, it } from "vitest";

import buildProgramRows from "../src/components/Editor/buildProgramRows";
import type { SegmentType } from "../src/components/Editor/editorTypes";

describe("buildProgramRows", () => {
  it("groups intervals and formats bike rows", () => {
    const bars: SegmentType[] = [
      {
        id: "bar-a",
        type: "bar",
        time: 90,
        length: 0,
        power: 0.7,
        cadence: 0,
        pace: 0,
      },
      {
        id: "int-a",
        type: "interval",
        time: 0,
        length: 0,
        cadence: 95,
        restingCadence: 85,
        repeat: 2,
        onDuration: 10,
        offDuration: 20,
        onLength: 0,
        offLength: 0,
        onPower: 1.1,
        offPower: 0.5,
        pace: 0,
      },
      {
        id: "fr-a",
        type: "freeRide",
        time: 120,
        length: 0,
        cadence: 0,
      },
    ];

    const rows = buildProgramRows({
      bars,
      sportType: "bike",
      durationType: "time",
      ftp: 200,
    });

    expect(rows).toHaveLength(4);
    expect(rows[0].text).toBe("1min 30sec @ 140W");
    expect(rows[1].text).toBe("10sec @ 220W, 95rpm");
    expect(rows[2].text).toBe("20sec @ 100W, 85rpm");
    expect(rows[1].variant).toBe("intervalOn");
    expect(rows[2].variant).toBe("intervalOff");
    expect(rows[1].repeatCount).toBe(2);
    expect(rows[2].repeatCount).toBe(2);
    expect(rows[3].text).toBe("2min Free Ride");
  });

  it("formats distance durations in metric units", () => {
    const rows = buildProgramRows({
      bars: [
        {
          id: "bar-distance",
          type: "bar",
          time: 0,
          length: 1500,
          power: 0.8,
          cadence: 0,
          pace: 0,
        },
      ],
      sportType: "bike",
      durationType: "distance",
      ftp: 200,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe("1.5km @ 160W");
  });
});

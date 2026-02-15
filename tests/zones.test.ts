import { describe, expect, it } from "vitest";

import { Colors, Zones, getZoneColor } from "@/domain/workout/zones";

describe("zones", () => {
  it("maps power to zone colors at boundaries", () => {
    expect(getZoneColor(0)).toBe(Colors.GRAY);
    expect(getZoneColor(Zones.Z2.min)).toBe(Colors.BLUE);
    expect(getZoneColor(Zones.Z3.min)).toBe(Colors.GREEN);
    expect(getZoneColor(Zones.Z4.min)).toBe(Colors.YELLOW);
    expect(getZoneColor(Zones.Z5.min)).toBe(Colors.ORANGE);
    expect(getZoneColor(Zones.Z6.min)).toBe(Colors.RED);
  });
});

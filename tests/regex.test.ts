import { describe, expect, it } from "vitest";

import { anchor, FLOAT, group, INTEGER, raw, rx, SPACES, TIME } from "../src/utils/regex";

describe("Regular Expressions", () => {
  it("should match valid time strings", () => {
    const validTimes = ["00:00", "01:23", "12:34", "23:59"];
    const invalidTimes = ["24:00", "12:60", "1:23", "1234", "ab:cd"];

    validTimes.forEach((time) => {
      expect(TIME.test(time)).toBe(true);
    });

    invalidTimes.forEach((time) => {
      expect(TIME.test(time)).toBe(false);
    });
  });

  it("should construct regex from parts correctly", () => {
    const re = rx(["hello", /\s+/, "world"], "i");
    expect(re.test("hello world")).toBe(true);
    expect(re.test("HELLO   WORLD")).toBe(true);
    expect(re.test("helloworld")).toBe(false);
  });

  it("Intensity specifier regex", () => {
    const intensityRe: RegExp = rx(
      anchor(
        group(group(FLOAT, raw(" ?w/?kg")), raw("|"), group(INTEGER, raw(" ?w")), raw("|"), group(INTEGER, raw(" ?%"))),
      ),
      "i",
    );

    console.log(intensityRe);

    // const intensityRe = rx([/^((?:\d+(?:\.\d+)?) ?w\/?kg|\d+ ?w|\d+ ?%)$/i]);
    expect(intensityRe.test("150w")).toBe(true);
    expect(intensityRe.test("2.1 wkg")).toBe(true);
    expect(intensityRe.test("2.53 w/kg")).toBe(true);
    expect(intensityRe.test("85%")).toBe(true);
  });

  it("Intensity specifier regex rejects invalid formats", () => {
    const intensityRe: RegExp = rx(
      anchor(
        group(
          group(FLOAT, SPACES, " ?w", /\/?/, "kg"),
          raw("|"),
          group(INTEGER, SPACES, "w"),
          raw("|"),
          group(INTEGER, SPACES, "%"),
        ),
      ),
      "i",
    );

    // const intensityRe = rx([/^((?:\d+(?:\.\d+)?) ?w\/?kg|\d+ ?w|\d+ ?%)$/i]);
    expect(intensityRe.test("2..5wkg")).toBe(false);
    expect(intensityRe.test("100")).toBe(false);
    expect(intensityRe.test("10.1 %")).toBe(false);
    expect(intensityRe.test("153.5 W")).toBe(false);
  });
});

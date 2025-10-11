import { describe, it, expect } from "vitest";
import {
  parseTime,
  formatTime,
} from "../src/utils/time";

describe("time utils", () => {
  describe("parseHhMmSsToSeconds", () => {
    it("parses MM:SS correctly", () => {
      expect(parseTime("00:00")).toBe(0);
      expect(parseTime("01:02")).toBe(62);
      expect(parseTime("5:07")).toBe(307);
    });

    it("parses HH:MM:SS correctly", () => {
      expect(parseTime("1:02:03")).toBe(3723);
      expect(parseTime("12:34:56")).toBe(45296);
    });

    it("allows single-digit tokens and trims whitespace", () => {
      expect(parseTime(" 1:2:3 ")).toBe(3723);
    });

    it("throws on non-string input", () => {
      // pass a deliberately wrong runtime value via a cast to bypass TS static typing
      expect(() => parseTime(null as unknown as string)).toThrow(TypeError);
    });

    it("throws on wrong token count", () => {
      expect(() => parseTime("1:2:3:4")).toThrow(Error);
      expect(() => parseTime("123")).toThrow(Error);
    });

    it("throws on invalid numeric tokens or out-of-range minutes/seconds", () => {
      expect(() => parseTime("1:2a")).toThrow(Error);
      expect(() => parseTime("1:60")).toThrow(Error);
      expect(() => parseTime("00:99")).toThrow(Error);
    });
  });

  describe("formatTime mm:ss", () => {
    it("formats seconds to MM:SS", () => {
      expect(formatTime(0, "mm:ss")).toBe("00:00");
      expect(formatTime(62, "mm:ss")).toBe("01:02");
      // floors fractional seconds
      expect(formatTime(61.9, "mm:ss")).toBe("01:01");
    });

    it("clamps negative inputs to 00:00", () => {
      expect(formatTime(-10, "mm:ss")).toBe("00:00");
    });

    it("throws on non-finite numbers", () => {
      expect(() => formatTime(Infinity as unknown as number, "mm:ss")).toThrow(TypeError);
      expect(() => formatTime(NaN as unknown as number, "mm:ss")).toThrow(TypeError);
    });
  });

  describe("formatTime hh:mm:ss", () => {
    it("formats seconds to HH:MM:SS", () => {
      expect(formatTime(0, "hh:mm:ss")).toBe("00:00:00");
      expect(formatTime(3661, "hh:mm:ss")).toBe("01:01:01");
      expect(formatTime(45296, "hh:mm:ss")).toBe("12:34:56");
    });

    it("throws on non-finite numbers", () => {
      expect(() => formatTime(Infinity as unknown as number, "hh:mm:ss")).toThrow(TypeError);
    });
  });
});

describe("parseHhMmSsToSeconds - extra edge cases", () => {
  it("rejects empty and malformed separators", () => {
    expect(() => parseTime("")).toThrow(Error);
    expect(() => parseTime("::")).toThrow(Error);
    expect(() => parseTime("01: 02")).toThrow(Error); // internal space
  });

  it("rejects undefined explicitly", () => {
    expect(() => parseTime(undefined as unknown as string)).toThrow(TypeError);
  });

  it("documents that MM:SS overflows are invalid (use HH:MM:SS instead)", () => {
    // 60:00 would be 3600s but parser forbids m=60 → must use 1:00:00
    expect(() => parseTime("60:00")).toThrow(Error);
    expect(parseTime("1:00:00")).toBe(3600);
  });

  it("rejects HH:MM:SS with 3-digit hours", () => {
    expect(() => parseTime("100:00:00")).toThrow(Error);
  });
});

describe("formatTime mm:ss - extra behavior", () => {
  it("allows minute values >= 60 in formatted output (duration semantics)", () => {
    expect(formatTime(3600, "mm:ss")).toBe("60:00");
    expect(formatTime(3661, "mm:ss")).toBe("61:01");
  });
});

describe("formatTime hh:mm:ss - extra behavior", () => {
  it("floors fractional seconds", () => {
    expect(formatTime(3661.9, "hh:mm:ss")).toBe("01:01:01");
  });

  it("supports very large durations (>= 24h)", () => {
    expect(formatTime(86400, "hh:mm:ss")).toBe("24:00:00");
    expect(formatTime(360000, "hh:mm:ss")).toBe("100:00:00");
  });
});

describe("basic invariants", () => {
  it("HH:MM:SS → parse → HH:MM:SS round-trips on a sample set", () => {
    const samples = [0, 59, 60, 3599, 3600, 45296, 86399, 86400, 359999];
    for (const s of samples) {
      const hms = formatTime(s, "hh:mm:ss");
      expect(parseTime(hms)).toBe(Math.floor(s));
    }
  });

  it("monotonicity: increasing seconds should not decrease formatted strings numerically", () => {
    const a = 3723, b = 3724;
    expect(Number(formatTime(a, "mm:ss").replace(":", "")))
      .toBeLessThanOrEqual(Number(formatTime(b, "mm:ss").replace(":", "")));
    expect(Number(formatTime(a, "hh:mm:ss").replaceAll(":", "")))
      .toBeLessThanOrEqual(Number(formatTime(b, "hh:mm:ss").replaceAll(":", "")));
  });
});

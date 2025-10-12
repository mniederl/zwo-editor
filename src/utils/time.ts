/**
 * Parse a time string into a total number of seconds.
 *
 * Accepts strings in "HH:MM:SS" or "MM:SS" form (hours are optional). Leading and
 * trailing whitespace is trimmed before parsing. Each part must be 1–2 digits,
 * and minutes and seconds must be in the range 0–59.
 *
 * @param s - Time string to parse (e.g. "03:25" or "01:02:03").
 * @returns The total number of seconds represented by the input.
 *
 * @throws {TypeError} If the provided value is not a string.
 * @throws {Error} If the input does not match "HH:MM:SS" or "MM:SS",
 *                 if any token contains non-digit characters or more than
 *                 two digits, or if minutes/seconds are outside 0–59.
 *
 * @example
 * ```ts
 * parseTime("2:15")       // returns 135
 * parseTime("01:02:03")   // returns 3723
 * ```
 */
export function parseTime(s: string): number {
  if (s.trim() === "") return 0;

  if (typeof s !== "string") throw new TypeError("Expected string");
  const parts = s.trim().split(":");
  if (parts.length < 2 || parts.length > 3) throw new Error("Use HH:MM:SS or MM:SS");

  const nums = parts.map((p) => {
    if (!/^\d{1,2}$/.test(p)) throw new Error("Invalid time token");
    return Number(p);
  });

  let h = 0,
    m = 0,
    sec = 0;
  if (nums.length === 3) [h, m, sec] = nums;
  else [m, sec] = nums;

  if (m > 59 || sec > 59) throw new Error("Minutes/seconds must be 0-59");
  return h * 3600 + m * 60 + sec;
}

/**
 * Format a duration given in seconds into a zero-padded time string.
 *
 * The function accepts a finite number of seconds, clamps negative values to 0,
 * and discards any fractional seconds by truncating toward zero. It supports
 * two output formats:
 *  - "hh:mm:ss" (default): hours, minutes, and seconds (each at least two digits).
 *  - "mm:ss": minutes and seconds (each at least two digits).
 *
 * @param totalSeconds - Total time in seconds. Must be a finite number. Fractional seconds are truncated.
 * @param format - Output format, either "hh:mm:ss" (default) or "mm:ss".
 * @returns A zero-padded time string in the requested format (e.g. "00:01:05" or "01:05").
 * @throws {TypeError} If totalSeconds is not a finite number.
 * @throws {Error} If an unsupported format string is provided.
 *
 * @example
 * // Default "hh:mm:ss"
 * formatTime(3661); // -> "01:01:01"
 *
 * @example
 * // "mm:ss" format
 * formatTime(65, "mm:ss"); // -> "01:05"
 *
 * @example
 * // Negative and fractional seconds are handled: negatives clamped to 0, fractions truncated
 * formatTime(-5.9); // -> "00:00:00"
 * formatTime(125.7, "mm:ss"); // -> "02:05"
 */
export function formatTime(totalSeconds: number, format: "hh:mm:ss" | "mm:ss" = "hh:mm:ss"): string {
  if (!Number.isFinite(totalSeconds)) throw new TypeError("Expected finite number");
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (format === "mm:ss") {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${pad(m)}:${pad(sec)}`;
  }

  if (format === "hh:mm:ss") {
    const h = Math.floor(s / 3600);
    const remainder = s % 3600;
    const m = Math.floor(remainder / 60);
    const sec = remainder % 60;
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  }

  throw new Error("Unsupported format string");
}

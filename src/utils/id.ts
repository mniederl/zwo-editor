/**
 * Generate a cryptographically-strong UUID v4 string.
 */
export const genId = (): string =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
      );

/**
 * Generate a short random ID string (8 hex characters).
 */
export const genShortId = (): string => {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

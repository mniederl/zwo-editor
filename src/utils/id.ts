/**
 * Generate a cryptographically-strong UUID v4 string.
 *
 * Example: "3b241101-e2bb-4255-8caf-4136c566a962"
 */
export const genId = (): string =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : // biome-ignore lint/style/useTemplate: This is a common UUID v4 generation snippet that uses crypto.getRandomValues, and the template string is more concise than alternatives.
      ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
      );

/**
 * Generate a short random ID string (8 hex characters).
 *
 * Example: "3b241101"
 */
export const genShortId = (): string => {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

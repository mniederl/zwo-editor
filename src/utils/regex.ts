type Piece = string | RegExp | { __raw: string };

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const raw = (s: string): { __raw: string } => ({ __raw: s });

const src = (p: Piece): string => (typeof p === "string" ? escapeRe(p) : "__raw" in p ? p.__raw : p.source);

export const rx = (parts: Piece[], flags: string = ""): RegExp => new RegExp(parts.map(src).join(""), flags);

export const seq = (...parts: Piece[]): Piece => raw(parts.map(src).join(""));
export const group = (...parts: Piece[]): Piece => raw(`(?:${parts.map(src).join("")})`);
export const alt = (...parts: Piece[]): Piece => raw(`(?:${parts.map(src).join("|")})`);
export const opt = (part: Piece): Piece => raw(`(?:${src(part)})?`);
export const cap = (name: string, part: Piece): Piece => raw(`(?<${name}>${src(part)})`);
export const anchor = (...parts: Piece[]): Piece[] => [raw("^"), ...parts, raw("$")];
export const full = (part: Piece, flags = ""): RegExp => new RegExp(`^${src(part)}$`, flags);
export const RANGE = (part: Piece): Piece => seq(part, raw("-"), part);

export const SPACES: RegExp = /\s*/;
export const WS: Piece = raw(String.raw`\s+`);

const HH: RegExp = /(?:[01]\d|2[0-3])/;
const MM: RegExp = /[0-5]\d/;
export const TIME: RegExp = rx([HH, ":", MM]);
export const TIME_RANGE: RegExp = rx([TIME, /\s*-\s*/, TIME]);

export const INTEGER: RegExp = /\d+/;
export const FLOAT: RegExp = /\d*\.?\d+/;

export const TIME_TOKEN: Piece = raw(String.raw`(?:\d+[sm]|(?:\d+:[0-5]?\d)m)`);
export const POWER_TOKEN: Piece = raw(String.raw`\d+(?:\.\d+)?(?:wkg|w|%)`);
export const CADENCE_TOKEN: Piece = raw(String.raw`\d{1,3}rpm`);

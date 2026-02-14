import { Colors, Zones } from "../constants";
import type { SegmentType, DurationType, SportType } from "./editorTypes";

export interface ProgramRow {
  id: string;
  segmentId: string;
  text: string;
  background: string;
  textColor: string;
  variant: "default" | "intervalOn" | "intervalOff";
  repeatCount?: number;
}

interface BuildProgramRowsOptions {
  bars: SegmentType[];
  sportType: SportType;
  durationType: DurationType;
  ftp: number;
}

const paceLabels = ["1M", "5K", "10K", "HM", "M"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}min`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}sec`);

  return parts.join(" ");
}

function formatDistance(meters: number): string {
  const safeMeters = Math.max(0, meters);
  if (safeMeters >= 1000) {
    const km = safeMeters / 1000;
    const decimals = Number.isInteger(km) ? 0 : 1;
    return `${km.toFixed(decimals)}km`;
  }
  return `${Math.round(safeMeters)}m`;
}

function formatDuration(value: number, durationType: DurationType): string {
  if (!Number.isFinite(value)) return durationType === "time" ? "0sec" : "0m";
  return durationType === "time" ? formatSeconds(value) : formatDistance(value);
}

function getZoneColor(power: number): string {
  if (power >= 0 && power < Zones.Z1.max) return Colors.GRAY;
  if (power >= Zones.Z2.min && power < Zones.Z2.max) return Colors.BLUE;
  if (power >= Zones.Z3.min && power < Zones.Z3.max) return Colors.GREEN;
  if (power >= Zones.Z4.min && power < Zones.Z4.max) return Colors.YELLOW;
  if (power >= Zones.Z5.min && power < Zones.Z5.max) return Colors.ORANGE;
  return Colors.RED;
}

function getTextColor(background: string): string {
  return background === Colors.YELLOW ? "#111827" : "#ffffff";
}

function isLightColor(color: string): boolean {
  return color === Colors.YELLOW;
}

function getGradientTextColor(startColor: string, endColor: string): string {
  if (isLightColor(startColor) && isLightColor(endColor)) return "#111827";
  return "#ffffff";
}

function formatBikePower(power: number, ftp: number): string {
  return `${Math.round(power * ftp)}W`;
}

function formatRunPower(power: number, pace: number): string {
  const safePaceIndex = clamp(pace, 0, paceLabels.length - 1);
  const paceLabel = paceLabels[safePaceIndex] || paceLabels[0];
  return `${Math.round(power * 100)}% ${paceLabel} pace`;
}

function withCadence(base: string, cadence: number, unit: "rpm" | "spm") {
  if (cadence <= 0) return base;
  return `${base}, ${Math.round(cadence)}${unit}`;
}

function createSolidRow({
  id,
  segmentId,
  text,
  power,
  variant = "default",
  repeatCount,
}: {
  id: string;
  segmentId: string;
  text: string;
  power: number;
  variant?: ProgramRow["variant"];
  repeatCount?: number;
}): ProgramRow {
  const color = getZoneColor(power);
  return {
    id,
    segmentId,
    text,
    background: color,
    textColor: getTextColor(color),
    variant,
    repeatCount,
  };
}

function createGradientRow({
  id,
  segmentId,
  text,
  startPower,
  endPower,
}: {
  id: string;
  segmentId: string;
  text: string;
  startPower: number;
  endPower: number;
}): ProgramRow {
  const startColor = getZoneColor(startPower);
  const endColor = getZoneColor(endPower);
  const background =
    startColor === endColor ? startColor : `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`;
  const textColor = startColor === endColor ? getTextColor(startColor) : getGradientTextColor(startColor, endColor);

  return {
    id,
    segmentId,
    text,
    background,
    textColor,
    variant: "default",
  };
}

function formatBarRow({
  cadence,
  durationLabel,
  ftp,
  pace,
  power,
  sportType,
}: {
  cadence: number;
  durationLabel: string;
  ftp: number;
  pace: number;
  power: number;
  sportType: SportType;
}) {
  if (sportType === "bike") {
    const target = withCadence(formatBikePower(power, ftp), cadence, "rpm");
    return `${durationLabel} @ ${target}`;
  }
  const target = withCadence(formatRunPower(power, pace), cadence, "spm");
  return `${durationLabel} @ ${target}`;
}

function formatRampRow({
  cadence,
  durationLabel,
  ftp,
  pace,
  startPower,
  endPower,
  sportType,
}: {
  cadence: number;
  durationLabel: string;
  ftp: number;
  pace: number;
  startPower: number;
  endPower: number;
  sportType: SportType;
}) {
  if (sportType === "bike") {
    const start = Math.round(startPower * ftp);
    const end = Math.round(endPower * ftp);
    return `${durationLabel} ${withCadence(`from ${start} to ${end}W`, cadence, "rpm")}`;
  }

  const start = Math.round(startPower * 100);
  const end = Math.round(endPower * 100);
  const safePaceIndex = clamp(pace, 0, paceLabels.length - 1);
  const paceLabel = paceLabels[safePaceIndex] || paceLabels[0];
  return `${durationLabel} ${withCadence(`from ${start} to ${end}% ${paceLabel} pace`, cadence, "spm")}`;
}

function formatIntervalStepRow({
  durationLabel,
  power,
  cadence,
  ftp,
  pace,
  sportType,
}: {
  durationLabel: string;
  power: number;
  cadence: number;
  ftp: number;
  pace: number;
  sportType: SportType;
}) {
  if (sportType === "bike") {
    const target = withCadence(formatBikePower(power, ftp), cadence, "rpm");
    return `${durationLabel} @ ${target}`;
  }

  const target = withCadence(formatRunPower(power, pace), cadence, "spm");
  return `${durationLabel} @ ${target}`;
}

export default function buildProgramRows({
  bars,
  sportType,
  durationType,
  ftp,
}: BuildProgramRowsOptions): ProgramRow[] {
  const rows: ProgramRow[] = [];

  bars.forEach((bar, barIndex) => {
    if (bar.type === "bar") {
      rows.push(
        createSolidRow({
          id: `${bar.id}-${barIndex}`,
          segmentId: bar.id,
          text: formatBarRow({
            cadence: bar.cadence,
            durationLabel: formatDuration(durationType === "time" ? bar.time : bar.length, durationType),
            ftp,
            pace: bar.pace ?? 0,
            power: bar.power,
            sportType,
          }),
          power: bar.power,
        }),
      );
      return;
    }

    if (bar.type === "trapeze") {
      const startPower = bar.startPower;
      const endPower = bar.endPower;
      rows.push(
        createGradientRow({
          id: `${bar.id}-${barIndex}`,
          segmentId: bar.id,
          text: formatRampRow({
            cadence: bar.cadence,
            durationLabel: formatDuration(durationType === "time" ? bar.time : bar.length, durationType),
            ftp,
            pace: bar.pace ?? 0,
            startPower,
            endPower,
            sportType,
          }),
          startPower,
          endPower,
        }),
      );
      return;
    }

    if (bar.type === "interval") {
      const repeat = Math.max(0, Math.round(bar.repeat));
      const onDuration = durationType === "time" ? bar.onDuration : bar.onLength;
      const offDuration = durationType === "time" ? bar.offDuration : bar.offLength;

      rows.push(
        createSolidRow({
          id: `${bar.id}-on-${barIndex}`,
          segmentId: bar.id,
          text: formatIntervalStepRow({
            durationLabel: formatDuration(onDuration, durationType),
            power: bar.onPower,
            cadence: bar.cadence,
            ftp,
            pace: bar.pace ?? 0,
            sportType,
          }),
          power: bar.onPower,
          variant: "intervalOn",
          repeatCount: repeat,
        }),
      );
      rows.push(
        createSolidRow({
          id: `${bar.id}-off-${barIndex}`,
          segmentId: bar.id,
          text: formatIntervalStepRow({
            durationLabel: formatDuration(offDuration, durationType),
            power: bar.offPower,
            cadence: bar.restingCadence,
            ftp,
            pace: bar.pace ?? 0,
            sportType,
          }),
          power: bar.offPower,
          variant: "intervalOff",
          repeatCount: repeat,
        }),
      );
      return;
    }

    const durationLabel = formatDuration(durationType === "time" ? bar.time : bar.length, durationType);
    rows.push({
      id: `${bar.id}-${barIndex}`,
      segmentId: bar.id,
      text: `${durationLabel} ${sportType === "bike" ? "Free Ride" : "Free Run"}`,
      background: Colors.GRAY,
      textColor: getTextColor(Colors.GRAY),
    });
  });

  return rows;
}

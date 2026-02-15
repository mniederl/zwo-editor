import type { SegmentType } from "@/domain/workout/types";
import { Colors, Zones, getZoneColor } from "@/domain/workout/zones";

import type { PreviewBlock } from "./workoutLibraryTypes";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeWorkoutFileName(name: string) {
  if (name.toLowerCase().endsWith(".zwo")) {
    return name;
  }
  return `${name}.zwo`;
}

export function stripWorkoutFileExtension(fileName: string) {
  return fileName.replace(/\.(zwo|xml)$/i, "");
}

export function getUniqueWorkoutFileName(baseName: string, existingFileNames: string[]) {
  const existing = new Set(existingFileNames.map((name) => name.toLowerCase()));
  const normalizedBase = normalizeWorkoutFileName(baseName);

  if (!existing.has(normalizedBase.toLowerCase())) {
    return normalizedBase;
  }

  const withoutExtension = stripWorkoutFileExtension(normalizedBase);
  let suffix = 1;
  while (suffix < 5000) {
    const candidate = normalizeWorkoutFileName(`${withoutExtension} copy${suffix > 1 ? ` ${suffix}` : ""}`);
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
    suffix += 1;
  }

  return normalizeWorkoutFileName(`${withoutExtension} copy ${Date.now()}`);
}

export function buildPreviewBlocks(segments: SegmentType[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  const referenceMaxPower = Math.max(
    Zones.Z6.max,
    ...segments.flatMap((segment) => {
      if (segment.type === "bar") {
        return [segment.power];
      }
      if (segment.type === "trapeze") {
        return [segment.startPower, segment.endPower];
      }
      if (segment.type === "interval") {
        return [segment.onPower, segment.offPower];
      }
      return [Zones.Z1.min];
    }),
  );
  const toPreviewHeight = (power: number) => clamp(8 + (power / referenceMaxPower) * 36, 8, 44);

  segments.forEach((segment) => {
    const segmentWidthWeight = Math.max(0.1, segment.time);

    if (segment.type === "bar") {
      blocks.push({
        background: getZoneColor(segment.power),
        height: toPreviewHeight(segment.power),
        widthWeight: segmentWidthWeight,
      });
      return;
    }

    if (segment.type === "trapeze") {
      const startColor = getZoneColor(segment.startPower);
      const endColor = getZoneColor(segment.endPower);
      blocks.push({
        background:
          startColor === endColor ? startColor : `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`,
        height: toPreviewHeight(Math.max(segment.startPower, segment.endPower)),
        widthWeight: segmentWidthWeight,
      });
      return;
    }

    if (segment.type === "interval") {
      const repeatCount = Math.max(1, Math.round(segment.repeat));
      const onWidthWeight = Math.max(0.1, segment.onDuration || segment.onLength || 0.1);
      const offWidthWeight = Math.max(0.1, segment.offDuration || segment.offLength || 0.1);

      for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
        blocks.push({
          background: getZoneColor(segment.onPower),
          height: toPreviewHeight(segment.onPower),
          widthWeight: onWidthWeight,
        });
        blocks.push({
          background: getZoneColor(segment.offPower),
          height: toPreviewHeight(segment.offPower),
          widthWeight: offWidthWeight,
        });
      }
      return;
    }

    blocks.push({
      background: Colors.GRAY,
      height: toPreviewHeight(Zones.Z1.min),
      widthWeight: segmentWidthWeight,
    });
  });

  return blocks;
}

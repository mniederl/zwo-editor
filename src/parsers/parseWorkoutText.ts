import { genId } from "@utils/id";
import type { BarType, DurationType, Instruction } from "../components/Editor/Editor";
import { calculateDistance, calculateTime, round } from "../components/helpers";
import { parseLines, type Block, type PowerValue, type Range } from "./parseWorkoutLine";

interface ParseOptions {
  durationType?: DurationType;
  ftp?: number;
  weight?: number;
  // function to convert pace index to speed (m/s)
  calculateSpeed?: (pace: number) => number;
}

export function parseWorkoutText(
  textValue: string,
  { durationType = "time", ftp = 200, weight = 75, calculateSpeed = () => 0 }: ParseOptions = {},
) {
  const segments: Array<BarType> = [];
  const instructions: Array<Instruction> = [];

  const powerToRatio = (power: PowerValue): number => {
    switch (power.unit) {
      case "w":
        return power.value / ftp;
      case "wkg":
        return (power.value * weight) / ftp;
      case "%":
        return power.value / 100;
      default:
        return 1;
    }
  };

  const firstCadence = (cad?: number | Range<number>): number => (typeof cad === "number" ? cad : cad?.a || 0);

  const toRange = (power?: PowerValue | Range<PowerValue>, defaults?: { a: number; b: number }) => {
    if (!power) return defaults || { a: 1, b: 1 };
    if ("value" in power) {
      const v = powerToRatio(power);
      return { a: v, b: v };
    }
    return { a: powerToRatio(power.a), b: powerToRatio(power.b) };
  };

  const blocks = parseLines(textValue.split("\n"));

  blocks.forEach((block: Block) => {
    if (block.t === "steady") {
      const power = block.power ? ("value" in block.power ? powerToRatio(block.power) : powerToRatio(block.power.a)) : 1;
      const cadence = firstCadence(block.cad);
      const pace = 0;
      const lengthDefault = 200;
      const duration = block.time || 300;

      const time =
        durationType === "time" ? duration : round(calculateTime(lengthDefault, calculateSpeed(pace)), 1);
      const length = durationType === "time" ? round(calculateDistance(duration, calculateSpeed(pace)), 1) : lengthDefault;

      segments.push({
        time,
        length,
        power,
        cadence,
        type: "bar",
        id: genId(),
        pace,
      } as BarType);
      return;
    }

    if (block.t === "ramp" || block.t === "warmup" || block.t === "cooldown") {
      const powers = toRange(block.power, { a: 1, b: 1 });
      const cadence = firstCadence(block.cad);
      const pace = 0;
      const lengthDefault = 1000;
      const duration = block.time || 300;

      const time =
        durationType === "time" ? duration : round(calculateTime(lengthDefault, calculateSpeed(pace)), 1);
      const length = durationType === "time" ? round(calculateDistance(duration, calculateSpeed(pace)), 1) : lengthDefault;

      segments.push({
        time,
        length,
        startPower: powers.a,
        endPower: powers.b,
        cadence,
        pace,
        type: "trapeze",
        id: genId(),
      } as BarType);
      return;
    }

    if (block.t === "freeride") {
      const cadence = firstCadence(block.cad);
      const duration = block.time || 600;
      const length = 1000;

      segments.push({
        time: durationType === "time" ? duration : 0,
        length: durationType === "time" ? 0 : length,
        cadence,
        type: "freeRide",
        id: genId(),
      } as BarType);
      return;
    }

    if (block.t === "interval") {
      const repeat = block.reps || 3;
      const onDuration = block.time.a || 30;
      const offDuration = block.time.b || 120;
      const power = toRange(block.power, { a: 1, b: 0.5 });

      const cadence = block.cad?.a || 0;
      const restingCadence = block.cad?.b || 0;
      const pace = 0;

      const onLengthDefault = 200;
      const offLengthDefault = 200;

      const totalTime = (onDuration + offDuration) * repeat;
      const time =
        durationType === "time"
          ? totalTime
          : round(calculateTime((onLengthDefault + offLengthDefault) * repeat, calculateSpeed(pace)), 1);

      const length =
        durationType === "time"
          ? round(calculateDistance(totalTime, calculateSpeed(pace)), 1)
          : (onLengthDefault + offLengthDefault) * repeat;

      const onDurationVal =
        durationType === "time"
          ? onDuration
          : round(calculateTime(onLengthDefault / (power.a || 1), calculateSpeed(pace)), 1);
      const offDurationVal =
        durationType === "time"
          ? offDuration
          : round(calculateTime(offLengthDefault / (power.b || 1), calculateSpeed(pace)), 1);

      const onLengthVal =
        durationType === "time"
          ? round(calculateDistance(onDurationVal / (power.a || 1), calculateSpeed(pace)), 1)
          : onLengthDefault;
      const offLengthVal =
        durationType === "time"
          ? round(calculateDistance(offDurationVal / (power.b || 1), calculateSpeed(pace)), 1)
          : offLengthDefault;

      segments.push({
        time,
        length,
        id: genId(),
        type: "interval",
        cadence,
        restingCadence,
        repeat,
        onDuration: onDurationVal,
        offDuration: offDurationVal,
        onPower: power.a,
        offPower: power.b,
        pace,
        onLength: onLengthVal,
        offLength: offLengthVal,
      } as BarType);
      return;
    }

    if (block.t === "message") {
      instructions.push({ id: genId(), text: block.text || "", time: block.time || 0, length: 0 } as Instruction);
    }
  });

  return { segments, instructions };
}

export default parseWorkoutText;

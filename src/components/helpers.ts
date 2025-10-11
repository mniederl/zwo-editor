type DurationType = "time" | "distance"
type PaceUnitType = "metric" | "imperial"

interface BarBase { time: number }
interface Bar extends BarBase { type: "bar"; power: number; length: number }
interface Trapeze extends BarBase { type: "trapeze"; startPower: number; endPower: number; length: number }
interface FreeRide extends BarBase { type: "freeRide" }
interface Interval extends BarBase {
  type: "interval"
  repeat: number
  onDuration: number
  offDuration: number
  onPower: number
  offPower: number
  length: number
}
type WorkoutBar = Bar | Trapeze | FreeRide | Interval

const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d)

export const round = (x: number, roundTo: number): number =>
  Math.round(x / roundTo) * roundTo

export const calculateTime = (distance: number, speed: number): number => safeDiv(distance, speed)

export const calculateDistance = (time: number, speed: number): number => time * speed

export const calculateSpeed = (time: number, distance: number): number => safeDiv(distance, time)

export const getWorkoutLength = (bars: WorkoutBar[], durationType: DurationType): number =>
  bars.reduce((sum, b) => {
    if (durationType === "time") return sum + b.time
    if (b.type === "interval") return sum + b.repeat * (b.onDuration + b.offDuration)
    return sum + b.time
  }, 0)

export const getWorkoutDistance = (bars: (Bar | Trapeze | Interval)[]): number =>
  bars.reduce((d, b) => d + b.length, 0) / 1000

export const getWorkoutPace = (bars: WorkoutBar[], durationType: DurationType, paceUnitType: PaceUnitType): string => {
  // TODO: clean up WorkoutBar vs (Bar|Trapeze|Interval) mess
  const paced = bars.filter(b => b.type !== "freeRide") as (Bar | Trapeze | Interval)[]
  const length = getWorkoutLength(paced, durationType)
  const distance = getWorkoutDistance(paced)
  return distance > 0 ? speedToPace(distance / (length / 3600), paceUnitType) : ""
}

export const getStressScore = (bars: WorkoutBar[], ftp: number): number => {
  const tss = bars.reduce((sum, b) => {
    if (b.type === "bar") {
      const iff = b.power, np = iff * ftp
      return sum + b.time * np * iff
    }
    if (b.type === "trapeze") {
      const avg = (b.startPower + b.endPower) / 2, np = avg * ftp
      return sum + b.time * np * avg
    }
    if (b.type === "interval") {
      const npOn = b.onPower * ftp, npOff = b.offPower * ftp
      return sum +
        b.repeat * (b.onDuration * npOn * b.onPower +
          b.offDuration * npOff * b.offPower)
    }
    return sum
  }, 0)
  return safeDiv(tss, ftp * 3600) * 100
}

export const calculateEstimatedTimes = (
  distances: number[],
  times: (string | null | undefined)[]
): (string | undefined)[] => {
  const toSec = (t: string) => {
    const [h = 0, m = 0, s = 0] = t.split(":").map(Number)
    return h * 3600 + m * 60 + s
  }
  const toHMS = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(":")
  }
  return times.map((val, i) => {
    if (val) return val
    for (let j = 0; j < times.length; j++) {
      if (times[j]) {
        const base = toSec(times[j]!)
        const est = base * (distances[i] / distances[j]) * 1.06
        return toHMS(est)
      }
    }
    return undefined
  })
}

export const speedToPace = (speedKph: number, unit: PaceUnitType): string => {
  if (!Number.isFinite(speedKph) || speedKph <= 0) return "00:00"
  const sec = unit === "metric" ? 3600 / speedKph : 1.60934 * 3600 / speedKph
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export const paceToSpeed = (pace: string, unit: PaceUnitType): number => {
  const [m = 0, s = 0] = pace.split(":").map(Number)
  const totalSec = m * 60 + s
  if (totalSec === 0) return 0
  return unit === "metric" ? 3600 / totalSec : 1.60934 * 3600 / totalSec
}

export const useWorkoutMetrics = (
  bars: WorkoutBar[],
  ftp: number,
  durationType: DurationType,
  paceUnitType: PaceUnitType
) => {
  const paced = bars.filter(b => b.type !== "freeRide") as (Bar | Trapeze | Interval)[]
  const length = getWorkoutLength(paced, durationType)
  const distance = getWorkoutDistance(paced)
  const kph = safeDiv(distance, length / 3600)
  const pace = speedToPace(kph, paceUnitType)
  const tss = getStressScore(bars, ftp)
  return { length, distance, kph, pace, tss }
}

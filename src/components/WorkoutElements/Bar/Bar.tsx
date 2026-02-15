import { useMemo, useRef, useState } from "react";
import { Resizable } from "re-resizable";

import { calculateDistance, calculateSpeed, calculateTime, round } from "@/domain/workout/metrics";
import type { DurationType, PaceUnitType, SportType, SteadySegment } from "@/domain/workout/types";
import { Colors, Zones } from "@/domain/workout/zones";
import Label from "@/components/Label/Label";
import { formatTime } from "@/utils/time";

const Bar = (props: {
  id: string;
  time?: number;
  length?: number;
  power: number;
  cadence: number;
  ftp: number;
  weight: number;
  pace: number;
  sportType: SportType;
  durationType: DurationType;
  speed?: number;
  powerScale: number;
  maxEditablePower: number;
  onVerticalResizeStart?: () => void;
  onVerticalResizeEnd?: () => void;
  onChange: (id: string, value: SteadySegment) => void;
  onClick: (id: string) => void;
  selected: boolean;
  showLabel: boolean;
  paceUnitType?: PaceUnitType;
}) => {
  const multiplier = props.powerScale;
  const timeMultiplier = 3;
  const lengthMultiplier = 10;
  const absolutePowerCap = 2500 / Math.max(props.ftp, 1);
  const cappedEditablePower = Math.max(Zones.Z1.min, Math.min(props.maxEditablePower, absolutePowerCap));
  const displayedWidth = useMemo(
    () => (props.durationType === "time" ? (props.time || 0) / timeMultiplier : (props.length || 0) / lengthMultiplier),
    [props.durationType, props.time, props.length],
  );
  const displayedHeight = props.power * multiplier;
  const resizeBaseRef = useRef({ width: displayedWidth, height: displayedHeight });

  const powerLabel = Math.round(props.power * props.ftp);

  // TIME
  const duration = formatTime(props.time || 0);

  // DISTANCE
  const distance = props.length;

  // USED ONLY ON RUN WORKOUT
  // const distance = props.length

  // time is set -> calculate distance
  // distance is set -> calculate time

  const style = zwiftStyle(props.power);

  const [showLabel, setShowLabel] = useState(false);

  const speed = distance !== undefined && props.time !== undefined ? calculateSpeed(distance, props.time) : 0;

  const getResizedValues = (dWidth: number, dHeight: number) => {
    const safeSpeed = props.speed ?? 0;
    const nextWidth = Math.max(3, resizeBaseRef.current.width + dWidth);
    const nextHeight = Math.max(
      multiplier * Zones.Z1.min,
      Math.min(multiplier * cappedEditablePower, resizeBaseRef.current.height + dHeight),
    );
    const nextPower = Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight / multiplier));

    const nextLength =
      props.durationType === "time"
        ? round(calculateDistance(nextWidth * timeMultiplier * nextPower, safeSpeed), 1)
        : round(nextWidth * lengthMultiplier, 200);
    const nextTime =
      props.durationType === "time"
        ? round(nextWidth * timeMultiplier, 5)
        : round((calculateTime(nextLength, safeSpeed) * 1) / nextPower, 1);

    return {
      time: nextTime,
      length: nextLength,
      power: nextPower,
    };
  };

  const handleOnChange = (dWidth: number, dHeight: number) => {
    const { time, length, power } = getResizedValues(dWidth, dHeight);
    props.onChange(props.id, {
      time,
      length,
      power,
      cadence: props.cadence,
      type: "bar",
      pace: props.pace,
      id: props.id,
    });
  };

  const handleCadenceChange = (cadence: number) => {
    props.onChange(props.id, {
      time: props.time ?? 0,
      length: props.length ?? 0,
      power: props.power,
      cadence: cadence,
      type: "bar",
      pace: props.pace,
      id: props.id,
    });
  };

  const handleResizeStop = (dWidth: number, dHeight: number) => {
    handleOnChange(dWidth, dHeight);
    props.onVerticalResizeEnd?.();
  };

  const handleResize = (dWidth: number, dHeight: number) => {
    handleOnChange(dWidth, dHeight);
  };

  function zwiftStyle(zone: number) {
    if (zone >= 0 && zone < Zones.Z1.max) {
      // Z1 gray
      return { backgroundColor: Colors.GRAY };
    }
    if (zone >= Zones.Z2.min && zone < Zones.Z2.max) {
      // Z2 blue
      return { backgroundColor: Colors.BLUE };
    }
    if (zone >= Zones.Z3.min && zone < Zones.Z3.max) {
      // Z3 green
      return { backgroundColor: Colors.GREEN };
    }
    if (zone >= Zones.Z4.min && zone < Zones.Z4.max) {
      // Z4 yellow
      return { backgroundColor: Colors.YELLOW };
    }
    if (zone >= Zones.Z5.min && zone < Zones.Z5.max) {
      // Z5 orange
      return { backgroundColor: Colors.ORANGE };
    }
    // Z6 red
    return { backgroundColor: Colors.RED };
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onClick={() => props.onClick(props.id)}
      style={props.selected ? { zIndex: 10 } : undefined}
    >
      {(props.selected || showLabel) && props.showLabel && (
        <Label
          sportType={props.sportType}
          duration={duration}
          paceUnitType={props.paceUnitType}
          power={powerLabel}
          weight={props.weight}
          ftp={props.ftp}
          pace={props.pace}
          distance={distance}
          cadence={props.cadence}
          setCadence={(cadence: number) => handleCadenceChange(cadence)}
          speed={speed}
        />
      )}
      <Resizable
        className="rounded-[10px] border border-white"
        size={{
          width: displayedWidth,
          height: displayedHeight,
        }}
        minWidth={3}
        minHeight={multiplier * Zones.Z1.min}
        maxHeight={multiplier * cappedEditablePower}
        enable={{ top: true, right: true }}
        grid={[1, 1]}
        onResizeStart={(_event, direction) => {
          resizeBaseRef.current = { width: displayedWidth, height: displayedHeight };
          if (direction.includes("top")) {
            props.onVerticalResizeStart?.();
          }
        }}
        onResizeStop={(_e, _direction, _ref, d) => handleResizeStop(d.width, d.height)}
        onResize={(_e, _direction, _ref, d) => handleResize(d.width, d.height)}
        style={style}
      ></Resizable>
    </div>
  );
};

export default Bar;

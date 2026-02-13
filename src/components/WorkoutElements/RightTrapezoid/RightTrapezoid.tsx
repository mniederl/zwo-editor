import { useEffect, useRef, useState } from "react";
import { Resizable } from "re-resizable";

import { Colors, Zones, ZonesArray } from "@/components/constants";
import type { BarType, DurationType, PaceUnitType, SportType } from "@/components/Editor/editorTypes";
import { calculateDistance, calculateTime, round } from "@/components/helpers";
import Label from "@/components/Label/Label";
import { formatTime } from "@/utils/time";

import "./RightTrapezoid.css";

interface IDictionary {
  [index: string]: number;
}

const RightTrapezoid = (props: {
  id: string;
  time?: number;
  length?: number;
  startPower: number;
  endPower: number;
  cadence: number;
  ftp: number;
  pace: number;
  sportType: SportType;
  durationType: DurationType;
  speed?: number;
  powerScale: number;
  maxEditablePower: number;
  onVerticalResizeStart?: () => void;
  onVerticalResizeEnd?: () => void;
  onChange: (id: string, value: BarType) => void;
  onClick: (id: string) => void;
  selected: boolean;
  paceUnitType?: PaceUnitType;
}) => {
  const multiplier = props.powerScale;
  const timeMultiplier = 3;
  const lengthMultiplier = 10;
  const absolutePowerCap = 2500 / Math.max(props.ftp, 1);
  const cappedEditablePower = Math.max(Zones.Z1.min, Math.min(props.maxEditablePower, absolutePowerCap));

  const powerLabelStart = Math.round(props.startPower * props.ftp);
  const powerLabelEnd = Math.round(props.endPower * props.ftp);

  const avgPower = Math.abs((props.endPower + props.startPower) / 2);

  const durationLabel = formatTime(props.time || 0);

  const [showLabel, setShowLabel] = useState(false);

  const handleCadenceChange = (cadence: number) => {
    props.onChange(props.id, {
      time: props.time,
      length: props.length,
      startPower: props.startPower,
      endPower: props.endPower,
      cadence: cadence,
      type: "trapeze",
      pace: props.pace,
      id: props.id,
    });
  };

  // RUN WORKOUTS ON DISTANCE - BIKE WORKOUTS ON TIME
  const [width, setWidth] = useState(
    props.durationType === "time"
      ? Math.round((props.time || 0) / timeMultiplier / 3)
      : (props.length || 0) / lengthMultiplier / 3,
  );

  const speedStart = props.startPower * (props.speed || 0) * 3.6;

  const speedEnd = props.endPower * (props.speed || 0) * 3.6;

  const [height1, setHeight1] = useState(props.startPower * multiplier);
  const [height2, setHeight2] = useState(((props.endPower + props.startPower) * multiplier) / 2);
  const [height3, setHeight3] = useState(props.endPower * multiplier);
  const resizeBaseRef = useRef({ width, height1, height3 });

  useEffect(() => {
    setHeight1(props.startPower * multiplier);
    setHeight3(props.endPower * multiplier);
    setHeight2(((props.endPower + props.startPower) * multiplier) / 2);
  }, [props.startPower, props.endPower, multiplier]);

  const trapezeHeight = height3 > height1 ? height3 : height1;
  const trapezeTop = height3 > height1 ? height3 - height1 : height1 - height3;
  const trapezeClipPath =
    height3 > height1
      ? `polygon(0px ${trapezeTop}px, 0px ${trapezeHeight}px, ${width * 3}px ${trapezeHeight}px, ${width * 3}px 0px)`
      : `polygon(0px 0px, 0px ${trapezeHeight}px, ${width * 3}px ${trapezeHeight}px, ${width * 3}px ${trapezeTop}px)`;

  const bars =
    height3 > height1
      ? calculateColors(props.startPower, props.endPower)
      : calculateColors(props.endPower, props.startPower);
  const flexDirection = height3 > height1 ? "row" : "row-reverse";

  const captureResizeBase = () => {
    resizeBaseRef.current = { width, height1, height3 };
    props.onVerticalResizeStart?.();
  };

  const updateShape = (nextWidth: number, nextHeight1: number, nextHeight3: number) => {
    setWidth(nextWidth);
    setHeight1(nextHeight1);
    setHeight3(nextHeight3);
    setHeight2((nextHeight1 + nextHeight3) / 2);
  };

  const handleResize1 = (dHeight: number) => {
    const nextWidth = resizeBaseRef.current.width;
    const nextHeight1 = resizeBaseRef.current.height1 + dHeight;
    const nextHeight3 = resizeBaseRef.current.height3;
    updateShape(nextWidth, nextHeight1, nextHeight3);

    const time =
      props.durationType === "time"
        ? round(nextWidth * timeMultiplier * 3, 5)
        : round((calculateTime(props.length, props.speed) * 1) / avgPower, 1);
    const length =
      props.durationType === "time"
        ? round((calculateDistance(nextWidth * timeMultiplier, props.speed) * 1) / avgPower, 1)
        : round(nextWidth * lengthMultiplier * 3, 200);

    props.onChange(props.id, {
      time: time,
      length: length,
      startPower: Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight1 / multiplier)),
      endPower: Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight3 / multiplier)),
      cadence: props.cadence,
      type: "trapeze",
      pace: props.pace,
      id: props.id,
    });
  };

  const handleResize2 = (dHeight: number) => {
    const nextWidth = resizeBaseRef.current.width;
    const nextHeight1 = resizeBaseRef.current.height1 + dHeight;
    const nextHeight3 = resizeBaseRef.current.height3 + dHeight;
    updateShape(nextWidth, nextHeight1, nextHeight3);

    const time =
      props.durationType === "time"
        ? round(nextWidth * timeMultiplier * 3, 5)
        : round((calculateTime(props.length, props.speed) * 1) / avgPower, 1);
    const length =
      props.durationType === "time"
        ? round((calculateDistance(nextWidth * timeMultiplier, props.speed) * 1) / avgPower, 1)
        : round(nextWidth * lengthMultiplier * 3, 200);

    props.onChange(props.id, {
      time: time,
      length: length,
      startPower: Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight1 / multiplier)),
      endPower: Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight3 / multiplier)),
      cadence: props.cadence,
      type: "trapeze",
      pace: props.pace,
      id: props.id,
    });
  };

  const handleResize3 = (dWidth: number, dHeight: number) => {
    const nextWidth = resizeBaseRef.current.width + dWidth / 3;
    const nextHeight1 = resizeBaseRef.current.height1;
    const nextHeight3 = resizeBaseRef.current.height3 + dHeight;
    updateShape(nextWidth, nextHeight1, nextHeight3);

    const length =
      props.durationType === "time"
        ? round((calculateDistance(nextWidth * timeMultiplier * 3, props.speed) * 1) / avgPower, 1)
        : round(nextWidth * lengthMultiplier * 3, 200);
    const time =
      props.durationType === "time"
        ? round(nextWidth * timeMultiplier * 3, 5)
        : round((calculateTime(props.length, props.speed) * 1) / avgPower, 1);

    props.onChange(props.id, {
      time: time,
      length: length,
      startPower: Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight1 / multiplier)),
      endPower: Math.max(Zones.Z1.min, Math.min(cappedEditablePower, nextHeight3 / multiplier)),
      cadence: props.cadence,
      type: "trapeze",
      pace: props.pace,
      id: props.id,
    });
  };

  function calculateColors(start: number, end: number) {
    const bars = {} as IDictionary;

    ZonesArray.forEach((zone, index) => {
      if (start >= zone[0] && start < zone[1]) {
        bars[`Z${index + 1}`] = zone[1] - start;
      } else if (end >= zone[0] && end < zone[1]) {
        bars[`Z${index + 1}`] = end - zone[0];
      } else if (end >= zone[1] && start < zone[0]) {
        bars[`Z${index + 1}`] = zone[1] - zone[0];
      } else {
        bars[`Z${index + 1}`] = 0;
      }
    });
    return bars;
  }

  function zwiftStyle(zone: number) {
    if (zone >= 0 && zone < Zones.Z1.max) {
      // Z1 gray
      return Colors.GRAY;
    }
    if (zone >= Zones.Z2.min && zone < Zones.Z2.max) {
      // Z2 blue
      return Colors.BLUE;
    }
    if (zone >= Zones.Z3.min && zone < Zones.Z3.max) {
      // Z3 green
      return Colors.GREEN;
    }
    if (zone >= Zones.Z4.min && zone < Zones.Z4.max) {
      // Z4 yellow
      return Colors.YELLOW;
    }
    if (zone >= Zones.Z5.min && zone < Zones.Z5.max) {
      // Z5 orange
      return Colors.ORANGE;
    }
    // Z6 red
    return Colors.RED;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      style={props.selected ? { zIndex: 1 } : {}}
      onClick={() => props.onClick(props.id)}
    >
      {(props.selected || showLabel) && (
        <Label
          duration={durationLabel}
          powerStart={powerLabelStart}
          powerEnd={powerLabelEnd}
          ftp={props.ftp}
          sportType={props.sportType}
          pace={props.pace}
          distance={props.length}
          cadence={props.cadence}
          setCadence={(cadence: number) => handleCadenceChange(cadence)}
          speedStart={speedStart}
          speedEnd={speedEnd}
          paceUnitType={props.paceUnitType}
        />
      )}
      <div
        className="trapeze"
        onClick={() => props.onClick(props.id)}
        style={{ width: width * 3, height: trapezeHeight }}
      >
        <Resizable
          className="trapeze-component"
          size={{
            width: width,
            height: height1,
          }}
          minWidth={3}
          minHeight={multiplier * Zones.Z1.min}
          maxHeight={multiplier * cappedEditablePower}
          enable={{ top: true, right: true }}
          grid={[1, 1]}
          onResizeStart={captureResizeBase}
          onResize={(_e, _direction, _ref, d) => handleResize1(d.height)}
          onResizeStop={() => props.onVerticalResizeEnd?.()}
        ></Resizable>
        <Resizable
          className="trapeze-component"
          size={{
            width: width,
            height: height2,
          }}
          minWidth={3}
          minHeight={multiplier * Zones.Z1.min}
          maxHeight={multiplier * cappedEditablePower}
          enable={{ top: true }}
          grid={[1, 1]}
          onResizeStart={captureResizeBase}
          onResize={(_e, _direction, _ref, d) => handleResize2(d.height)}
          onResizeStop={() => props.onVerticalResizeEnd?.()}
        ></Resizable>
        <Resizable
          className="trapeze-component"
          size={{
            width: width,
            height: height3,
          }}
          minWidth={3}
          minHeight={multiplier * Zones.Z1.min}
          maxHeight={multiplier * cappedEditablePower}
          enable={{ top: true, right: true }}
          grid={[1, 1]}
          onResizeStart={captureResizeBase}
          onResize={(_e, _direction, _ref, d) => handleResize3(d.width, d.height)}
          onResizeStop={() => props.onVerticalResizeEnd?.()}
        ></Resizable>
      </div>
      <div
        className="trapeze-colors"
        style={{
          height: trapezeHeight,
          width: width * 3,
          flexDirection: flexDirection,
          backgroundColor: zwiftStyle(props.startPower),
          clipPath: trapezeClipPath,
          WebkitClipPath: trapezeClipPath,
        }}
      >
        <div
          className="color"
          style={{
            backgroundColor: Colors.GRAY,
            width: `${(bars.Z1 * 100) / Math.abs(props.endPower - props.startPower)}%`,
          }}
        ></div>
        <div
          className="color"
          style={{
            backgroundColor: Colors.BLUE,
            width: `${(bars.Z2 * 100) / Math.abs(props.endPower - props.startPower)}%`,
          }}
        ></div>
        <div
          className="color"
          style={{
            backgroundColor: Colors.GREEN,
            width: `${(bars.Z3 * 100) / Math.abs(props.endPower - props.startPower)}%`,
          }}
        ></div>
        <div
          className="color"
          style={{
            backgroundColor: Colors.YELLOW,
            width: `${(bars.Z4 * 100) / Math.abs(props.endPower - props.startPower)}%`,
          }}
        ></div>
        <div
          className="color"
          style={{
            backgroundColor: Colors.ORANGE,
            width: `${(bars.Z5 * 100) / Math.abs(props.endPower - props.startPower)}%`,
          }}
        ></div>
        <div
          className="color"
          style={{
            backgroundColor: Colors.RED,
            width: `${(bars.Z6 * 100) / Math.abs(props.endPower - props.startPower)}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default RightTrapezoid;

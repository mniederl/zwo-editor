import { useState } from "react";
import { Resizable } from "re-resizable";

import type { DurationType, FreeRideSegment, SportType } from "@/components/Editor/editorTypes";
import { round } from "@/components/helpers";
import Label from "@/components/Label/Label";
import { formatTime } from "@/utils/time";

import "./FreeRide.css";

const FreeRide = (props: {
  id: string;
  time?: number;
  length?: number;
  cadence: number;
  sportType: SportType;
  durationType: DurationType;
  onChange: (id: string, value: FreeRideSegment) => void;
  onClick: (id: string) => void;
  selected: boolean;
}) => {
  const timeMultiplier = 3;
  const lengthMultiplier = 10;

  const durationLabel: string = formatTime(props.time!);

  // RUN WORKOUTS ON DISTANCE - BIKE WORKOUTS ON TIME
  const [width, setWidth] = useState(
    props.durationType === "time" ? (props.time || 0) / timeMultiplier : (props.length || 0) / lengthMultiplier,
  );

  // DISTANCE
  const distance = props.length;

  const [showLabel, setShowLabel] = useState(false);

  const handleCadenceChange = (cadence: number) => {
    props.onChange(props.id, {
      time: props.time ?? 0,
      length: props.length ?? 0,
      type: "freeRide",
      cadence: cadence,
      id: props.id,
    });
  };

  // standard height
  const height = 100;

  const handleResizeStop = (dWidth: number) => {
    setWidth(width + dWidth);

    const length = props.durationType === "time" ? 0 : round((width + dWidth) * lengthMultiplier, 200);
    const time = props.durationType === "time" ? round((width + dWidth) * timeMultiplier, 5) : 0;

    props.onChange(props.id, {
      time: time,
      length: length,
      type: "freeRide",
      cadence: props.cadence,
      id: props.id,
    });
  };

  const handleResize = (dWidth: number) => {
    const length = props.durationType === "time" ? 0 : round((width + dWidth) * lengthMultiplier, 200);
    const time = props.durationType === "time" ? round((width + dWidth) * timeMultiplier, 5) : 0;

    props.onChange(props.id, {
      time: time,
      length: length,
      type: "freeRide",
      cadence: props.cadence,
      id: props.id,
    });
  };

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
          sportType={props.sportType}
          duration={durationLabel}
          distance={distance}
          cadence={props.cadence}
          setCadence={(cadence: number) => handleCadenceChange(cadence)}
        />
      )}
      <Resizable
        className="freeRide"
        size={{
          width:
            props.durationType === "time" ? (props.time || 0) / timeMultiplier : (props.length || 0) / lengthMultiplier,
          height: height,
        }}
        minWidth={timeMultiplier}
        minHeight={height}
        maxHeight={height}
        enable={{ right: true }}
        grid={[1, 1]}
        onResizeStop={(e, direction, ref, d) => handleResizeStop(d.width)}
        onResize={(e, direction, ref, d) => handleResize(d.width)}
      ></Resizable>
    </div>
  );
};

export default FreeRide;

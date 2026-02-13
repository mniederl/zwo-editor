import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock3, Ruler, Zap } from "lucide-react";

import type { PaceUnitType } from "../Editor/editorTypes";
import { speedToPace } from "../helpers";

import "./Label.css";

const Label = (props: {
  sportType: string;
  duration: string;
  distance?: number;
  power?: number;
  powerStart?: number;
  powerEnd?: number;
  weight?: number;
  ftp?: number;
  pace?: number;
  cadence?: number;
  setCadence?: (cadence: number) => void;
  speed?: number;
  speedStart?: number;
  speedEnd?: number;
  paceUnitType?: PaceUnitType;
}) => {
  const paces = ["1M", "5K", "10K", "HM", "M"];
  const labelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: -112, left: 0 });

  const updatePosition = useCallback(() => {
    const labelElement = labelRef.current;
    const anchorElement = labelElement?.parentElement;
    const shellElement = anchorElement?.closest(".editor-shell");

    if (!labelElement || !anchorElement || !shellElement) {
      return;
    }

    const labelRect = labelElement.getBoundingClientRect();
    const anchorRect = anchorElement.getBoundingClientRect();
    const shellRect = shellElement.getBoundingClientRect();
    const edgePadding = 6;
    const topSafeOffset = 18;
    const gap = 8;

    const desiredLeft = (anchorRect.width - labelRect.width) / 2;
    const minLeft = shellRect.left - anchorRect.left + edgePadding;
    const maxLeft = shellRect.right - anchorRect.left - labelRect.width - edgePadding;
    const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));

    const topAbove = -labelRect.height - gap;
    const preferredTop = topAbove;
    const minTop = shellRect.top - anchorRect.top + edgePadding + topSafeOffset;
    const maxTop = shellRect.bottom - anchorRect.top - labelRect.height - edgePadding;
    const top = Math.max(minTop, Math.min(maxTop, preferredTop));

    setPosition((current) => {
      if (Math.abs(current.top - top) <= 0.5 && Math.abs(current.left - left) <= 0.5) {
        return current;
      }

      return { top, left };
    });
  }, []);

  useLayoutEffect(() => {
    updatePosition();
  });

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition]);

  return (
    <div
      ref={labelRef}
      className="label"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {props.duration && props.duration !== "00:00" && (
        <div>
          <Clock3 className="mr-1 inline-block h-4 w-4 align-text-bottom" /> {props.duration}
        </div>
      )}
      {props.power && props.sportType === "bike" && (
        <div>
          <Zap className="mr-1 inline-block h-4 w-4 align-text-bottom" /> {props.power}W
        </div>
      )}
      {props.powerStart && props.powerEnd && props.sportType === "bike" && (
        <div>
          <Zap className="mr-1 inline-block h-4 w-4 align-text-bottom" /> {props.powerStart}W - {props.powerEnd}W
        </div>
      )}
      {props.weight && props.power && props.ftp && props.sportType === "bike" && (
        <div>
          {(props.power / props.weight).toFixed(1)}W/Kg &middot; {((props.power / props.ftp) * 100).toFixed(0)}% FTP
        </div>
      )}
      {props.powerStart && props.powerEnd && props.ftp && props.sportType === "bike" && (
        <div>
          {((props.powerStart / props.ftp) * 100).toFixed(0)}% FTP - {((props.powerEnd / props.ftp) * 100).toFixed(0)}%
          FTP
        </div>
      )}
      {props.sportType === "run" && props.distance !== undefined && props.distance !== 0 && (
        <div>
          <Ruler className="mr-1 inline-block h-4 w-4 align-text-bottom" /> {props.distance.toFixed(0)} m
        </div>
      )}
      {props.power && props.ftp && props.pace !== null && props.sportType === "run" && (
        <div>
          {((props.power / props.ftp) * 100).toFixed(1).replace(/[.]0$/, "")}% {paces[props.pace || 0]} pace
        </div>
      )}
      {props.powerStart && props.powerEnd && props.ftp && props.pace !== null && props.sportType === "run" && (
        <div>
          {((props.powerStart / props.ftp) * 100).toFixed(0)}% to {((props.powerEnd / props.ftp) * 100).toFixed(0)}%{" "}
          {paces[props.pace || 0]} pace
        </div>
      )}
      {props.sportType === "bike" && (
        <div className="cadence-row">
          <label className="cadenceLabel">Cadence</label>
          <input
            type="number"
            min="40"
            max="150"
            step="5"
            name="cadence"
            value={props.cadence || ""}
            onChange={(e) => {
              if (props.setCadence) props.setCadence(parseInt(e.target.value));
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="textField cadence"
          />
        </div>
      )}
      {props.sportType === "run" && props.speed && props.paceUnitType && (
        <div>
          <div>{props.speed?.toFixed(1)} km/h</div>
          <div>
            {speedToPace(props.speed, props.paceUnitType)} {props.paceUnitType === "metric" ? "min/km" : "min/mi"}
          </div>
        </div>
      )}
      {props.sportType === "run" && props.speedStart && props.speedEnd && (
        <div>
          <div>
            {props.speedStart?.toFixed(1)} km/h - {props.speedEnd?.toFixed(1)} km/h
          </div>
          <div>
            {speedToPace(props.speedStart, props.paceUnitType)} - {speedToPace(props.speedEnd, props.paceUnitType)}{" "}
            {props.paceUnitType === "metric" ? "min/km" : "min/mi"}
          </div>
        </div>
      )}
    </div>
  );
};

export default Label;

import { useEffect, useRef, useState } from "react";
import { MessageCircle, MessageCircleMore } from "lucide-react";
import Draggable from "react-draggable";

import type { Instruction } from "@/components/Editor/editorTypes";
import { formatTime } from "@/utils/time";

const Comment = (props: {
  instruction: Instruction;
  durationType: string;
  width: number;
  onChange: (id: string, instruction: Instruction) => void;
  onClick: (id: string) => void;
  index: number;
}) => {
  const timeMultiplier = 3;
  const lengthMultiplier = 10;

  const initialX =
    props.durationType === "time"
      ? props.instruction.time / timeMultiplier
      : props.instruction.length / lengthMultiplier;
  const [x, setX] = useState(initialX);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const didDragRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setX(
        props.durationType === "time"
          ? props.instruction.time / timeMultiplier
          : props.instruction.length / lengthMultiplier,
      );
    }
  }, [props.durationType, props.instruction.time, props.instruction.length, isDragging]);

  function handleStop(position: number) {
    const clampedPosition = Math.max(0, Math.min(position, props.width));
    setIsDragging(false);
    setX(clampedPosition);

    if (didDragRef.current) {
      didDragRef.current = false;
      props.onChange(props.instruction.id, {
        id: props.instruction.id,
        time: clampedPosition * timeMultiplier,
        length: clampedPosition * lengthMultiplier,
        text: props.instruction.text,
      });
    } else {
      props.onClick(props.instruction.id);
    }
  }

  function handleDragging(position: number) {
    didDragRef.current = true;
    setIsDragging(true);
    setX(position);
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      axis="x"
      handle=".handle"
      position={{ x, y: (props.index % 5) * 20 }}
      bounds={{ left: 0, right: props.width }}
      scale={1}
      onStart={() => {
        didDragRef.current = false;
      }}
      onStop={(_e, data) => handleStop(data.x)}
      onDrag={(_e, data) => handleDragging(data.x)}
    >
      <div
        ref={nodeRef}
        className="absolute"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {props.instruction.text !== "" ? (
          <MessageCircleMore style={{ display: "block", opacity: 0.7 }} className="handle h-5 w-5" />
        ) : (
          <MessageCircle style={{ display: "block", opacity: 0.7 }} className="handle h-5 w-5" />
        )}
        {(isDragging || isHovering) && (
          <div className="inline-block bg-white p-1.25">
            {props.durationType === "time" ? (
              <span style={{ fontSize: "13px" }} data-testid="time">
                {formatTime(x * timeMultiplier)}
              </span>
            ) : (
              <span style={{ fontSize: "13px" }} data-testid="time">
                {x * lengthMultiplier} m
              </span>
            )}
          </div>
        )}
        <div className="absolute left-0 right-0 top-7.5 z-0 h-[90vh] w-px border-l border-l-dotted border-l-gray-500"></div>
      </div>
    </Draggable>
  );
};

export default Comment;

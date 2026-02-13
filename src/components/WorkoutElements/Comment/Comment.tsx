import { useRef, useState } from "react";
import { faComment, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

  const [time, setTime] = useState(props.instruction.time / timeMultiplier);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // FOR RUN WORKOUTS
  const [length, setLength] = useState(props.instruction.length / lengthMultiplier);

  function handleTouch(position: number) {
    setIsDragging(false);

    if (isDragging) {
      props.onChange(props.instruction.id, {
        id: props.instruction.id,
        time: position * timeMultiplier,
        length: position * lengthMultiplier,
        text: props.instruction.text,
      });
    } else {
      props.onClick(props.instruction.id);
    }
  }

  function handleDragging(position: number) {
    setIsDragging(true);
    setTime(position);
    setLength(position);
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      axis="x"
      handle=".handle"
      defaultPosition={{ x: props.durationType === "time" ? time : length, y: (props.index % 5) * 20 }}
      bounds={{ left: 0, right: props.width }}
      scale={1}
      onStop={(_e, data) => handleTouch(data.x)}
      onDrag={(_e, data) => handleDragging(data.x)}
    >
      <div ref={nodeRef} className="absolute">
        <FontAwesomeIcon
          style={{ display: "block", opacity: 0.7 }}
          icon={props.instruction.text !== "" ? faCommentDots : faComment}
          size="lg"
          className="handle"
        />
        {isDragging && (
          <div className="inline-block bg-white p-[5px]">
            {props.durationType === "time" ? (
              <span style={{ fontSize: "13px" }} data-testid="time">
                {formatTime(time * timeMultiplier)}
              </span>
            ) : (
              <span style={{ fontSize: "13px" }} data-testid="time">
                {length * lengthMultiplier} m
              </span>
            )}
          </div>
        )}
        <div className="absolute left-0 right-0 top-[30px] z-0 h-[90vh] w-px border-l border-l-dotted border-l-gray-500"></div>
      </div>
    </Draggable>
  );
};

export default Comment;

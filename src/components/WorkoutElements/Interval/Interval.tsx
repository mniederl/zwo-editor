import { Minus, Plus } from "lucide-react";

import type { DurationType, IntervalSegment, SportType, SteadySegment } from "@/domain/workout/types";
import Bar from "../Bar/Bar";

const Interval = (props: {
  id: string;
  repeat: number;
  onDuration: number;
  offDuration: number;
  onLength: number;
  offLength: number;
  onPower: number;
  offPower: number;
  cadence: number;
  restingCadence: number;
  ftp: number;
  weight: number;
  pace: number;
  speed?: number;
  powerScale: number;
  maxEditablePower: number;
  onVerticalResizeStart?: () => void;
  onVerticalResizeEnd?: () => void;
  sportType: SportType;
  durationType: DurationType;
  handleIntervalChange: (id: string, value: IntervalSegment) => void;
  handleIntervalClick: (id: string) => void;
  selected: boolean;
}) => {
  const bars: SteadySegment[] = Array.from({ length: props.repeat * 2 }, (_, index) => {
    const isOnSegment = index % 2 === 0;
    return {
      id: `${props.id}-${index}`,
      type: "bar",
      pace: props.pace,
      time: isOnSegment ? props.onDuration : props.offDuration,
      length: isOnSegment ? props.onLength : props.offLength,
      power: isOnSegment ? props.onPower : props.offPower,
      cadence: isOnSegment ? props.cadence : props.restingCadence,
    };
  });

  function handleOnChange(index: number, values: SteadySegment) {
    const isOnSegment = index % 2 === 0;
    const onDuration = isOnSegment ? values.time : props.onDuration;
    const offDuration = isOnSegment ? props.offDuration : values.time;
    const onLength = isOnSegment ? values.length : props.onLength;
    const offLength = isOnSegment ? props.offLength : values.length;
    const onPower = isOnSegment ? values.power : props.onPower;
    const offPower = isOnSegment ? props.offPower : values.power;
    const cadence = isOnSegment ? values.cadence : props.cadence;
    const restingCadence = isOnSegment ? props.restingCadence : values.cadence;

    props.handleIntervalChange(props.id, {
      id: props.id,
      type: "interval",
      pace: props.pace,
      repeat: props.repeat,
      time: (onDuration + offDuration) * props.repeat,
      length: (onLength + offLength) * props.repeat,
      onDuration,
      offDuration,
      onPower,
      offPower,
      cadence,
      restingCadence,
      onLength,
      offLength,
    });
  }

  function handleAddInterval() {
    props.handleIntervalChange(props.id, {
      time: (props.onDuration + props.offDuration) * (props.repeat + 1),
      length: (props.onLength + props.offLength) * (props.repeat + 1),
      id: props.id,
      type: "interval",
      cadence: props.cadence,
      restingCadence: props.restingCadence,
      pace: props.pace,
      repeat: props.repeat + 1,
      onDuration: props.onDuration,
      offDuration: props.offDuration,
      onPower: props.onPower,
      offPower: props.offPower,
      onLength: props.onLength,
      offLength: props.offLength,
    });
  }

  function handleRemoveInterval() {
    if (props.repeat <= 1) return;
    props.handleIntervalChange(props.id, {
      time: (props.onDuration + props.offDuration) * (props.repeat - 1),
      length: (props.onLength + props.offLength) * (props.repeat - 1),
      id: props.id,
      type: "interval",
      cadence: props.cadence,
      restingCadence: props.restingCadence,
      pace: props.pace,
      repeat: props.repeat - 1,
      onDuration: props.onDuration,
      offDuration: props.offDuration,
      onPower: props.onPower,
      offPower: props.offPower,
      onLength: props.onLength,
      offLength: props.offLength,
    });
  }

  const renderBar = (bar: SteadySegment, index: number, withLabel: boolean) => (
    <Bar
      key={bar.id}
      id={bar.id}
      time={bar.time}
      length={bar.length}
      power={bar.power}
      cadence={bar.cadence}
      ftp={props.ftp}
      weight={props.weight}
      sportType={props.sportType}
      durationType={props.durationType}
      pace={props.pace}
      speed={props.speed}
      powerScale={props.powerScale}
      maxEditablePower={props.maxEditablePower}
      onVerticalResizeStart={props.onVerticalResizeStart}
      onVerticalResizeEnd={props.onVerticalResizeEnd}
      onChange={(_, values) => handleOnChange(index, values)}
      onClick={() => props.handleIntervalClick(props.id)}
      selected={props.selected}
      showLabel={withLabel}
    />
  );

  const renderButton = (title: string, Icon: typeof Plus, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-0.5 bg-[#00C46A] text-white hover:bg-[#009651] rounded-lg"
      // className="inline-flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-lg bg-[#00C46A] text-white hover:bg-[#009651]"
    >
      <Icon className="block h-4 w-4" />
    </button>
  );

  return (
    <div>
      <div className="absolute -mt-7.5 gap-1 flex-row flex">
        {renderButton("Add interval", Plus, handleAddInterval)}
        {renderButton("Remove interval", Minus, handleRemoveInterval)}
      </div>
      <div className="flex flex-row items-end">
        {bars.map((bar, index) => renderBar(bar, index, index === 0 || index === bars.length - 1))}
      </div>
    </div>
  );
};

export default Interval;

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

import type { BarType, DurationType, SportType } from "../../Editor/editorTypes";
import Bar from "../Bar/Bar";
import { genId } from "@/utils/id";

const Interval = (props: {
  id: string;
  repeat: number;
  onDuration?: number;
  offDuration?: number;
  onLength?: number;
  offLength?: number;
  onPower: number;
  offPower: number;
  cadence: number;
  restingCadence: number;
  ftp: number;
  weight: number;
  pace: number;
  speed?: number;
  sportType: SportType;
  durationType: DurationType;
  handleIntervalChange: (id: string, value: BarType) => void;
  handleIntervalClick: (id: string) => void;
  selected: boolean;
}) => {
  const [bars, setBars] = useState<Array<BarType>>([]);
  const [nIntervals, setNIntervals] = useState(props.repeat);

  const [onDuration, setOnDuration] = useState(props.onDuration);
  const [offDuration, setOffDuration] = useState(props.offDuration);

  const [onLength, setOnLength] = useState(props.onLength);
  const [offLength, setOffLength] = useState(props.offLength);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const bars = [];

    for (let i = 0; i < nIntervals; i++) {
      bars.push({
        time: onDuration || 0,
        length: onLength || 0,
        power: props.onPower,
        cadence: props.cadence,
        type: "bar",
        pace: props.pace,
        id: genId(),
      });

      bars.push({
        time: offDuration || 0,
        length: offLength || 0,
        power: props.offPower,
        cadence: props.restingCadence,
        type: "bar",
        pace: props.pace,
        id: genId(),
      });
    }
    setBars(bars);
  }, [nIntervals]);

  function handleOnChange(id: string, values: BarType) {
    const index = bars.findIndex((bar) => bar.id === id);

    if (index % 2 === 1) {
      setOffDuration(values.time);
      setOffLength(values.length);
    } else {
      setOnDuration(values.time);
      setOnLength(values.length);
    }

    for (let i = 0; i < bars.length; i++) {
      if (index % 2 === i % 2) {
        bars[i].time = values.time;
        bars[i].power = values.power;
        bars[i].length = values.length;
        bars[i].cadence = values.cadence;
      }
    }

    const time = bars.reduce((sum, bar) => sum + bar.time, 0);
    const length = bars.reduce((sum, bar) => sum + (bar.length || 0), 0); // TODO: check why length can be undefined

    props.handleIntervalChange(props.id, {
      time: time,
      length: length,
      id: props.id,
      type: "interval",
      cadence: bars[0].cadence,
      restingCadence: bars[1].cadence,
      pace: props.pace,
      repeat: nIntervals,
      onDuration: bars[0].time,
      offDuration: bars[1].time,
      onPower: bars[0].power,
      offPower: bars[1].power,
      onLength: bars[0].length,
      offLength: bars[1].length,
    });
  }

  function handleAddInterval() {
    setNIntervals(nIntervals + 1);
    props.handleIntervalChange(props.id, {
      time: ((props.onDuration || 0) + (props.offDuration || 0)) * (nIntervals + 1),
      length: ((props.onLength || 0) + (props.offLength || 0)) * (nIntervals + 1),
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
    if (nIntervals <= 1) return;

    setNIntervals(nIntervals - 1);
    props.handleIntervalChange(props.id, {
      time: ((props.onDuration || 0) + (props.offDuration || 0)) * (nIntervals - 1),
      length: ((props.onLength || 0) + (props.offLength || 0)) * (nIntervals - 1),
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

  const renderBar = (bar: BarType, withLabel: boolean) => (
    <Bar
      key={bar.id}
      id={bar.id}
      time={bar.time}
      length={bar.length}
      power={bar.power || 100}
      cadence={bar.cadence}
      ftp={props.ftp}
      weight={props.weight}
      sportType={props.sportType}
      durationType={props.durationType}
      pace={props.pace}
      speed={props.speed}
      onChange={handleOnChange}
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
        {bars.map((bar, index) => renderBar(bar, index === 0 || index === bars.length - 1))}
      </div>
    </div>
  );
};

export default Interval;

import type { LucideIcon } from "lucide-react";
import Switch from "react-switch";

import { cn } from "@/utils/cssUtils";

interface LeftRightToggleProps<TLeft, TRight> {
  label: string;
  leftValue: TLeft;
  rightValue: TRight;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  selected: TLeft | TRight;
  onChange: (selected: TLeft | TRight) => void;
}

const COLOR = "#00C46A";

const LeftRightToggle = <TLeft, TRight>({
  label,
  leftValue,
  rightValue,
  leftIcon,
  rightIcon,
  leftLabel,
  rightLabel,
  selected,
  onChange,
}: LeftRightToggleProps<TLeft, TRight>) => {
  const LeftIcon = leftIcon;
  const RightIcon = rightIcon;

  const isLeft = selected === leftValue;
  const isRight = selected === rightValue;

  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</label>
      <div className="flex items-center gap-2 text-slate-400">
        {LeftIcon && <LeftIcon className={cn("h-5 w-5", isLeft ? "text-emerald-600" : "text-slate-400")} />}
        {leftLabel && (
          <span className={cn("text-sm font-semibold", isLeft ? "text-emerald-600" : "text-slate-500")}>
            {leftLabel}
          </span>
        )}
        <Switch
          onChange={() => onChange(isLeft ? rightValue : leftValue)}
          checked={isRight}
          checkedIcon={false}
          uncheckedIcon={false}
          onColor={COLOR}
          offColor={COLOR}
          height={20}
          width={40}
          handleDiameter={16}
        />
        {RightIcon && <RightIcon className={cn("h-5 w-5", isRight ? "text-emerald-600" : "text-slate-400")} />}
        {rightLabel && (
          <span className={cn("text-sm font-semibold", isRight ? "text-emerald-600" : "text-slate-500")}>
            {rightLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default LeftRightToggle;

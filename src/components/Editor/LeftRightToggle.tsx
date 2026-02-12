import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Switch from "react-switch";

interface LeftRightToggleProps<TLeft, TRight> {
  label: string;
  leftValue: TLeft;
  rightValue: TRight;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: IconProp;
  rightIcon?: IconProp;
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
}: LeftRightToggleProps<TLeft, TRight>) => (
  <div className="flex flex-col">
    <label className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</label>
    <div className="flex items-center gap-2 text-slate-400">
      {leftIcon && (
        <FontAwesomeIcon
          className={selected === leftValue ? "text-emerald-600" : "text-slate-400"}
          icon={leftIcon}
          size="lg"
        />
      )}
      {leftLabel && (
        <span className={`text-sm font-semibold ${selected === leftValue ? "text-emerald-600" : "text-slate-500"}`}>
          {leftLabel}
        </span>
      )}
      <Switch
        onChange={() => onChange(selected === leftValue ? rightValue : leftValue)}
        checked={selected === rightValue}
        checkedIcon={false}
        uncheckedIcon={false}
        onColor={COLOR}
        offColor={COLOR}
        height={20}
        width={40}
        handleDiameter={16}
      />
      {rightIcon && (
        <FontAwesomeIcon
          className={selected === rightValue ? "text-emerald-600" : "text-slate-400"}
          icon={rightIcon}
          size="lg"
        />
      )}
      {rightLabel && (
        <span className={`text-sm font-semibold ${selected === rightValue ? "text-emerald-600" : "text-slate-500"}`}>
          {rightLabel}
        </span>
      )}
    </div>
  </div>
);

export default LeftRightToggle;

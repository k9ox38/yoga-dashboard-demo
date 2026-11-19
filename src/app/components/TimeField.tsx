import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";
import { fromMinutes, minuteOptions, toMinutes } from "../lib/time";

/*
 * In-app time picker. Native <input type="time"> in Safari is a bare text box with a blue
 * segment highlight and no list to choose from; this opens hour and minute columns instead,
 * matching the date field beside it.
 */

type Choice = { value: number; label: string; disabled: boolean };

const pad = (value: number) => String(value).padStart(2, "0");

function Column({ label, choices, selected, onPick, onCommit }: {
  label: string;
  choices: Choice[];
  selected: number;
  onPick: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabbable = choices.find((choice) => choice.value === selected && !choice.disabled)?.value ?? choices.find((choice) => !choice.disabled)?.value;

  // Open with the chosen value in the middle of its column.
  useLayoutEffect(() => {
    const list = listRef.current;
    const chosen = list?.querySelector<HTMLElement>("[aria-selected=true]");
    if (list && chosen) list.scrollTop = chosen.offsetTop - (list.clientHeight - chosen.offsetHeight) / 2;
  }, []);

  const onKeyDown = (event: KeyboardEvent, current: number) => {
    const enabled = choices.filter((choice) => !choice.disabled);
    const index = enabled.findIndex((choice) => choice.value === current);
    const next = {
      ArrowDown: enabled[Math.min(index + 1, enabled.length - 1)],
      ArrowUp: enabled[Math.max(index - 1, 0)],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    }[event.key];
    if (!next) return;
    event.preventDefault();
    onPick(next.value);
    listRef.current?.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div className="flex w-16 flex-col">
      <div className="pb-1.5 text-center text-xs text-stone-400">{label}</div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="relative h-56 overflow-y-auto overscroll-contain py-1 [mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-14px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {choices.map((choice) => {
          const isSelected = choice.value === selected;
          return (
            <button
              key={choice.value}
              type="button"
              role="option"
              data-value={choice.value}
              aria-selected={isSelected}
              disabled={choice.disabled}
              tabIndex={choice.value === tabbable ? 0 : -1}
              onClick={() => onCommit(choice.value)}
              onKeyDown={(event) => onKeyDown(event, choice.value)}
              className={cn(
                "my-px flex h-8 w-full items-center justify-center rounded-lg text-sm font-normal tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 pointer-coarse:h-10",
                isSelected ? "bg-emerald-600 font-medium text-white" : "text-stone-700 hover:bg-stone-100",
                choice.disabled && "cursor-not-allowed text-stone-300 hover:bg-transparent",
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimeField({
  value,
  onChange,
  ariaLabel,
  invalid,
  disabled,
  step = 5,
  after,
  durations = [],
  placeholder = "选择时间",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Minute interval offered in the list. */
  step?: number;
  /** Only times later than this can be chosen (an end time's start). */
  after?: string;
  /** Lengths in minutes offered as shortcuts, counted from `after`. */
  durations?: number[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const afterMinutes = after ? toMinutes(after) : null;
  const current = toMinutes(value) ?? (afterMinutes !== null ? Math.min(afterMinutes + 60, 23 * 60 + 55) : 9 * 60);
  const hour = Math.floor(current / 60);
  const minute = current % 60;
  const minutes = minuteOptions(step, minute);
  const lastMinute = minutes[minutes.length - 1];
  const isEarly = (total: number) => afterMinutes !== null && total <= afterMinutes;

  const hourChoices: Choice[] = Array.from({ length: 24 }, (_, h) => ({ value: h, label: pad(h), disabled: isEarly(h * 60 + lastMinute) }));
  const minuteChoices: Choice[] = minutes.map((m) => ({ value: m, label: pad(m), disabled: isEarly(hour * 60 + m) }));

  const pickHour = (h: number) => {
    // Keep the minute when it still works; otherwise take the first minute after `after`.
    const m = isEarly(h * 60 + minute) ? minutes.find((option) => !isEarly(h * 60 + option)) ?? minute : minute;
    onChange(fromMinutes(h * 60 + m));
  };
  const pickMinute = (m: number) => onChange(fromMinutes(hour * 60 + m));
  const length = afterMinutes !== null && toMinutes(value) !== null ? current - afterMinutes : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ? `${ariaLabel}${value ? `，${value}` : ""}` : undefined}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm font-normal tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 data-[state=open]:border-emerald-500 data-[state=open]:ring-2 data-[state=open]:ring-emerald-500/20",
            invalid ? "border-rose-300" : "border-stone-200 hover:border-stone-300",
            value ? "text-stone-800" : "text-stone-400",
            disabled && "cursor-default border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-100",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <Clock className="size-4 shrink-0 text-stone-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} collisionPadding={16} className="z-[70] w-auto rounded-xl border-stone-200 bg-white p-0 text-stone-900 shadow-xl">
        <div className="flex justify-center gap-2 px-3 pt-3 pb-2">
          <Column label="时" choices={hourChoices} selected={hour} onPick={pickHour} onCommit={pickHour} />
          <div aria-hidden className="flex items-center pt-5 text-sm text-stone-300">:</div>
          <Column label="分" choices={minuteChoices} selected={minute} onPick={pickMinute} onCommit={(m) => { pickMinute(m); setOpen(false); }} />
        </div>
        {afterMinutes !== null && durations.length > 0 && (
          <div className="border-t border-stone-100 px-3 pt-2.5 pb-3">
            <div className="pb-1.5 text-xs text-stone-400">课程时长</div>
            <div className="grid grid-cols-2 gap-1.5">
              {durations.map((d) => {
                const end = afterMinutes + d;
                const active = length === d;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={end > 23 * 60 + 59}
                    aria-pressed={active}
                    onClick={() => { onChange(fromMinutes(end)); setOpen(false); }}
                    className={cn(
                      "h-8 rounded-lg px-2 text-xs font-normal whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:h-10",
                      active ? "bg-emerald-50 font-medium text-emerald-700 ring-1 ring-emerald-200" : "bg-stone-50 text-stone-600 hover:bg-stone-100",
                    )}
                  >
                    {d} 分钟
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

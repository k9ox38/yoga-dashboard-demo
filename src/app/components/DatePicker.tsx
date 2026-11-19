import { useState } from "react";
import { DayPicker, type ClassNames, type DateRange } from "react-day-picker";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";
import { useIsMobile } from "./ui/use-mobile";
import { localDate, parseLocalDate } from "../lib/dates";
import {
  PAST_PRESETS,
  UPCOMING_PRESETS,
  completeRange,
  formatRange,
  pickRangeDay,
  presetRange,
  rangeLength,
  type DatePreset,
  type DateRangeValue,
} from "../lib/dateRange";

/*
 * In-app date pickers. Native <input type="date"> opens the OS calendar, which in Safari is a
 * dark, English, dd/mm/yyyy popup that ignores the page's language and theme.
 */

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const calendarProps = {
  weekStartsOn: 1 as const,
  formatters: {
    formatCaption: (month: Date) => `${month.getFullYear()} 年 ${month.getMonth() + 1} 月`,
    formatWeekdayName: (day: Date) => WEEKDAYS[day.getDay()],
  },
  labels: {
    labelPrevious: () => "上个月",
    labelNext: () => "下个月",
    labelWeekday: (day: Date) => `星期${WEEKDAYS[day.getDay()]}`,
    labelDay: (day: Date) => `${day.getFullYear()} 年 ${day.getMonth() + 1} 月 ${day.getDate()} 日`,
  },
  components: {
    IconLeft: () => <ChevronLeft className="size-4" />,
    IconRight: () => <ChevronRight className="size-4" />,
  },
};

const baseClassNames: Partial<ClassNames> = {
  vhidden: "sr-only",
  months: "flex flex-col gap-5 md:flex-row",
  month: "space-y-2",
  caption: "relative flex h-8 items-center justify-center",
  caption_label: "text-sm font-semibold text-stone-900",
  nav: "flex items-center",
  nav_button:
    "inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30",
  nav_button_previous: "absolute left-0",
  nav_button_next: "absolute right-0",
  table: "border-collapse",
  head_row: "flex",
  head_cell: "w-9 pb-1 text-center text-xs font-normal text-stone-400",
  row: "mt-0.5 flex",
  cell: "relative size-9 p-0 text-center",
  day: "relative inline-flex size-9 items-center justify-center rounded-lg text-sm font-normal text-stone-700 outline-none transition-colors hover:bg-stone-900/5 focus-visible:ring-2 focus-visible:ring-emerald-500/40",
  day_today:
    "font-semibold text-emerald-700 after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current",
  day_outside: "text-stone-300",
  day_disabled: "pointer-events-none text-stone-300",
  day_hidden: "invisible",
};

const rangeClassNames: Partial<ClassNames> = {
  ...baseClassNames,
  // The pale band lives on the cells so it runs continuously between the two dark ends.
  cell: cn(
    baseClassNames.cell,
    "first:rounded-l-lg last:rounded-r-lg [&:has(>.day-month-start)]:rounded-l-lg [&:has(>.day-month-end)]:rounded-r-lg",
    "[&:has(>.day-range-start)]:rounded-l-lg [&:has(>.day-range-end)]:rounded-r-lg",
    "[&:has(>.day-range-start)]:bg-emerald-50 [&:has(>.day-range-middle)]:bg-emerald-50 [&:has(>.day-range-end)]:bg-emerald-50",
    "[&:has(>.day-preview)]:bg-emerald-50/70 [&:has(>.day-preview-start)]:rounded-l-lg [&:has(>.day-preview-end)]:rounded-r-lg",
  ),
  day_selected: "",
  day_range_start: "day-range-start bg-emerald-600! font-medium text-white! hover:bg-emerald-700!",
  day_range_end: "day-range-end bg-emerald-600! font-medium text-white! hover:bg-emerald-700!",
  day_range_middle: "day-range-middle text-emerald-900",
};

const singleClassNames: Partial<ClassNames> = {
  ...baseClassNames,
  day_selected: "bg-emerald-600! font-medium text-white! hover:bg-emerald-700!",
};

const popoverClass =
  "z-[70] w-auto max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain rounded-xl border-stone-200 bg-white p-0 text-stone-900 shadow-xl";

/** Round the range band where it is cut by a month edge rather than a week edge. */
const monthEdgeModifiers = {
  month_start: (day: Date) => day.getDate() === 1,
  month_end: (day: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getDate() === 1,
};

const monthStart = (day: string) => {
  const date = parseLocalDate(day);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/** Left-most month to show: past filters end on the selected (or current) month, upcoming ones start there. */
function firstVisibleMonth(value: DateRangeValue, months: number, direction: "past" | "upcoming", today: string): Date {
  if (direction === "upcoming") return monthStart(value.from || value.to || today);
  const anchor = monthStart(value.to || value.from || today);
  const first = new Date(anchor.getFullYear(), anchor.getMonth() - (months - 1), 1);
  const from = value.from ? monthStart(value.from) : undefined;
  return from && from < first ? from : first;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  direction = "past",
  presets = direction === "past" ? PAST_PRESETS : UPCOMING_PRESETS,
  placeholder,
  ariaLabel = "选择日期范围",
  className,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** Which way the quick presets and the initially shown months lean. */
  direction?: "past" | "upcoming";
  presets?: DatePreset[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const months = useIsMobile() ? 1 : 2;
  const today = localDate();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>({ from, to });
  const [hover, setHover] = useState("");
  const [month, setMonth] = useState(() => new Date());

  const openChange = (next: boolean) => {
    if (next) {
      setDraft({ from, to });
      setHover("");
      setMonth(firstVisibleMonth({ from, to }, months, direction, today));
    }
    setOpen(next);
  };
  const apply = (range: DateRangeValue) => {
    onChange(range.from, range.to);
    setOpen(false);
  };
  const choosePreset = (preset: DatePreset) => {
    const range = presetRange(preset, today);
    setDraft(range);
    setMonth(firstVisibleMonth(range, months, direction, today));
  };

  const selected: DateRange | undefined = draft.from
    ? { from: parseLocalDate(draft.from), to: draft.to ? parseLocalDate(draft.to) : undefined }
    : undefined;
  const previewing = Boolean(draft.from && !draft.to && hover && hover !== draft.from);
  const [previewStart, previewEnd] = hover < draft.from ? [hover, draft.from] : [draft.from, hover];
  const modifiers = {
    ...monthEdgeModifiers,
    ...(previewing && {
      preview: { from: parseLocalDate(previewStart), to: parseLocalDate(previewEnd) },
      preview_start: parseLocalDate(previewStart),
      preview_end: parseLocalDate(previewEnd),
    }),
  };
  const activePreset = presets.find((preset) => {
    const range = presetRange(preset, today);
    return range.from === draft.from && range.to === draft.to;
  });
  const length = rangeLength(draft);
  const status = draft.from && draft.to
    ? `${draft.from} 至 ${draft.to} · 共 ${length} 天`
    : draft.from
      ? `${draft.from} 起，请选择结束日期`
      : "请选择开始日期";

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex h-9 min-w-[238px] items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-left text-sm font-normal transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 data-[state=open]:border-emerald-500 data-[state=open]:ring-2 data-[state=open]:ring-emerald-500/20",
            from || to ? "text-stone-700" : "text-stone-400",
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-stone-400" />
          <span className="truncate">{formatRange({ from, to }, placeholder)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} collisionPadding={16} className={popoverClass}>
        <div className="flex flex-col md:flex-row">
          {presets.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto border-b border-stone-100 p-3 md:w-32 md:flex-col md:gap-0.5 md:overflow-visible md:border-b-0 md:border-r">
              <div className="hidden px-2.5 pb-1.5 pt-1 text-xs text-stone-400 md:block">快捷选择</div>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={activePreset === preset}
                  onClick={() => choosePreset(preset)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-sm font-normal transition-colors",
                    activePreset === preset ? "bg-emerald-50 font-medium text-emerald-700" : "text-stone-600 hover:bg-stone-100",
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
          <div className="p-3" onMouseLeave={() => setHover("")}>
            <DayPicker
              mode="range"
              numberOfMonths={months}
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onDayClick={(day) => {
                setDraft((current) => pickRangeDay(current, localDate(day)));
                setHover("");
              }}
              onDayMouseEnter={(day) => setHover(localDate(day))}
              modifiers={modifiers}
              modifiersClassNames={{
                month_start: "day-month-start",
                month_end: "day-month-end",
                preview: "day-preview",
                preview_start: "day-preview-start",
                preview_end: "day-preview-end",
              }}
              classNames={rangeClassNames}
              {...calendarProps}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-4 py-3">
          <div className="min-w-0 text-xs text-stone-500" aria-live="polite">{status}</div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => apply({ from: "", to: "" })} className="h-8 rounded-lg px-3 text-xs font-normal text-stone-600 hover:bg-stone-100">
              清除
            </button>
            <button type="button" onClick={() => apply(completeRange(draft))} className="h-8 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-700">
              确定
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Single-day field for forms; picking a day applies it and closes the calendar. */
export function DateField({
  value,
  onChange,
  disabled,
  invalid,
  placeholder = "选择日期",
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const today = localDate();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const pick = (day: string) => {
    onChange(day);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(monthStart(value || today));
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 data-[state=open]:border-emerald-500 data-[state=open]:ring-2 data-[state=open]:ring-emerald-500/20",
            invalid ? "border-rose-300" : "border-stone-200 hover:border-stone-300",
            value ? "text-stone-800" : "text-stone-400",
            disabled && "cursor-default border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-100",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <CalendarDays className="size-4 shrink-0 text-stone-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} collisionPadding={16} className={popoverClass}>
        <div className="p-3">
          <DayPicker
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={value ? parseLocalDate(value) : undefined}
            onDayClick={(day) => pick(localDate(day))}
            showOutsideDays
            fixedWeeks
            classNames={singleClassNames}
            {...calendarProps}
          />
        </div>
        <div className="flex border-t border-stone-100 px-3 py-2">
          <button type="button" onClick={() => pick(today)} className="h-7 rounded-md px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
            今天
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

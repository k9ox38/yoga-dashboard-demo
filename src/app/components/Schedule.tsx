import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Star, EyeOff, Users, LayoutGrid, List } from "lucide-react";
import type { ClassSession, ClassTemplate } from "./data";
import { ScheduleExportDialog } from "./ScheduleExportDialog";
import { buildScheduleWeek, paletteIndex } from "../lib/scheduleImage";
import { addDays } from "../lib/dates";

/* ── constants ──────────────────────────────────── */

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const START_HOUR = 6; // earliest seeded class starts 06:30
const END_HOUR   = 21;
const HOUR_PX    = 64; // pixels per hour
const TOTAL_H    = (END_HOUR - START_HOUR) * HOUR_PX;
const HOUR_COUNT = END_HOUR - START_HOUR;

const COLOR_PALETTES = [
  { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900", sub: "text-emerald-700" },
  { bg: "bg-blue-100",    border: "border-blue-300",    text: "text-blue-900",    sub: "text-blue-700"    },
  { bg: "bg-violet-100",  border: "border-violet-300",  text: "text-violet-900",  sub: "text-violet-700"  },
  { bg: "bg-amber-100",   border: "border-amber-300",   text: "text-amber-900",   sub: "text-amber-700"   },
  { bg: "bg-rose-100",    border: "border-rose-300",    text: "text-rose-900",    sub: "text-rose-700"    },
  { bg: "bg-teal-100",    border: "border-teal-300",    text: "text-teal-900",    sub: "text-teal-700"    },
  { bg: "bg-pink-100",    border: "border-pink-300",    text: "text-pink-900",    sub: "text-pink-700"    },
  { bg: "bg-orange-100",  border: "border-orange-300",  text: "text-orange-900",  sub: "text-orange-700"  },
];

/* ── helpers ─────────────────────────────────────── */

function getMonday(offset = 0): Date {
  const today = new Date();
  const day   = today.getDay();
  const diff  = day === 0 ? -6 : 1 - day;
  const mon   = new Date(today);
  mon.setDate(today.getDate() + diff + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dateLabel(d: Date) { return `${d.getMonth() + 1} 月 ${d.getDate()} 日`; }

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear()
    && d.getMonth() === t.getMonth()
    && d.getDate() === t.getDate();
}

function sessionPalette(classId: string) {
  return COLOR_PALETTES[paletteIndex(classId, COLOR_PALETTES.length)];
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function timeToTop(start: string): number {
  const mins = timeToMinutes(start) - START_HOUR * 60;
  return Math.max(0, (mins / 60) * HOUR_PX);
}

function timeToDurationHeight(start: string, end: string): number {
  const dur = timeToMinutes(end) - timeToMinutes(start);
  return Math.max(36, (dur / 60) * HOUR_PX);
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= value ? "fill-amber-400 text-amber-400" : "fill-stone-100 text-stone-200"}`} />
      ))}
    </span>
  );
}

const formatBadge: Record<string, string> = {
  团课: "bg-emerald-50 text-emerald-700",
  私教: "bg-amber-50 text-amber-700",
};

const fillColor = (pct: number) =>
  pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500";

/* ── current time line ──────────────────────────── */

function CurrentTimeLine() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
  if (mins < 0 || mins > HOUR_COUNT * 60) return null;
  const top = (mins / 60) * HOUR_PX;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 -ml-1" />
        <div className="flex-1 h-px bg-rose-400" />
      </div>
    </div>
  );
}

/* ── timeline week view ──────────────────────────── */

type TimelineProps = {
  days:      Date[];
  sessions:  ClassSession[];
  templates: ClassTemplate[];
  onEdit:    (s: ClassSession) => void;
  onCreate:  (date?: string, start?: string, end?: string) => void;
  goToDay:   (i: number) => void;
};

function yToSnap(y: number) {
  const totalMins  = (y / HOUR_PX) * 60;
  const snapped    = Math.round(totalMins / 30) * 30;
  const clamped    = Math.max(0, Math.min(HOUR_COUNT * 60 - 60, snapped));
  const sh = Math.floor(clamped / 60) + START_HOUR;
  const sm = clamped % 60;
  const eh = Math.floor((clamped + 60) / 60) + START_HOUR;
  const em = (clamped + 60) % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${pad(sh)}:${pad(sm)}`,
    end:   `${pad(eh)}:${pad(em)}`,
    top:   (clamped / 60) * HOUR_PX,
  };
}

function TimelineWeekView({ days, sessions, templates, onEdit, onCreate, goToDay }: TimelineProps) {
  const tplById = (id: string) => templates.find(t => t.id === id);
  const [hover, setHover] = useState<{ col: number; y: number } | null>(null);
  const snap = hover ? yToSnap(hover.y) : null;

  // On narrow screens the week scrolls sideways; bring today's column into view.
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayCol = days.findIndex(isToday);
  useEffect(() => {
    const box = scrollRef.current;
    const col = box?.querySelector<HTMLElement>("[data-today]");
    if (box && col && box.scrollWidth > box.clientWidth) box.scrollLeft += col.getBoundingClientRect().left - box.getBoundingClientRect().left - 56;
  }, [todayCol]);

  return (
    // One scroll box for both axes: the day header sticks to the top and the time column to the
    // left, so neither scrolls away when the week is wider than the screen.
    <div ref={scrollRef} className="bg-white rounded-xl border border-stone-200 overflow-auto overscroll-x-contain" style={{ maxHeight: 630 }}>
      {/* ── Day headers ── */}
      <div className="sticky top-0 z-30 flex min-w-[720px] border-b border-stone-100 bg-white">
        {/* gutter spacer */}
        <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-stone-100 bg-white" />
        {days.map((d, i) => {
          const today = isToday(d);
          return (
            <button
              key={i}
              data-today={today || undefined}
              onClick={() => goToDay(i)}
              className={`flex-1 py-3 text-center border-l border-stone-100 transition-colors ${
                today ? "bg-emerald-600" : "hover:bg-stone-50"
              }`}
            >
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${today ? "text-emerald-100" : "text-stone-400"}`}>
                {WEEKDAYS[i]}
              </div>
              <div className={`text-sm font-bold mt-0.5 ${today ? "text-white" : "text-stone-800"}`}>
                {d.getMonth() + 1}/{d.getDate()}
              </div>
              {(() => {
                const cnt = sessions.filter(s => s.date === fmt(d)).length;
                return (
                  <div className={`text-[10px] mt-0.5 ${today ? "text-emerald-200" : "text-stone-400"}`}>
                    {cnt > 0 ? `${cnt} 节` : "—"}
                  </div>
                );
              })()}
            </button>
          );
        })}
      </div>

      {/* ── Time grid ── */}
      <div className="min-w-[720px]">
        <div className="flex" style={{ height: TOTAL_H }}>

          {/* Time labels column */}
          <div className="sticky left-0 z-[25] w-14 shrink-0 border-r border-stone-100 bg-white" style={{ height: TOTAL_H }}>
            {Array.from({ length: HOUR_COUNT + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute right-0 left-0 pr-2 flex justify-end"
                style={{ top: Math.max(0, i * HOUR_PX - 8) }}
              >
                <span className="text-[10px] text-stone-400 tabular-nums leading-none">
                  {(START_HOUR + i).toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, i) => {
            const today   = isToday(d);
            const dateStr = fmt(d);
            const colItems = sessions
              .filter(s => s.date === dateStr)
              .sort((a, b) => a.start.localeCompare(b.start));

            return (
              <div
                key={i}
                className="flex-1 relative border-l border-stone-100"
                style={{ height: TOTAL_H }}
              >
                {/* Horizontal time-slot band (pointer-events-none so overlay still catches clicks) */}
                {snap && (
                  <div
                    className="absolute left-0 right-0 bg-emerald-50/30 pointer-events-none"
                    style={{ top: snap.top, height: HOUR_PX / 2 }}
                  />
                )}

                {/* Click-to-add overlay */}
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const { start, end } = yToSnap(e.clientY - rect.top);
                    onCreate(dateStr, start, end);
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHover({ col: i, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => setHover(null)}
                  className="absolute inset-0 cursor-pointer hover:bg-emerald-50/30 transition-colors"
                />

                {/* Hour grid lines */}
                {Array.from({ length: HOUR_COUNT }, (_, j) => (
                  <div
                    key={j}
                    className="absolute left-0 right-0 border-t border-stone-100 pointer-events-none"
                    style={{ top: j * HOUR_PX }}
                  />
                ))}

                {/* Half-hour lighter lines */}
                {Array.from({ length: HOUR_COUNT }, (_, j) => (
                  <div
                    key={`h${j}`}
                    className="absolute left-0 right-0 border-t border-stone-50 pointer-events-none"
                    style={{ top: j * HOUR_PX + HOUR_PX / 2 }}
                  />
                ))}

                {/* Current time indicator */}
                {today && <CurrentTimeLine />}

                {/* Session cards */}
                {colItems.map(s => {
                  const t      = tplById(s.classId);
                  const top    = timeToTop(s.start);
                  const height = timeToDurationHeight(s.start, s.end);
                  const colors = sessionPalette(s.classId);
                  const cap    = t?.capacity ?? 0;
                  const pct    = cap ? Math.round((s.booked / cap) * 100) : 0;
                  const isFull = cap > 0 && s.booked >= cap;

                  return (
                    <div
                      key={s.id}
                      onClick={() => onEdit(s)}
                      className={`absolute left-1 right-1 rounded-lg ${colors.bg} border ${colors.border} cursor-pointer hover:opacity-90 transition-opacity overflow-hidden z-10`}
                      style={{ top, height }}
                    >
                      <div className="px-2 py-1.5 h-full flex flex-col gap-0.5">
                        <div className={`text-[11px] font-bold leading-tight truncate ${colors.text}`}>
                          {t?.name ?? "未关联课程"}
                        </div>
                        {height >= 52 && (
                          <div className={`text-[10px] leading-tight truncate ${colors.sub}`}>
                            {s.instructor}
                          </div>
                        )}
                        {height >= 70 && (
                          <div className={`text-[10px] mt-auto flex items-center gap-1.5 ${colors.sub}`}>
                            <span>{s.booked} / {cap}</span>
                            {isFull && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-semibold">已满</span>
                            )}
                            {!s.isVisible && (
                              <span className="flex items-center gap-0.5 text-[9px]">
                                <EyeOff className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────── */

type Props = {
  sessions:  ClassSession[];
  templates: ClassTemplate[];
  onEdit:    (s: ClassSession) => void;
  onCreate:  (date?: string, start?: string, end?: string) => void;
};

export function Schedule({ sessions, templates, onEdit, onCreate }: Props) {
  const [view, setView]             = useState<"week" | "day">("day");
  const [weekOffset, setWeekOffset] = useState(0);
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const [selectedDay, setSelectedDay] = useState(todayIndex);

  const monday = getMonday(weekOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const selectedDate    = days[selectedDay];
  const selectedDateStr = fmt(selectedDate);

  const dayItems = sessions
    .filter(s => s.date === selectedDateStr)
    .sort((a, b) => a.start.localeCompare(b.start));

  const tplById = (id: string) => templates.find(t => t.id === id);

  const startLabel = `${monday.getMonth() + 1}/${monday.getDate()}`;
  const endDate    = new Date(monday); endDate.setDate(monday.getDate() + 6);
  const endLabel   = `${endDate.getMonth() + 1}/${endDate.getDate()}`;

  // The export is a picture of the week shown, built only when the dialog is open.
  const [exportOpen, setExportOpen] = useState(false);
  const mondayKey = fmt(monday);
  const exportWeek = useMemo(
    () => buildScheduleWeek(Array.from({ length: 7 }, (_, i) => addDays(mondayKey, i)), sessions, templates),
    [mondayKey, sessions, templates],
  );

  function goToDay(i: number) {
    setSelectedDay(i);
    setView("day");
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <ScheduleExportDialog open={exportOpen} onOpenChange={setExportOpen} week={exportWeek} />

      {/* ── Top controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setWeekOffset(w => w - 1); setSelectedDay(0); }}
            className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-stone-600" />
          </button>
          <span className="whitespace-nowrap px-1 text-sm tabular-nums text-stone-700">
            <span className="hidden sm:inline">{monday.getFullYear()} 年 &nbsp;</span>{startLabel} – {endLabel}
          </span>
          <button
            onClick={() => { setWeekOffset(w => w + 1); setSelectedDay(0); }}
            className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button>
          <button
            onClick={() => { setWeekOffset(0); setSelectedDay(todayIndex); }}
            className="h-8 shrink-0 px-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs text-stone-600 transition-colors"
          >
            今天
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5 gap-0.5">
            <button
              onClick={() => setView("week")}
              title="周视图"
              className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === "week" ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> 周
            </button>
            <button
              onClick={() => setView("day")}
              title="日视图"
              className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === "day" ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <List className="w-3.5 h-3.5" /> 日
            </button>
          </div>

          <button
            onClick={() => setExportOpen(true)}
            aria-label="导出课程表"
            className="h-9 px-2.5 sm:px-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Download className="w-4 h-4" /><span className="hidden sm:inline">导出课程表</span>
          </button>
        </div>
      </div>

      {/* ══ WEEK VIEW (timeline) ══ */}
      {view === "week" && (
        <TimelineWeekView
          days={days}
          sessions={sessions}
          templates={templates}
          onEdit={onEdit}
          onCreate={onCreate}
          goToDay={goToDay}
        />
      )}

      {/* ══ DAY VIEW ══ */}
      {view === "day" && (
        <>
          {/* Day tabs */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              const today  = isToday(d);
              const active = i === selectedDay;
              const count  = sessions.filter(s => s.date === fmt(d)).length;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`rounded-xl py-2.5 text-center transition-colors border ${
                    active
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                      : today
                      ? "bg-white border-emerald-400 text-emerald-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className={`text-xs mb-1 ${active ? "text-emerald-100" : "text-stone-400"}`}>{WEEKDAYS[i]}</div>
                  <div className="text-lg leading-none font-semibold">{d.getDate()}</div>
                  {count > 0 && (
                    <div className={`mt-1 text-[10px] ${active ? "text-emerald-200" : "text-stone-400"}`}>
                      {count} 节
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-stone-900 font-medium">
                {WEEKDAYS[selectedDay]}・{dateLabel(selectedDate)}
              </span>
              {isToday(selectedDate) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">今天</span>
              )}
              <span className="text-xs text-stone-400">{dayItems.length} 节课</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 团课</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> 私教</span>
            </div>
          </div>

          {/* Session list */}
          {dayItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-stone-200 py-16 text-center">
              <div className="text-stone-400 text-sm">当天暂无排课</div>
              <button onClick={() => onCreate(selectedDateStr)} className="mt-3 text-xs text-emerald-700 hover:underline">+ 添加排课</button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onCreate(selectedDateStr)}
                className="w-full bg-white rounded-xl border border-dashed border-stone-200 px-6 py-4 flex items-center gap-4 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors shrink-0">
                  <Plus className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <span className="text-sm text-stone-400 group-hover:text-emerald-700 transition-colors">添加排课</span>
              </button>

              {dayItems.map(s => {
                const t   = tplById(s.classId);
                const cap = t?.capacity ?? 0;
                const pct = cap ? Math.round((s.booked / cap) * 100) : 0;

                return (
                  <div
                    key={s.id}
                    onClick={() => onEdit(s)}
                    className="bg-white rounded-xl border border-stone-200 px-6 py-4 flex items-center gap-6 cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-16 shrink-0">
                      <div className="text-base text-stone-900 tabular-nums font-medium">{s.start}</div>
                      <div className="text-xs text-stone-400 mt-0.5 tabular-nums">{s.end}</div>
                    </div>

                    <div className="w-px self-stretch bg-stone-100 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-stone-900 font-semibold mb-1.5 truncate">{t?.name ?? "未关联课程"}</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-stone-500">{s.instructor}</span>
                        <Stars value={s.difficulty ?? 0} />
                        {t && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${formatBadge[t.format] ?? "bg-stone-100 text-stone-500"}`}>
                            {t.format}
                          </span>
                        )}
                        {!s.isVisible && (
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <EyeOff className="w-3 h-3" /> 未发布
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1.5 justify-end mb-1">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span className={`text-sm tabular-nums font-semibold ${pct >= 100 ? "text-rose-600" : pct >= 80 ? "text-amber-600" : "text-stone-700"}`}>
                          {s.booked}
                        </span>
                        <span className="text-xs text-stone-300">/</span>
                        <span className="text-xs text-stone-400">{cap}</span>
                      </div>
                      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden ml-auto">
                        <div
                          className={`h-full rounded-full ${fillColor(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

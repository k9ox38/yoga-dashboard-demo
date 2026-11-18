import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BellRing, CalendarDays, Check,
  ChevronDown, Download, Lightbulb, Mail, RefreshCw, Sparkles, UserRoundSearch,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { useStore } from "../store-context";
import { localDate, recentMonthKeys } from "../lib/dates";
import { demoReconRecords } from "../lib/demoCommerce";
import { downloadCsv } from "../lib/csv";
import {
  AT_RISK_DAYS, PERIOD_PRESETS, atRiskMembers, dataUpdatedStamp, expiringPassMembers,
  lowPrivateBalanceMembers, lowestUpcomingFill, membersWithValidCards, pendingRecon, periodRange,
  prepaidBalance, rangeAnchor, rangeText, recentWeekLabels, recentlyActiveMembers,
  type PeriodPreset, type RiskMember, type RiskStatus,
} from "../lib/reportMetrics";
import type { ClassSession, ClassTemplate, PackageProduct } from "./data";

type TabId = "overview" | "courses" | "members" | "revenue" | "coaches";

const EMERALD = "#047857";
const SKY = "#0284C7";
const NEUTRAL = "#D6D3D1";
const GRID = "#E7E5E4";
const cardClass = "rounded-xl border border-stone-200 bg-white shadow-[0_1px_3px_rgba(28,25,23,0.035)]";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50";
const tooltipProps = {
  contentStyle: { border: `1px solid ${GRID}`, borderRadius: 8, boxShadow: "0 6px 20px rgba(28,25,23,.08)", fontSize: 12 },
  labelStyle: { color: "#1C1917", fontWeight: 600 },
  cursor: { stroke: "#A8A29E", strokeDasharray: "3 3" },
};
const yuan = (value: number) => `¥${Math.round(value).toLocaleString()}`;

/* ─── Sample history ─────────────────────────────────────────────────────────
 * The demo store has members, cards, schedule, orders and reconciliation records,
 * but no attendance or finance history. Trend charts below use these sample series
 * (oldest → newest, last value = selected period). Names always come from the store.
 */

const SAMPLE_CASH_HISTORY = [11200, 10400, 14600, 9800, 12100, 13500, 12900, 14200, 15300, 13800, 15200];
const SAMPLE_RECOGNISED = [10600, 10100, 11700, 10900, 11800, 12400, 12800, 13100, 13700, 13500, 14300, 14900];
const SAMPLE_REFUND = 680;
/** Paid orders in the selected period, by package id (amount = current package price). */
const SAMPLE_SALES: Array<{ packageId: string; orders: number }> = [
  { packageId: "p6", orders: 2 }, { packageId: "p4", orders: 6 }, { packageId: "p5", orders: 2 },
  { packageId: "p3", orders: 1 }, { packageId: "p2", orders: 1 },
];
const SAMPLE_WEEKS = [
  { attended: 128, absent: 9, cancelled: 14 }, { attended: 134, absent: 7, cancelled: 12 },
  { attended: 121, absent: 11, cancelled: 17 }, { attended: 140, absent: 8, cancelled: 11 },
  { attended: 152, absent: 10, cancelled: 15 }, { attended: 147, absent: 9, cancelled: 13 },
  { attended: 159, absent: 12, cancelled: 16 }, { attended: 154, absent: 10, cancelled: 12 },
];
/** Average fill per weekday (Mon → Sun) for each recurring slot; null = not scheduled. */
const SAMPLE_SLOTS: Array<{ time: string; classId: string; values: Array<number | null> }> = [
  { time: "06:30", classId: "t4", values: [52, null, 61, null, 58, null, null] },
  { time: "07:00", classId: "t1", values: [84, 88, 79, 90, 86, null, null] },
  { time: "09:30", classId: "t2", values: [66, 58, 71, 62, 69, 92, 88] },
  { time: "10:00", classId: "t6", values: [null, 42, null, 38, null, 46, null] },
  { time: "18:00", classId: "t7", values: [91, null, 88, null, 93, null, null] },
  { time: "18:30", classId: "t3", values: [86, 91, 83, 94, 78, null, null] },
  { time: "20:00", classId: "t3", values: [72, 79, null, 81, null, null, 63] },
];
const SAMPLE_COURSE_ATTENDANCE: Record<string, number> = { t1: 94, t2: 92, t3: 95, t4: 90, t6: 88, t7: 93, t8: 96 };
const SAMPLE_PRIVATE_SESSIONS = 26;
const SAMPLE_FILL_PREVIOUS = 70;
const SAMPLE_ATTENDANCE_MONTHS = [480, 495, 510, 506, 530, 542, 551, 560, 578, 584];
const SAMPLE_FILL_MONTHS = [61, 63, 65, 62, 66, 67, 68, 69, 71, 70];
const SAMPLE_RENEWALS = [
  { name: "月卡", due: 9, renewed: 6, type: "group" },
  { name: "季卡", due: 3, renewed: 2, type: "group" },
  { name: "私教 10 次课时包", due: 5, renewed: 3, type: "private" },
  { name: "10 / 20 节课时包", due: 5, renewed: 3, type: "group" },
];
const SAMPLE_RENEWAL_HISTORY = [59, 61, 62, 65, 66, 64, 68, 69, 66, 68, 67];
const SAMPLE_COHORTS = [
  [100, 79, 69, 62, 59, 55], [100, 82, 70, 64, 61], [100, 76, 66, 60], [100, 81, 73], [100, 77], [100],
];
const SAMPLE_FUNNEL = [
  { label: "小程序注册", value: 12 }, { label: "首次购卡", value: 10 },
  { label: "首次上课", value: 8 }, { label: "首月上课 ≥ 3 次", value: 5 },
];
const SAMPLE_VISIT_SHARES = [
  { range: "1 次", share: 0.15 }, { range: "2–3 次", share: 0.25 },
  { range: "4–7 次", share: 0.4 }, { range: "8 次以上", share: 0.2 },
];

type Change = { text: string; up: boolean; good: boolean };
type Kpi = { label: string; value: string; previous: string; change?: Change; values?: number[]; live?: boolean };

function pctChange(current: number, previous: number, higherIsGood = true): Change {
  const diff = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  return { text: `${Math.abs(diff).toFixed(1)}%`, up: diff >= 0, good: (diff >= 0) === higherIsGood };
}
function ptChange(current: number, previous: number, higherIsGood = true): Change {
  const diff = current - previous;
  return { text: `${Math.abs(diff)}pt`, up: diff >= 0, good: (diff >= 0) === higherIsGood };
}
const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const filled = (values: Array<number | null>) => values.filter((value): value is number => value != null);

/** Largest-remainder split of `total` people across shares so the buckets always add up. */
function splitByShare(total: number, shares: number[]): number[] {
  const raw = shares.map((share) => share * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((sum, value) => sum + value, 0);
  raw.map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ index }) => { if (left > 0) { out[index] += 1; left -= 1; } });
  return out;
}

function courseRows(templates: ClassTemplate[], sessions: ClassSession[]) {
  const coaches = (classId: string) => [...new Set(sessions.filter((session) => session.classId === classId).map((session) => session.instructor))].join("、") || "—";
  const group = templates.flatMap((template) => {
    const slots = SAMPLE_SLOTS.filter((slot) => slot.classId === template.id);
    if (!slots.length) return [];
    const cells = slots.flatMap((slot) => filled(slot.values));
    const fill = Math.round(avg(cells));
    return [{
      id: template.id,
      name: template.name,
      meta: `${coaches(template.id)} · ${slots.map((slot) => slot.time).join(" / ")}`,
      type: "小班",
      sessions: Math.round((cells.length * 31) / 7),
      fill: fill as number | null,
      attendance: SAMPLE_COURSE_ATTENDANCE[template.id] ?? 90,
      low: fill < 50,
    }];
  }).sort((a, b) => (b.fill ?? 0) - (a.fill ?? 0));
  const privateTemplate = templates.find((template) => template.format === "私教");
  const privateRow = privateTemplate ? [{
    id: privateTemplate.id,
    name: privateTemplate.name,
    meta: `${coaches(privateTemplate.id)} · 灵活预约`,
    type: "私教",
    sessions: SAMPLE_PRIVATE_SESSIONS,
    fill: null,
    attendance: SAMPLE_COURSE_ATTENDANCE[privateTemplate.id] ?? 95,
    low: false,
  }] : [];
  return [...group, ...privateRow];
}

function salesRows(packages: PackageProduct[]) {
  return SAMPLE_SALES.flatMap((sale) => {
    const product = packages.find((item) => item.id === sale.packageId);
    if (!product) return [];
    return [{ name: product.name, amount: product.price * sale.orders, orders: sale.orders, type: product.scope === "private" ? "private" : "group" }];
  }).sort((a, b) => b.amount - a.amount);
}

/** Legend labels in ink, not series colour; the swatch carries identity. */
const legendProps = {
  iconSize: 10,
  wrapperStyle: { fontSize: 12 },
  formatter: (value: string) => <span style={{ color: "#57534e" }}>{value}</span>,
};

export function Reports() {
  const { members, packages, sessions, templates, addMemberActivity } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");
  const [period, setPeriod] = useState<PeriodPreset>("上月");
  const [subscribed, setSubscribed] = useState(false);
  const [reminded, setReminded] = useState<Record<string, boolean>>({});

  const now = new Date();
  const today = localDate(now);
  const range = periodRange(period, now);
  const anchor = rangeAnchor(range, now);

  const data = useMemo(() => {
    const months = recentMonthKeys(12, anchor);
    const sales = salesRows(packages);
    const gross = sales.reduce((sum, item) => sum + item.amount, 0);
    const cash = gross - SAMPLE_REFUND;
    const cashHistory = [...SAMPLE_CASH_HISTORY, cash];
    const income = months.map((month, index) => ({ month: month.label, cash: cashHistory[index], recognised: SAMPLE_RECOGNISED[index] }));
    const weekLabels = recentWeekLabels(SAMPLE_WEEKS.length, anchor);
    const weeks = SAMPLE_WEEKS.map((week, index) => ({ week: weekLabels[index], ...week }));
    const attendedNow = SAMPLE_WEEKS.slice(-4).reduce((sum, week) => sum + week.attended, 0);
    const attendedPrev = SAMPLE_WEEKS.slice(-8, -4).reduce((sum, week) => sum + week.attended, 0);
    const fillNow = Math.round(avg(SAMPLE_SLOTS.flatMap((slot) => filled(slot.values))));
    const renewDue = SAMPLE_RENEWALS.reduce((sum, item) => sum + item.due, 0);
    const renewDone = SAMPLE_RENEWALS.reduce((sum, item) => sum + item.renewed, 0);
    const renewNow = Math.round((renewDone / renewDue) * 100);
    const renewPrev = SAMPLE_RENEWAL_HISTORY[SAMPLE_RENEWAL_HISTORY.length - 1];

    const active = recentlyActiveMembers(members, today);
    const valid = membersWithValidCards(members, today);
    const risk = atRiskMembers(members, packages, today);
    const lowPrivate = lowPrivateBalanceMembers(members);
    const expiring = expiringPassMembers(members, today);
    const prepaid = prepaidBalance(members, packages, today);
    const privatePrice = packages.find((item) => item.scope === "private" && item.type === "class_pack")?.price ?? 0;

    const overviewKpis: Kpi[] = [
      { label: "现金收入", value: yuan(cash), previous: `上期 ${yuan(cashHistory[10])}`, change: pctChange(cash, cashHistory[10]), values: cashHistory },
      { label: "消课确认收入", value: yuan(SAMPLE_RECOGNISED[11]), previous: `上期 ${yuan(SAMPLE_RECOGNISED[10])}`, change: pctChange(SAMPLE_RECOGNISED[11], SAMPLE_RECOGNISED[10]), values: SAMPLE_RECOGNISED },
      { label: "出勤人次", value: String(attendedNow), previous: `上期 ${attendedPrev}`, change: pctChange(attendedNow, attendedPrev), values: [...SAMPLE_ATTENDANCE_MONTHS, attendedPrev, attendedNow] },
      { label: "小班课满班率", value: `${fillNow}%`, previous: `上期 ${SAMPLE_FILL_PREVIOUS}%`, change: ptChange(fillNow, SAMPLE_FILL_PREVIOUS), values: [...SAMPLE_FILL_MONTHS, SAMPLE_FILL_PREVIOUS, fillNow] },
      { label: `近 ${AT_RISK_DAYS} 天到访会员`, value: String(active.length), previous: `共 ${members.length} 位会员`, live: true },
      { label: "续卡率", value: `${renewNow}%`, previous: `上期 ${renewPrev}%`, change: ptChange(renewNow, renewPrev), values: [...SAMPLE_RENEWAL_HISTORY, renewNow] },
    ];
    const memberKpis: Kpi[] = [
      { label: "会员总数", value: String(members.length), previous: `${valid.length} 位持有效卡包`, live: true },
      { label: `近 ${AT_RISK_DAYS} 天到访`, value: String(active.length), previous: `占会员 ${members.length ? Math.round((active.length / members.length) * 100) : 0}%`, live: true },
      { label: "流失风险会员", value: `${risk.length} 人`, previous: `超过 ${AT_RISK_DAYS} 天未到访`, live: true },
      { label: "月卡 14 天内到期", value: `${expiring.length} 人`, previous: "可提前续费提醒", live: true },
      { label: "私教余课 ≤ 2 节", value: `${lowPrivate.length} 人`, previous: `续费机会约 ${yuan(lowPrivate.length * privatePrice)}`, live: true },
      { label: "续卡率", value: `${renewNow}%`, previous: `上期 ${renewPrev}%`, change: ptChange(renewNow, renewPrev), values: [...SAMPLE_RENEWAL_HISTORY, renewNow] },
    ];
    return {
      months, sales, gross, cash, income, weeks, active, valid, risk, lowPrivate, expiring, prepaid, privatePrice,
      overviewKpis, memberKpis, courses: courseRows(templates, sessions),
      fillAlert: lowestUpcomingFill(sessions, templates, today), recon: pendingRecon(demoReconRecords),
    };
  }, [members, packages, sessions, templates, today, anchor.getTime()]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "经营总览" }, { id: "courses", label: "课程与排课" },
    { id: "members", label: "会员与留存" }, { id: "revenue", label: "营收与财务" },
    { id: "coaches", label: "教练绩效" },
  ];

  const remind = (member: RiskMember) => {
    addMemberActivity(member.id, { description: `发送回访提醒（${AT_RISK_DAYS} 天以上未到访）`, actor: "管理员 · 数据报表" });
    setReminded((prev) => ({ ...prev, [member.id]: true }));
  };

  const exportReport = () => {
    const kpis = tab === "members" ? data.memberKpis : data.overviewKpis;
    downloadCsv(`数据报表-${range.start}-${range.end}.csv`, [
      ["数据报表", range.label, `对比 ${range.compareLabel}`],
      ["说明", "会员、卡包与提醒为演示数据；营收、出勤与留存趋势为示例数值"],
      [],
      ["指标", "数值", "说明"],
      ...kpis.map((kpi) => [kpi.label, kpi.value, kpi.previous]),
      [],
      [`流失风险会员（超过 ${AT_RISK_DAYS} 天未到访）`],
      ["会员", "手机号", "卡包", "最近到访", "未到访天数", "卡包状态"],
      ...data.risk.map((member) => [member.name, member.phone, member.cards.map((card) => card.label).join(" / ") || "暂无有效卡包", member.lastClass, member.daysSince, member.status]),
    ]);
  };

  return (
    <div className="min-h-full bg-stone-100 p-5 font-['Inter','PingFang_SC',sans-serif] text-stone-900 lg:p-7">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">数据报表</h1><span className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">示例数据</span></div>
            <p className="mt-1.5 text-sm text-stone-600">{range.label} · 对比 {range.compareLabel} · 数据更新于 {dataUpdatedStamp(now)}</p>
            <p className="mt-1 text-xs text-stone-500">会员名单、卡包状态、排课与对账提醒取自演示数据；营收、出勤、满班与留存趋势为示例数值，不与订单页对账。</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSubscribed((value) => !value)} aria-pressed={subscribed} className={buttonClass}>{subscribed ? <Check className="size-4 text-emerald-700" /> : <Mail className="size-4" />}{subscribed ? "已订阅月报" : "订阅月报"}</button>
            <button onClick={exportReport} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"><Download className="size-4" />导出报表</button>
          </div>
        </header>
        <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3`}>
          <div className="flex flex-wrap rounded-lg bg-stone-100 p-1" role="group" aria-label="统计周期">{PERIOD_PRESETS.map((item) => <button key={item} onClick={() => setPeriod(item)} aria-pressed={period === item} className={`min-h-11 rounded-md px-3 text-xs font-medium sm:min-h-9 ${period === item ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>{item}</button>)}</div>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 text-sm tabular-nums text-stone-700"><CalendarDays className="size-4 text-stone-500" />{rangeText(range)}</span>
          <FilterButton>对比&nbsp; 上一周期</FilterButton><FilterButton>课程类型&nbsp; 全部</FilterButton><FilterButton>教练&nbsp; 全部</FilterButton>
        </div>
        <div className="overflow-x-auto border-b border-stone-200"><div role="tablist" aria-label="报表视图" className="flex min-w-max gap-7">{tabs.map((item) => <button key={item.id} id={`report-tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="report-panel" onClick={() => setTab(item.id)} className={`-mb-px min-h-11 border-b-2 text-sm font-medium ${tab === item.id ? "border-emerald-700 text-emerald-700" : "border-transparent text-stone-600 hover:text-stone-900"}`}>{item.label}</button>)}</div></div>
        <div id="report-panel" role="tabpanel" aria-labelledby={`report-tab-${tab}`}>
          {tab === "overview" && <OverviewTab data={data} onMembers={() => setTab("members")} onNavigate={navigate} />}
          {tab === "members" && <MembersTab data={data} reminded={reminded} onRemind={remind} onNavigate={navigate} />}
          {tab !== "overview" && tab !== "members" && <Placeholder title={tabs.find((item) => item.id === tab)?.label ?? ""} />}
        </div>
      </div>
    </div>
  );
}

type ReportData = {
  sales: Array<{ name: string; amount: number; orders: number; type: string }>;
  gross: number;
  cash: number;
  income: Array<{ month: string; cash: number; recognised: number }>;
  weeks: Array<{ week: string; attended: number; absent: number; cancelled: number }>;
  active: unknown[];
  risk: RiskMember[];
  lowPrivate: Array<{ name: string }>;
  expiring: Array<{ name: string; expiry?: string }>;
  prepaid: ReturnType<typeof prepaidBalance>;
  privatePrice: number;
  overviewKpis: Kpi[];
  memberKpis: Kpi[];
  courses: ReturnType<typeof courseRows>;
  fillAlert: ReturnType<typeof lowestUpcomingFill>;
  recon: ReturnType<typeof pendingRecon>;
};

function OverviewTab({ data, onMembers, onNavigate }: { data: ReportData; onMembers: () => void; onNavigate: (path: string) => void }) {
  const totals = data.weeks.reduce((sum, week) => ({ attended: sum.attended + week.attended, absent: sum.absent + week.absent, cancelled: sum.cancelled + week.cancelled }), { attended: 0, absent: 0, cancelled: 0 });
  const attendanceRate = ((totals.attended / (totals.attended + totals.absent)) * 100).toFixed(1);
  const cancelRate = ((totals.cancelled / (totals.attended + totals.absent + totals.cancelled)) * 100).toFixed(1);
  const last = data.income[data.income.length - 1];
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">{data.overviewKpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
      <Card title="收入趋势" subtitle="近 12 个月 · 单位：元（示例）">
        <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.income} margin={{ top: 12, right: 42, left: 8, bottom: 0 }}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} /><YAxis domain={[0, 20000]} ticks={[0, 5000, 10000, 15000, 20000]} tickFormatter={(value) => value === 0 ? "0" : `${value / 10000}万`} tick={axisTick} axisLine={false} tickLine={false} width={42} /><Tooltip {...tooltipProps} formatter={(value, name) => [yuan(Number(value)), name]} /><Legend verticalAlign="top" align="left" height={32} iconType="line" {...legendProps} /><Line type="monotone" dataKey="cash" name="现金收入" stroke={EMERALD} strokeWidth={2} dot={false} activeDot={{ r: 4 }} label={(props: EndLabelProps) => <EndLabel {...props} count={data.income.length} />} /><Line type="monotone" dataKey="recognised" name="消课确认收入" stroke={SKY} strokeWidth={2} dot={false} activeDot={{ r: 4 }} label={(props: EndLabelProps) => <EndLabel {...props} count={data.income.length} />} /></LineChart></ResponsiveContainer></div>
        <Insight>现金收入高于消课确认收入，差额沉淀为预收余额 —— {last.month}净增预收 {yuan(last.cash - last.recognised)}。</Insight>
      </Card>
      <RevenueComposition data={data} />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="预约与出勤" subtitle="最近 8 周（示例）" action={<div className="flex shrink-0 gap-4 text-xs text-stone-600"><span>出勤率 <b className="tabular-nums text-stone-900">{attendanceRate}%</b></span><span>取消率 <b className="tabular-nums text-stone-900">{cancelRate}%</b></span></div>}><div className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.weeks}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} /><Tooltip {...tooltipProps} /><Legend verticalAlign="top" align="left" height={32} {...legendProps} /><Bar dataKey="attended" stackId="a" name="出勤" fill={EMERALD} stroke="#fff" strokeWidth={1} /><Bar dataKey="absent" stackId="a" name="缺席" fill={SKY} stroke="#fff" strokeWidth={1} /><Bar dataKey="cancelled" stackId="a" name="取消" fill={NEUTRAL} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Heatmap />
    </div>
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]"><CourseTable rows={data.courses} onAll={() => onNavigate("/classes")} /><Alerts data={data} onMembers={onMembers} onNavigate={onNavigate} /></div>
    <MetricDefinitions />
  </div>;
}

function MembersTab({ data, reminded, onRemind, onNavigate }: { data: ReportData; reminded: Record<string, boolean>; onRemind: (member: RiskMember) => void; onNavigate: (path: string) => void }) {
  const [riskFilter, setRiskFilter] = useState<"全部" | RiskStatus>("全部");
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">{data.memberKpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
    <div className="grid gap-5 xl:grid-cols-2"><ConversionFunnel /><VisitDistribution activeCount={data.active.length} /></div>
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]"><CohortMatrix /><RenewalAnalysis /></div>
    <RiskList members={data.risk} filter={riskFilter} onFilter={setRiskFilter} reminded={reminded} onRemind={onRemind} onAll={() => onNavigate("/members")} />
  </div>;
}

function KpiCard({ label, value, previous, change, values, live }: Kpi) {
  const data = values?.map((v, index) => ({ index, v }));
  return <div className={`${cardClass} min-w-0 p-4`}><div className="flex items-center justify-between gap-2 text-xs font-medium text-stone-600"><span>{label}</span>{live && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-normal text-emerald-700">实时</span>}</div><div className="mt-2 flex flex-wrap items-center gap-2"><div className="text-[26px] font-semibold leading-none tabular-nums tracking-tight">{value}</div>{change && <Trend change={change} />}</div><div className="mt-2 text-xs tabular-nums text-stone-500">{previous}</div>{data && <div className="mt-3 h-9"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><Tooltip contentStyle={{ border: `1px solid ${GRID}`, borderRadius: 6, fontSize: 11 }} labelFormatter={() => ""} formatter={(tooltipValue) => [tooltipValue, label]} /><Line type="monotone" dataKey="v" stroke={EMERALD} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>}</div>;
}

function RevenueComposition({ data }: { data: ReportData }) {
  const group = data.sales.filter((item) => item.type === "group").reduce((sum, item) => sum + item.amount, 0);
  const privateAmount = data.gross - group;
  const groupShare = data.gross ? Math.round((group / data.gross) * 100) : 0;
  const max = Math.max(1, ...data.sales.map((item) => item.amount));
  const orders = data.sales.reduce((sum, item) => sum + item.orders, 0);
  return <Card title="收入构成" subtitle={`按产品 · 已支付订单（示例）· 共 ${orders} 单，退款 ${yuan(SAMPLE_REFUND)}`}><div className="flex h-3 gap-0.5 overflow-hidden rounded-full"><div className="bg-emerald-700" style={{ width: `${groupShare}%` }} /><div className="flex-1 bg-amber-600" /></div><div className="mt-2 flex justify-between text-xs text-stone-600"><span>小班课 {yuan(group)} · {groupShare}%</span><span>私教 {yuan(privateAmount)} · {100 - groupShare}%</span></div><div className="mt-5 space-y-4">{data.sales.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate text-stone-700">{item.name}</span><span className="shrink-0 tabular-nums text-stone-600">{yuan(item.amount)} · {item.orders} 单</span></div><div className="h-1.5 rounded-full bg-stone-100"><div className={`h-full rounded-full ${item.type === "group" ? "bg-emerald-700" : "bg-amber-600"}`} style={{ width: `${(item.amount / max) * 100}%` }} /></div></div>)}</div><div className="mt-5 border-t border-stone-100 pt-4 text-xs text-stone-600">支付渠道：微信支付 83% · 现金 8% · 银行卡 9%</div><div className="mt-4 rounded-lg bg-stone-100 p-3 text-xs leading-5 text-stone-600"><b className="text-stone-900">预收余额（未消课）{yuan(data.prepaid.total)}</b> — 私教剩余 {data.prepaid.privateSessions} 节 · 有效小班卡 {data.prepaid.activePasses} 张<span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">实时</span></div></Card>;
}

function Heatmap() {
  const { templates } = useStore();
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const className = (id: string) => templates.find((template) => template.id === id)?.name ?? "";
  const evening = filled(SAMPLE_SLOTS.filter((slot) => slot.time >= "18:00" && slot.time <= "18:30").flatMap((slot) => slot.values));
  const lowest = [...SAMPLE_SLOTS].sort((a, b) => avg(filled(a.values)) - avg(filled(b.values)))[0];
  return <Card title="小班课时段热力图" subtitle="平均满班率 · 按上课时段（示例）"><div className="overflow-x-auto"><div className="min-w-[480px]"><div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-1.5 text-center text-[11px] text-stone-500"><span />{days.map((day) => <span key={day}>{day}</span>)}{SAMPLE_SLOTS.flatMap((row) => [<span key={`${row.time}-${row.classId}-label`} className="flex flex-col justify-center text-left leading-tight"><span className="tabular-nums text-stone-700">{row.time}</span><span className="truncate text-[10px]">{className(row.classId)}</span></span>, ...row.values.map((value, index) => <div key={`${row.time}-${index}`} className={`flex h-10 items-center justify-center rounded-md text-xs font-medium ${heatClass(value)}`}>{value == null ? "—" : `${value}%`}</div>)])}</div></div></div><div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">{["<40", "40–60", "60–75", "75–90", "≥90%"].map((label, index) => <span key={label} className="flex items-center gap-1"><i className="size-3 rounded-sm" style={{ background: ["#ECFDF5", "#A7F3D0", "#6EE7B7", "#047857", "#064E3B"][index] }} />{label}</span>)}<span className="flex items-center gap-1"><i className="size-3 rounded-sm border border-dashed border-stone-300" />未排课</span></div><Insight>晚间 18:00–18:30 档平均满班 {Math.round(avg(evening))}%，可考虑加开；{lowest.time}「{className(lowest.classId)}」平均仅 {Math.round(avg(filled(lowest.values)))}%。</Insight></Card>;
}

function CourseTable({ rows, onAll }: { rows: ReturnType<typeof courseRows>; onAll: () => void }) {
  return <section className={`${cardClass} overflow-hidden`}><CardHeader title="课程表现" subtitle="按区间排课与实际出勤汇总（示例）" action={{ label: "查看全部课程", onClick: onAll }} /><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-stone-50 text-left text-[11px] uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-3 font-medium">课程</th><th className="px-4 font-medium">类型</th><th className="px-4 text-right font-medium">节数</th><th className="w-48 px-4 font-medium">满班率</th><th className="px-5 text-right font-medium">出勤率</th></tr></thead><tbody>{rows.map((course) => <tr key={course.id} className="border-t border-stone-100"><td className="px-5 py-3"><div className="font-medium text-stone-900">{course.name}</div><div className="mt-0.5 text-xs text-stone-500">{course.meta}</div></td><td className="px-4"><TypeTag type={course.type} /></td><td className="px-4 text-right tabular-nums text-stone-700">{course.sessions}</td><td className="px-4">{course.fill == null ? <span className="text-xs text-stone-500">1 对 1，不计满班率</span> : <div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-stone-100"><div className={course.low ? "h-full rounded-full bg-rose-600" : "h-full rounded-full bg-emerald-700"} style={{ width: `${course.fill}%` }} /></div><span className="w-9 tabular-nums text-stone-700">{course.fill}%</span>{course.low && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700">偏低</span>}</div>}</td><td className="px-5 text-right tabular-nums">{course.attendance}%</td></tr>)}</tbody></table></div></section>;
}

type AlertItem = { kind: "预警" | "机会" | "待办"; title: string; detail: string; action: string; onClick: () => void };

function Alerts({ data, onMembers, onNavigate }: { data: ReportData; onMembers: () => void; onNavigate: (path: string) => void }) {
  const validRisk = data.risk.filter((member) => member.status === "卡包有效").length;
  const alerts: AlertItem[] = [];
  if (data.fillAlert) {
    const fill = data.fillAlert;
    alerts.push({ kind: "预警", title: `「${fill.className}」预约率 ${fill.rate}%（${fill.booked}/${fill.capacity}）`, detail: `${fill.date.slice(5)} ${fill.start} · ${fill.instructor} · 未来 7 天最低`, action: "调整排课", onClick: () => onNavigate("/schedule") });
  }
  if (data.risk.length) {
    alerts.push({ kind: "预警", title: `${data.risk.length} 位会员超过 ${AT_RISK_DAYS} 天未到访`, detail: `其中 ${validRisk} 位卡包仍有效`, action: "查看名单", onClick: onMembers });
  }
  if (data.lowPrivate.length) {
    alerts.push({ kind: "机会", title: `${data.lowPrivate.length} 位私教学员剩余 ≤ 2 节`, detail: `续费机会约 ${yuan(data.lowPrivate.length * data.privatePrice)}`, action: "续费跟进", onClick: () => onNavigate("/members") });
  }
  if (data.expiring.length) {
    const first = data.expiring[0];
    alerts.push({ kind: "机会", title: `${data.expiring.length} 张月卡 14 天内到期`, detail: `最早 ${first.expiry ?? "—"}（${first.name}）`, action: "查看会员", onClick: () => onNavigate("/members") });
  }
  if (data.recon.count) {
    alerts.push({ kind: "待办", title: `${data.recon.count} 笔渠道流水待对账`, detail: `未匹配 ${data.recon.unmatched} · 金额不符 ${data.recon.mismatched} · 合计 ${yuan(data.recon.amount)}`, action: "去对账", onClick: () => onNavigate("/reconciliation") });
  }
  return <section className={`${cardClass} overflow-hidden`}><CardHeader title="需要关注" subtitle="根据当前会员、排课与对账数据生成" />{alerts.length === 0 ? <div className="px-5 py-10 text-center text-sm text-stone-500">暂无需要关注的事项</div> : <div>{alerts.map((item) => <div key={item.title} className="flex gap-3 border-t border-stone-100 px-5 py-3 first:border-0"><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${item.kind === "机会" ? "bg-emerald-50 text-emerald-700" : item.kind === "待办" ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"}`}>{item.kind === "机会" ? <Sparkles className="size-4" /> : item.kind === "待办" ? <BellRing className="size-4" /> : <AlertTriangle className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><span className={`mt-px shrink-0 rounded px-1.5 py-0.5 text-[10px] ${item.kind === "机会" ? "bg-emerald-50 text-emerald-700" : item.kind === "待办" ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"}`}>{item.kind}</span><span className="text-[13px] font-medium leading-5">{item.title}</span></div><div className="mt-1 text-xs text-stone-500">{item.detail}</div></div><button onClick={item.onClick} className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium text-emerald-700 hover:text-emerald-900">{item.action}</button></div>)}</div>}</section>;
}

function MetricDefinitions() {
  const metrics = [["现金收入", "已支付订单实付 − 退款"], ["消课确认收入", "出勤课时 × 课包单价，月卡按天摊销"], ["满班率", "小班课出勤人次 ÷ 排课总容量"], ["出勤率", "出勤 ÷（出勤 + 缺席），取消不计入"], ["到访会员", `近 ${AT_RISK_DAYS} 天内至少上课 1 次（按最近上课日期）`], ["流失风险", `有上课记录但超过 ${AT_RISK_DAYS} 天未到访`], ["续卡率", "区间内到期/用完的卡包中，14 天内续购的比例"], ["预收余额", "私教剩余节数 × 单节价 + 有效月卡/季卡未使用天数折算"]];
  return <section className={`${cardClass} p-5`}><h3 className="text-base font-semibold">指标口径</h3><div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">{metrics.map(([name, detail]) => <div key={name} className="text-xs leading-5"><b className="text-stone-700">{name}</b><span className="text-stone-500"> = {detail}</span></div>)}</div></section>;
}

function ConversionFunnel() {
  const base = SAMPLE_FUNNEL[0].value;
  return <Card title="新会员转化漏斗" subtitle="近 90 天 · 从注册到形成稳定到访（示例）"><div className="space-y-4">{SAMPLE_FUNNEL.map((item, index) => <div key={item.label} className="grid grid-cols-[110px_1fr_68px] items-center gap-3"><span className="text-xs text-stone-600">{item.label}</span><div className="h-8 rounded-md bg-stone-100"><div className="flex h-full items-center rounded-md bg-emerald-700 px-3 text-xs text-white" style={{ width: `${Math.max(34, (item.value / base) * 100)}%` }}>{item.value} 人</div></div><span className="text-right text-xs tabular-nums text-stone-500">{index ? `${Math.round((item.value / SAMPLE_FUNNEL[index - 1].value) * 100)}%` : "基准"}</span></div>)}</div><Insight>{SAMPLE_FUNNEL[1].value} 位新会员中 3 位来自老会员推荐（{Math.round((3 / SAMPLE_FUNNEL[1].value) * 100)}%）。</Insight></Card>;
}

function VisitDistribution({ activeCount }: { activeCount: number }) {
  const counts = splitByShare(activeCount, SAMPLE_VISIT_SHARES.map((item) => item.share));
  const rows = SAMPLE_VISIT_SHARES.map((item, index) => ({ range: item.range, people: counts[index] }));
  return <Card title="到访频次分布" subtitle={`近 ${AT_RISK_DAYS} 天到访的 ${activeCount} 位会员 · 到访次数（示例分布）`}><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey="range" tick={axisTick} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} /><Tooltip {...tooltipProps} formatter={(value) => [`${value} 人`, "会员"]} /><Bar dataKey="people" name="会员人数" fill={EMERALD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="grid grid-cols-4 text-center text-xs text-stone-500">{rows.map((item) => <span key={item.range}>{activeCount ? Math.round((item.people / activeCount) * 100) : 0}%</span>)}</div></Card>;
}

function CohortMatrix() {
  const now = new Date();
  const months = recentMonthKeys(SAMPLE_COHORTS.length, new Date(now.getFullYear(), now.getMonth() - 1, 1, 12));
  return <Card title="留存矩阵" subtitle="按首次购卡月份 · 后续月份仍有到访（示例）"><div className="overflow-x-auto"><div className="min-w-[620px]"><div className="grid grid-cols-[96px_repeat(6,1fr)] gap-1.5 text-center text-[11px] text-stone-500"><span className="text-left">首购月份</span>{["当月", "第 1 月", "第 2 月", "第 3 月", "第 4 月", "第 5 月"].map((label) => <span key={label}>{label}</span>)}{SAMPLE_COHORTS.flatMap((values, row) => [<span key={`${months[row].key}-m`} className="flex items-center text-left font-medium text-stone-700">{months[row].key}</span>, ...Array.from({ length: 6 }, (_, index) => <div key={`${months[row].key}-${index}`} className={`flex h-10 items-center justify-center rounded-md text-xs font-medium ${values[index] == null ? "bg-stone-50 text-stone-500" : heatClass(values[index])}`}>{values[index] == null ? "" : `${values[index]}%`}</div>)])}</div></div></div></Card>;
}

function RenewalAnalysis() {
  return <Card title="续卡分析" subtitle="到期或用完后 14 天内续购（示例）"><div className="space-y-4">{SAMPLE_RENEWALS.map((item) => { const rate = Math.round((item.renewed / item.due) * 100); return <div key={item.name}><div className="mb-1.5 flex justify-between text-xs"><span>{item.name}</span><span className="tabular-nums text-stone-500">{rate}%（{item.renewed}/{item.due}）</span></div><div className="h-2 rounded-full bg-stone-100"><div className={`h-full rounded-full ${item.type === "group" ? "bg-emerald-700" : "bg-amber-600"}`} style={{ width: `${rate}%` }} /></div></div>; })}</div><div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="平均续卡间隔" value="3.6 天" /><MiniStat label="升级为更大卡包" value="2 人" /></div></Card>;
}

function RiskList({ members, filter, onFilter, reminded, onRemind, onAll }: { members: RiskMember[]; filter: "全部" | RiskStatus; onFilter: (value: "全部" | RiskStatus) => void; reminded: Record<string, boolean>; onRemind: (member: RiskMember) => void; onAll: () => void }) {
  const visible = members.filter((member) => filter === "全部" || member.status === filter);
  const options: Array<["全部" | RiskStatus, number]> = [
    ["全部", members.length],
    ["卡包有效", members.filter((member) => member.status === "卡包有效").length],
    ["已过期", members.filter((member) => member.status === "已过期").length],
  ];
  return <section className={`${cardClass} overflow-hidden`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4"><div><h3 className="text-base font-semibold">流失风险会员</h3><p className="mt-1 text-[12.5px] text-stone-500">有上课记录但超过 {AT_RISK_DAYS} 天未到访 · 按未到访天数排序</p></div><div className="flex rounded-lg bg-stone-100 p-1" role="group" aria-label="卡包状态筛选">{options.map(([label, count]) => <button key={label} onClick={() => onFilter(label)} aria-pressed={filter === label} className={`min-h-11 rounded-md px-3 text-xs sm:min-h-9 ${filter === label ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-600"}`}>{label} {count}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-stone-50 text-left text-[11px] uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-3 font-medium">会员</th><th className="px-4 font-medium">卡包</th><th className="px-4 font-medium">最近到访</th><th className="px-4 font-medium">卡包状态</th><th className="px-5 text-right font-medium">操作</th></tr></thead><tbody>{visible.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-500">暂无符合条件的会员</td></tr> : visible.map((member) => <tr key={member.id} className="border-t border-stone-100"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-600">{member.name[0]}</span><div><div className="font-medium">{member.name}</div><div className="text-xs text-stone-500">{member.phone}</div></div></div></td><td className="px-4"><div className="flex flex-wrap gap-1.5">{member.cards.length ? member.cards.map((card) => <span key={card.label} className={`rounded-full px-2 py-1 text-xs ${card.kind === "private" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{card.label}</span>) : <span className="text-xs text-stone-500">暂无有效卡包</span>}</div></td><td className="px-4 tabular-nums text-stone-600">{member.lastClass}<div className="text-xs text-stone-500">{member.daysSince} 天前</div></td><td className="px-4"><span className={member.status === "已过期" ? "inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-700" : "inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700"}>{member.status === "已过期" ? <AlertTriangle className="size-3" /> : <RefreshCw className="size-3" />}{member.status}</span></td><td className="px-5 text-right">{reminded[member.id] ? <span className="inline-flex min-h-11 items-center gap-1 text-xs text-emerald-700 sm:min-h-9"><Check className="size-3.5" />已提醒</span> : <button onClick={() => onRemind(member)} className="min-h-11 rounded-lg border border-stone-300 px-3 text-xs font-medium text-stone-700 hover:bg-stone-50 sm:min-h-9">提醒</button>}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 text-xs text-stone-500"><span>显示 {visible.length} / {members.length} 人</span><button onClick={onAll} className="min-h-11 text-xs font-medium text-emerald-700 hover:text-emerald-900">在会员页查看全部 <ArrowRight className="inline size-3" /></button></div></section>;
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) { return <section className={`${cardClass} p-5`}><div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2"><div><h3 className="text-base font-semibold">{title}</h3>{subtitle && <p className="mt-1 text-[12.5px] text-stone-500">{subtitle}</p>}</div>{action}</div><div>{children}</div></section>; }
function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; onClick: () => void } }) { return <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4"><div><h3 className="text-base font-semibold">{title}</h3>{subtitle && <p className="mt-1 text-[12.5px] text-stone-500">{subtitle}</p>}</div>{action && <button onClick={action.onClick} className="shrink-0 text-xs font-medium text-emerald-700 hover:text-emerald-900">{action.label} <ArrowRight className="inline size-3" /></button>}</div>; }
function FilterButton({ children }: { children: ReactNode }) { return <button className={buttonClass}>{children}<ChevronDown className="size-4 text-stone-500" /></button>; }
function Trend({ change }: { change: Change }) { const Arrow = change.up ? ArrowUpRight : ArrowDownRight; return <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium ${change.good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}><Arrow className="size-3" aria-hidden /><span className="sr-only">{change.up ? "增加" : "减少"}</span>{change.text}</span>; }
function Insight({ children }: { children: ReactNode }) { return <div className="mt-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><Lightbulb className="mt-0.5 size-4 shrink-0" />{children}</div>; }
function TypeTag({ type }: { type: string }) { return <span className={`rounded-full px-2 py-1 text-xs ${type === "私教" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{type}</span>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-stone-100 p-3"><div className="text-[11px] text-stone-500">{label}</div><div className="mt-1 text-lg font-semibold tabular-nums">{value}</div></div>; }
function Placeholder({ title }: { title: string }) { return <div className={`${cardClass} flex min-h-[360px] flex-col items-center justify-center p-8 text-center`}><UserRoundSearch className="size-9 text-stone-400" /><h2 className="mt-4 text-base font-semibold">{title}</h2><p className="mt-2 text-sm text-stone-500">该视图将在下一阶段接入，当前可查看经营总览与会员留存。</p></div>; }

const axisTick = { fill: "#78716C", fontSize: 11 };
type EndLabelProps = { x?: number; y?: number; index?: number; value?: number };
function EndLabel(props: EndLabelProps & { count: number }) { if (props.index !== props.count - 1) return <g />; return <text x={(props.x ?? 0) + 7} y={(props.y ?? 0) + 4} fill="#57534E" fontSize={10}>{((props.value ?? 0) / 10000).toFixed(2)}万</text>; }
function heatClass(value: number | null) { if (value == null) return "border border-dashed border-stone-300 bg-white text-stone-500"; if (value < 40) return "bg-[#ECFDF5] text-emerald-950"; if (value < 60) return "bg-[#A7F3D0] text-emerald-950"; if (value < 75) return "bg-[#6EE7B7] text-emerald-950"; if (value < 90) return "bg-[#047857] text-white"; return "bg-[#064E3B] text-white"; }

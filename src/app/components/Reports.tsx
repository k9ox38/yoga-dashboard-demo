import { useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BellRing, CalendarDays,
  ChevronDown, Download, Lightbulb, Mail, RefreshCw, Sparkles, UserRoundSearch,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

type TabId = "overview" | "courses" | "members" | "revenue" | "coaches";

const EMERALD = "#047857";
const AMBER = "#D97706";
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

const incomeData = [
  { month: "11月", cash: 32100, recognised: 30200 }, { month: "12月", cash: 29400, recognised: 28800 },
  { month: "1月", cash: 41800, recognised: 33500 }, { month: "2月", cash: 27600, recognised: 31000 },
  { month: "3月", cash: 35200, recognised: 33800 }, { month: "4月", cash: 38900, recognised: 35600 },
  { month: "5月", cash: 36400, recognised: 36900 }, { month: "6月", cash: 40700, recognised: 37800 },
  { month: "7月", cash: 43900, recognised: 39600 }, { month: "8月", cash: 39500, recognised: 38700 },
  { month: "9月", cash: 42900, recognised: 39500 }, { month: "10月", cash: 48300, recognised: 41900 },
];

const attendanceData = [
  { week: "9/8", attended: 128, absent: 9, cancelled: 14 }, { week: "9/15", attended: 134, absent: 7, cancelled: 12 },
  { week: "9/22", attended: 121, absent: 11, cancelled: 17 }, { week: "9/29", attended: 140, absent: 8, cancelled: 11 },
  { week: "10/6", attended: 152, absent: 10, cancelled: 15 }, { week: "10/13", attended: 147, absent: 9, cancelled: 13 },
  { week: "10/20", attended: 159, absent: 12, cancelled: 16 }, { week: "10/27", attended: 154, absent: 10, cancelled: 12 },
];

const heatmap = [
  { time: "07:00", values: [38, 52, 31, 49, 44, null, null] },
  { time: "09:30", values: [66, 58, 71, 62, 69, 92, 88] },
  { time: "12:15", values: [54, null, 61, null, 57, null, null] },
  { time: "18:30", values: [86, 91, 83, 94, 78, 74, 70] },
  { time: "20:00", values: [72, 79, 68, 81, 55, null, 63] },
];

const courses = [
  { name: "流瑜伽 Flow", meta: "吴安雅 · 晚间", type: "小班", sessions: 18, fill: 88, attendance: 94 },
  { name: "阴瑜伽 Yin", meta: "陈丽 · 晚间", type: "小班", sessions: 12, fill: 84, attendance: 95 },
  { name: "普拉提垫上", meta: "谭美 · 午间", type: "小班", sessions: 10, fill: 79, attendance: 92 },
  { name: "哈他基础", meta: "陈丽 · 上午", type: "小班", sessions: 16, fill: 62, attendance: 90 },
  { name: "晨间唤醒", meta: "吴安雅 · 07:00", type: "小班", sessions: 5, fill: 31, attendance: 86, low: true },
  { name: "私教 1 对 1", meta: "全体教练 · 灵活预约", type: "私教", sessions: 84, fill: null, attendance: 93 },
];

const visitData = [
  { range: "1 次", people: 38, share: "20%" }, { range: "2–3 次", people: 61, share: "33%" },
  { range: "4–7 次", people: 63, share: "34%" }, { range: "8 次以上", people: 24, share: "13%" },
];

const cohorts = [
  { month: "2026-05", count: 29, values: [100, 79, 69, 62, 59, 55] },
  { month: "2026-06", count: 33, values: [100, 82, 70, 64, 61] },
  { month: "2026-07", count: 41, values: [100, 76, 66, 60] },
  { month: "2026-08", count: 37, values: [100, 81, 73] },
  { month: "2026-09", count: 30, values: [100, 77] },
  { month: "2026-10", count: 34, values: [100] },
];

const riskMembers = [
  { name: "苏晴", phone: "135****1839", card: "月卡", last: "2026-09-11", status: "已过期", spend: 4280 },
  { name: "何静", phone: "133****4920", card: "季卡", last: "2026-09-18", status: "已过期", spend: 7160 },
  { name: "周宁", phone: "137****9052", card: "私教 10 节", last: "2026-09-21", status: "卡包有效", spend: 6400 },
  { name: "钱雅", phone: "139****5627", card: "月卡", last: "2026-09-26", status: "已过期", spend: 2720 },
  { name: "郑妍", phone: "189****7704", card: "私教 10 节", last: "2026-09-28", status: "卡包有效", spend: 3200 },
  { name: "邓欣", phone: "136****9018", card: "季卡", last: "2026-09-30", status: "已过期", spend: 5860 },
];

export function Reports() {
  const [tab, setTab] = useState<TabId>("overview");
  const [period, setPeriod] = useState("上月");
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "经营总览" }, { id: "courses", label: "课程与排课" },
    { id: "members", label: "会员与留存" }, { id: "revenue", label: "营收与财务" },
    { id: "coaches", label: "教练绩效" },
  ];
  return (
    <div className="min-h-full bg-stone-100 p-5 font-['Inter','PingFang_SC',sans-serif] text-stone-900 lg:p-7">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">数据报表</h1><span className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">示例数据</span></div><p className="mt-1.5 text-sm text-stone-600">2026 年 10 月 · 对比 2026 年 9 月 · 数据更新于 11-13 08:00</p></div>
          <div className="flex gap-2"><button className={buttonClass}><Mail className="size-4" />订阅月报</button><button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"><Download className="size-4" />导出报表</button></div>
        </header>
        <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3`}>
          <div className="flex flex-wrap rounded-lg bg-stone-100 p-1">{["本周", "本月", "上月", "本季度", "本年", "自定义"].map((item) => <button key={item} onClick={() => setPeriod(item)} className={`min-h-11 rounded-md px-3 text-xs font-medium sm:min-h-9 ${period === item ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>{item}</button>)}</div>
          <button className={buttonClass}><CalendarDays className="size-4" />2026-10-01 – 10-31</button>
          <FilterButton>对比&nbsp; 上一周期</FilterButton><FilterButton>课程类型&nbsp; 全部</FilterButton><FilterButton>教练&nbsp; 全部</FilterButton>
        </div>
        <div className="overflow-x-auto border-b border-stone-200"><div className="flex min-w-max gap-7">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`-mb-px min-h-11 border-b-2 text-sm font-medium ${tab === item.id ? "border-emerald-700 text-emerald-700" : "border-transparent text-stone-600 hover:text-stone-900"}`}>{item.label}</button>)}</div></div>
        {tab === "overview" && <OverviewTab onMembers={() => setTab("members")} />}
        {tab === "members" && <MembersTab />}
        {tab !== "overview" && tab !== "members" && <Placeholder title={tabs.find((item) => item.id === tab)?.label ?? ""} />}
      </div>
    </div>
  );
}

function OverviewTab({ onMembers }: { onMembers: () => void }) {
  const kpis = [
    { label: "现金收入", value: "¥48,260", change: "12.4%", previous: "上月 ¥42,930", values: [32,29,42,28,35,39,36,41,44,40,43,48] },
    { label: "消课确认收入", value: "¥41,930", change: "6.1%", previous: "上月 ¥39,520", values: [30,29,34,31,34,36,37,38,40,39,40,42] },
    { label: "出勤人次", value: "612", change: "8.3%", previous: "上月 565", values: [480,495,510,506,530,542,551,560,578,584,565,612] },
    { label: "小班课满班率", value: "72%", change: "4pt", previous: "上月 68%", values: [61,63,65,62,66,67,68,69,71,70,68,72] },
    { label: "活跃会员", value: "186", change: "5.1%", previous: "上月 177", values: [142,149,153,158,160,164,168,171,173,175,177,186] },
    { label: "续卡率", value: "64%", change: "3pt", previous: "上月 67%", values: [59,61,62,65,66,64,68,69,66,68,67,64], bad: true },
  ];
  return <div className="space-y-5">
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(168px,1fr))]">{kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
      <Card title="收入趋势" subtitle="近 12 个月 · 单位：万元">
        <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={incomeData} margin={{ top: 12, right: 42, left: 8, bottom: 0 }}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} /><YAxis domain={[0,60000]} ticks={[0,20000,40000,60000]} tickFormatter={(value) => value === 0 ? "0" : `${value / 10000}万`} tick={axisTick} axisLine={false} tickLine={false} width={42} /><Tooltip {...tooltipProps} formatter={(value) => [`¥${Number(value).toLocaleString()}`, ""]} /><Legend verticalAlign="top" align="left" height={32} iconType="line" /><Line type="monotone" dataKey="cash" name="现金收入" stroke={EMERALD} strokeWidth={2} dot={false} activeDot={{ r: 4 }} label={EndLabel} /><Line type="monotone" dataKey="recognised" name="消课确认收入" stroke={SKY} strokeWidth={2} dot={false} activeDot={{ r: 4 }} label={EndLabel} /></LineChart></ResponsiveContainer></div>
        <Insight>现金收入持续高于消课确认收入，差额沉淀为预收余额 —— 10 月净增预收 ¥6,330。</Insight>
      </Card>
      <RevenueComposition />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="预约与出勤" subtitle="最近 8 周"><div className="-mt-10 mb-4 flex justify-end gap-4 text-xs text-stone-600"><span>出勤率 <b className="text-stone-900">93.7%</b></span><span>取消率 <b className="text-stone-900">7.9%</b></span></div><div className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={attendanceData}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} /><Tooltip {...tooltipProps} /><Legend verticalAlign="top" align="left" height={32} /><Bar dataKey="attended" stackId="a" name="出勤" fill={EMERALD} stroke="#fff" strokeWidth={1} /><Bar dataKey="absent" stackId="a" name="缺席" fill={SKY} stroke="#fff" strokeWidth={1} /><Bar dataKey="cancelled" stackId="a" name="取消" fill={NEUTRAL} stroke="#fff" strokeWidth={1} radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></Card>
      <Heatmap />
    </div>
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]"><CourseTable /><Alerts onMembers={onMembers} /></div>
    <MetricDefinitions />
  </div>;
}

function MembersTab() {
  const [riskFilter, setRiskFilter] = useState("全部");
  const kpis = [
    { label: "新增会员", value: "34", change: "13.3%", previous: "上月 30", values: [18,20,22,21,24,26,25,27,29,31,30,34] },
    { label: "活跃会员", value: "186", change: "5.1%", previous: "上月 177", values: [142,149,153,158,160,164,168,171,173,175,177,186] },
    { label: "人均月到访", value: "3.3 次", change: "0.2", previous: "上月 3.1 次", values: [2.5,2.7,2.8,2.9,2.8,3,3.1,3.1,3.2,3.2,3.1,3.3] },
    { label: "续卡率", value: "64%", change: "3pt", previous: "上月 67%", values: [59,61,62,65,66,64,68,69,66,68,67,64], bad: true },
    { label: "流失风险会员", value: "23 人", change: "4 人", previous: "上月 19 人", values: [14,15,16,15,17,18,17,19,20,18,19,23], bad: true, rising: true },
    { label: "人均累计消费", value: "¥2,860", change: "2.4%", previous: "上月 ¥2,793", values: [2380,2420,2480,2520,2580,2630,2670,2710,2750,2780,2793,2860] },
  ];
  return <div className="space-y-5">
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(168px,1fr))]">{kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}</div>
    <div className="grid gap-5 xl:grid-cols-2"><ConversionFunnel /><VisitDistribution /></div>
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]"><CohortMatrix /><RenewalAnalysis /></div>
    <RiskList filter={riskFilter} onFilter={setRiskFilter} />
  </div>;
}

function KpiCard({ label, value, change, previous, values, bad, rising }: { label: string; value: string; change: string; previous: string; values: number[]; bad?: boolean; rising?: boolean }) {
  const data = values.map((v, index) => ({ index, v }));
  return <div className={`${cardClass} min-w-0 p-4`}><div className="text-xs font-medium text-stone-600">{label}</div><div className="mt-2 flex flex-wrap items-center gap-2"><div className="text-[26px] font-semibold leading-none tabular-nums tracking-tight">{value}</div><Trend bad={bad} rising={rising}>{change}</Trend></div><div className="mt-2 text-xs tabular-nums text-stone-500">{previous}</div><div className="mt-3 h-9"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><Tooltip contentStyle={{ border: `1px solid ${GRID}`, borderRadius: 6, fontSize: 11 }} labelFormatter={() => ""} formatter={(tooltipValue) => [tooltipValue, label]} /><Line type="monotone" dataKey="v" stroke={EMERALD} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div></div>;
}

function RevenueComposition() {
  const products = [
    { name: "小班课·月卡（30 天）", amount: 16800, orders: 28, type: "group" },
    { name: "私教·10 节课包", amount: 12600, orders: 7, type: "private" },
    { name: "小班课·季卡（90 天）", amount: 9960, orders: 6, type: "group" },
    { name: "私教·20 节课包", amount: 9600, orders: 3, type: "private" },
  ];
  return <Card title="收入构成" subtitle="按产品 · 已支付订单 · 共 44 单，退款 ¥700"><div className="flex h-3 overflow-hidden rounded-full"><div className="bg-emerald-700" style={{ width: "55%" }} /><div className="bg-amber-600" style={{ width: "45%" }} /></div><div className="mt-2 flex justify-between text-xs text-stone-600"><span>小班课 ¥26,760 · 55%</span><span>私教 ¥22,200 · 45%</span></div><div className="mt-5 space-y-4">{products.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate text-stone-700">{item.name}</span><span className="shrink-0 tabular-nums text-stone-600">¥{item.amount.toLocaleString()} · {item.orders} 单</span></div><div className="h-1.5 rounded-full bg-stone-100"><div className={`h-full rounded-full ${item.type === "group" ? "bg-emerald-700" : "bg-amber-600"}`} style={{ width: `${item.amount / 168}%` }} /></div></div>)}</div><div className="mt-5 border-t border-stone-100 pt-4 text-xs text-stone-600">支付渠道：微信支付 84% · 现金 9% · 银行卡 7%</div><div className="mt-4 rounded-lg bg-stone-100 p-3 text-xs leading-5 text-stone-600"><b className="text-stone-900">预收余额（未消课）¥63,400</b> — 私教剩余 214 节 · 有效小班卡 96 张</div></Card>;
}

function Heatmap() {
  const days = ["周一","周二","周三","周四","周五","周六","周日"];
  return <Card title="小班课时段热力图" subtitle="平均满班率 · 按上课时段"><div className="overflow-x-auto"><div className="min-w-[560px]"><div className="grid grid-cols-[58px_repeat(7,1fr)] gap-1.5 text-center text-[11px] text-stone-500"><span />{days.map((day) => <span key={day}>{day}</span>)}{heatmap.flatMap((row) => [<span key={`${row.time}-label`} className="flex items-center text-left tabular-nums">{row.time}</span>, ...row.values.map((value, index) => <div key={`${row.time}-${index}`} className={`flex h-10 items-center justify-center rounded-md text-xs font-medium ${heatClass(value)}`}>{value == null ? "—" : `${value}%`}</div>)])}</div></div></div><div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">{["<40","40–60","60–75","75–90","≥90%"].map((label,index) => <span key={label} className="flex items-center gap-1"><i className="size-3 rounded-sm" style={{ background: ["#ECFDF5","#A7F3D0","#6EE7B7","#047857","#064E3B"][index] }} />{label}</span>)}<span className="flex items-center gap-1"><i className="size-3 rounded-sm border border-dashed border-stone-300" />未排课</span></div><Insight>工作日 18:30 档平均满班 86%，可考虑加开；07:00 档平均仅 43%，周三最低。</Insight></Card>;
}

function CourseTable() {
  return <section className={`${cardClass} overflow-hidden`}><CardHeader title="课程表现" subtitle="按区间排课与实际出勤汇总" action="查看全部课程" /><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-stone-50 text-left text-[11px] uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-3 font-medium">课程</th><th className="px-4 font-medium">类型</th><th className="px-4 text-right font-medium">节数</th><th className="w-48 px-4 font-medium">满班率</th><th className="px-5 text-right font-medium">出勤率</th></tr></thead><tbody>{courses.map((course) => <tr key={course.name} className="border-t border-stone-100"><td className="px-5 py-3"><div className="font-medium text-stone-900">{course.name}</div><div className="mt-0.5 text-xs text-stone-500">{course.meta}</div></td><td className="px-4"><TypeTag type={course.type} /></td><td className="px-4 text-right tabular-nums text-stone-700">{course.sessions}</td><td className="px-4">{course.fill == null ? <span className="text-xs text-stone-500">1 对 1，不计满班率</span> : <div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-stone-100"><div className={course.low ? "h-full rounded-full bg-rose-600" : "h-full rounded-full bg-emerald-700"} style={{ width: `${course.fill}%` }} /></div><span className="w-9 tabular-nums text-stone-700">{course.fill}%</span>{course.low && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700">偏低</span>}</div>}</td><td className="px-5 text-right tabular-nums">{course.attendance}%</td></tr>)}</tbody></table></div></section>;
}

function Alerts({ onMembers }: { onMembers: () => void }) {
  const alerts = [
    { kind: "预警", title: "周三 07:00「晨间唤醒」满班率 31%", detail: "连续 4 周低于 40%", action: "调整排课" },
    { kind: "预警", title: "23 位会员超过 30 天未到访", detail: "其中 9 位卡包仍有效", action: "查看名单", click: onMembers },
    { kind: "机会", title: "9 位私教学员剩余 ≤ 3 节", detail: "预计续费机会 ¥28,800", action: "续费跟进" },
    { kind: "预警", title: "私教缺席率升至 6.8%", detail: "上月为 3.1%", action: "查看明细" },
    { kind: "待办", title: "5 笔微信流水待对账", detail: "合计 ¥3,420", action: "去对账" },
  ];
  return <section className={`${cardClass} overflow-hidden`}><CardHeader title="需要关注" subtitle="根据本期数据自动生成" /><div>{alerts.map((item) => <div key={item.title} className="flex gap-3 border-t border-stone-100 px-5 py-3 first:border-0"><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${item.kind === "机会" ? "bg-emerald-50 text-emerald-700" : item.kind === "待办" ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"}`}>{item.kind === "机会" ? <Sparkles className="size-4" /> : item.kind === "待办" ? <BellRing className="size-4" /> : <AlertTriangle className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={`rounded px-1.5 py-0.5 text-[10px] ${item.kind === "机会" ? "bg-emerald-50 text-emerald-700" : item.kind === "待办" ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"}`}>{item.kind}</span><span className="truncate text-xs font-medium">{item.title}</span></div><div className="mt-1 text-xs text-stone-500">{item.detail}</div></div><button onClick={item.click} className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium text-emerald-700 hover:text-emerald-900">{item.action}</button></div>)}</div></section>;
}

function MetricDefinitions() {
  const metrics = [["现金收入","已支付订单实付 − 退款"],["消课确认收入","出勤课时 × 课包单价，月卡按天摊销"],["满班率","小班课出勤人次 ÷ 排课总容量"],["出勤率","出勤 ÷（出勤 + 缺席），取消不计入"],["活跃会员","区间内至少出勤 1 次"],["续卡率","区间内到期/用完的卡包中，14 天内续购的比例"]];
  return <section className={`${cardClass} p-5`}><h3 className="text-base font-semibold">指标口径</h3><div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">{metrics.map(([name,detail]) => <div key={name} className="text-xs leading-5"><b className="text-stone-700">{name}</b><span className="text-stone-500"> = {detail}</span></div>)}</div></section>;
}

function ConversionFunnel() {
  const items = [{ label:"小程序注册",value:58,rate:"100%"},{label:"首次购卡",value:34,rate:"59%"},{label:"首次上课",value:31,rate:"91%"},{label:"首月上课 ≥ 3 次",value:19,rate:"61%"}];
  return <Card title="新会员转化漏斗" subtitle="从注册到形成稳定到访"><div className="space-y-4">{items.map((item,index) => <div key={item.label} className="grid grid-cols-[110px_1fr_68px] items-center gap-3"><span className="text-xs text-stone-600">{item.label}</span><div className="h-8 rounded-md bg-stone-100"><div className="flex h-full items-center rounded-md bg-emerald-700 px-3 text-xs text-white" style={{ width: `${Math.max(34,item.value / 58 * 100)}%` }}>{item.value} 人</div></div><span className="text-right text-xs tabular-nums text-stone-500">{index ? item.rate : "基准"}</span></div>)}</div><Insight>34 位新会员中 11 位来自老会员推荐（32%）。</Insight></Card>;
}

function VisitDistribution() {
  return <Card title="到访频次分布" subtitle="本期活跃会员 · 人均到访 3.3 次"><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={visitData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey="range" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} /><Tooltip {...tooltipProps} formatter={(value) => [`${value} 人`, "会员"]} /><Bar dataKey="people" name="会员人数" fill={EMERALD} radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div><div className="grid grid-cols-4 text-center text-xs text-stone-500">{visitData.map((item) => <span key={item.range}>{item.share}</span>)}</div></Card>;
}

function CohortMatrix() {
  return <Card title="留存矩阵" subtitle="按首次购卡月份 · 后续月份仍有到访"><div className="overflow-x-auto"><div className="min-w-[690px]"><div className="grid grid-cols-[110px_70px_repeat(6,1fr)] gap-1.5 text-center text-[11px] text-stone-500"><span className="text-left">首购月份</span><span>人数</span>{["当月","第 1 月","第 2 月","第 3 月","第 4 月","第 5 月"].map((label) => <span key={label}>{label}</span>)}{cohorts.flatMap((row) => [<span key={`${row.month}-m`} className="flex items-center text-left font-medium text-stone-700">{row.month}</span>,<span key={`${row.month}-c`} className="flex items-center justify-center tabular-nums">{row.count}</span>,...Array.from({length:6},(_,index) => <div key={`${row.month}-${index}`} className={`flex h-10 items-center justify-center rounded-md text-xs font-medium ${row.values[index] == null ? "bg-stone-50 text-stone-500" : heatClass(row.values[index])}`}>{row.values[index] == null ? "" : `${row.values[index]}%`}</div>)])}</div></div></div></Card>;
}

function RenewalAnalysis() {
  const items = [{name:"小班课·月卡",rate:64,count:"27/42",type:"group"},{name:"小班课·季卡",rate:75,count:"6/8",type:"group"},{name:"私教·10 节",rate:58,count:"7/12",type:"private"},{name:"私教·20 节",rate:50,count:"2/4",type:"private"}];
  return <Card title="续卡分析" subtitle="到期或用完后 14 天内续购"><div className="space-y-4">{items.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between text-xs"><span>{item.name}</span><span className="tabular-nums text-stone-500">{item.rate}%（{item.count}）</span></div><div className="h-2 rounded-full bg-stone-100"><div className={`h-full rounded-full ${item.type === "group" ? "bg-emerald-700" : "bg-amber-600"}`} style={{width:`${item.rate}%`}} /></div></div>)}</div><div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="平均续卡间隔" value="3.6 天" /><MiniStat label="升级为更大卡包" value="6 人" /></div></Card>;
}

function RiskList({ filter, onFilter }: { filter: string; onFilter: (value: string) => void }) {
  const visible = riskMembers.filter((member) => filter === "全部" || member.status === filter);
  return <section className={`${cardClass} overflow-hidden`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4"><div><h3 className="text-base font-semibold">流失风险会员</h3><p className="mt-1 text-[12.5px] text-stone-500">超过 30 天未到访</p></div><div className="flex rounded-lg bg-stone-100 p-1">{[["全部","23"],["卡包有效","9"],["已过期","14"]].map(([label,count]) => <button key={label} onClick={() => onFilter(label)} className={`min-h-11 rounded-md px-3 text-xs sm:min-h-9 ${filter === label ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-600"}`}>{label} {count}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-stone-50 text-left text-[11px] uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-3 font-medium">会员</th><th className="px-4 font-medium">卡包</th><th className="px-4 font-medium">最近到访</th><th className="px-4 font-medium">卡包状态</th><th className="px-4 text-right font-medium">累计消费</th><th className="px-5 text-right font-medium">操作</th></tr></thead><tbody>{visible.map((member) => <tr key={member.name} className="border-t border-stone-100"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-600">{member.name[0]}</span><div><div className="font-medium">{member.name}</div><div className="text-xs text-stone-500">{member.phone}</div></div></div></td><td className="px-4"><span className={`rounded-full px-2 py-1 text-xs ${member.card.includes("私教") ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{member.card}</span></td><td className="px-4 tabular-nums text-stone-600">{member.last}</td><td className="px-4"><span className={member.status === "已过期" ? "inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-700" : "inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700"}>{member.status === "已过期" ? <AlertTriangle className="size-3" /> : <RefreshCw className="size-3" />}{member.status}</span></td><td className="px-4 text-right tabular-nums">¥{member.spend.toLocaleString()}</td><td className="px-5 text-right"><button className="min-h-11 rounded-lg border border-stone-300 px-3 text-xs font-medium text-stone-700 hover:bg-stone-50 sm:min-h-9">提醒</button></td></tr>)}</tbody></table></div><div className="flex justify-between border-t border-stone-100 px-5 py-3 text-xs text-stone-500"><span>显示 {visible.length} / 23 人</span><button className="min-h-11 font-medium text-emerald-700">在会员页查看全部 <ArrowRight className="inline size-3" /></button></div></section>;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) { return <section className={`${cardClass} p-5`}><CardHeader title={title} subtitle={subtitle} plain /><div>{children}</div></section>; }
function CardHeader({ title, subtitle, action, plain }: { title: string; subtitle?: string; action?: string; plain?: boolean }) { return <div className={`flex items-start justify-between gap-4 ${plain ? "mb-4" : "border-b border-stone-100 px-5 py-4"}`}><div><h3 className="text-base font-semibold">{title}</h3>{subtitle && <p className="mt-1 text-[12.5px] text-stone-500">{subtitle}</p>}</div>{action && <button className="text-xs font-medium text-emerald-700">{action} <ArrowRight className="inline size-3" /></button>}</div>; }
function FilterButton({ children }: { children: ReactNode }) { return <button className={buttonClass}>{children}<ChevronDown className="size-4 text-stone-500" /></button>; }
function Trend({ children, bad, rising }: { children: ReactNode; bad?: boolean; rising?: boolean }) { const negative = bad; return <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium ${negative ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{negative && !rising ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}{children}</span>; }
function Insight({ children }: { children: ReactNode }) { return <div className="mt-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><Lightbulb className="mt-0.5 size-4 shrink-0" />{children}</div>; }
function TypeTag({ type }: { type: string }) { return <span className={`rounded-full px-2 py-1 text-xs ${type === "私教" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{type}</span>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-stone-100 p-3"><div className="text-[11px] text-stone-500">{label}</div><div className="mt-1 text-lg font-semibold tabular-nums">{value}</div></div>; }
function Placeholder({ title }: { title: string }) { return <div className={`${cardClass} flex min-h-[360px] flex-col items-center justify-center p-8 text-center`}><UserRoundSearch className="size-9 text-stone-400" /><h2 className="mt-4 text-base font-semibold">{title}</h2><p className="mt-2 text-sm text-stone-500">该视图将在下一阶段接入，当前可查看经营总览与会员留存。</p></div>; }

const axisTick = { fill: "#78716C", fontSize: 11 };
function EndLabel(props: { x?: number; y?: number; index?: number; value?: number }) { if (props.index !== incomeData.length - 1) return <g />; return <text x={(props.x ?? 0) + 7} y={(props.y ?? 0) + 4} fill="#57534E" fontSize={10}>{((props.value ?? 0) / 10000).toFixed(1)}万</text>; }
function heatClass(value: number | null) { if (value == null) return "border border-dashed border-stone-300 bg-white text-stone-500"; if (value < 40) return "bg-[#ECFDF5] text-emerald-950"; if (value < 60) return "bg-[#A7F3D0] text-emerald-950"; if (value < 75) return "bg-[#6EE7B7] text-emerald-950"; if (value < 90) return "bg-[#047857] text-white"; return "bg-[#064E3B] text-white"; }

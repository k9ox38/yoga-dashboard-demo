import { TrendingUp, Users, CalendarCheck, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { weeklyBookings } from "./data";
import { useStore } from "../store-context";
import { localDate } from "../lib/dates";
import { difficultyLabel } from "../lib/difficulty";
import { computeMonthlyStatus } from "../lib/cardStatus";
import { buildMonthlyRevenue, currentMonthPaidRevenue, demoOrders } from "../lib/demoCommerce";
import { AT_RISK_DAYS, atRiskMembers, recentlyActiveMembers } from "../lib/reportMetrics";


function StatCard({ label, value, delta, up = true, icon: Icon, accent, period = "较上周" }: { label: string; value: string; delta?: string; up?: boolean; icon: React.ComponentType<{ className?: string }>; accent: string; period?: string }) {
  return (
    <div className="min-w-0 bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-sm text-stone-500">{label}</span>
        <div className={`size-8 shrink-0 rounded-lg flex items-center justify-center sm:size-9 ${accent}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="mt-3 text-stone-900 text-2xl">{value}</div>
      {delta ? (
        <div className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-emerald-600" : "text-rose-600"}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta} {period}
        </div>
      ) : (
        <div className="mt-1 text-xs text-stone-500">{period}</div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { sessions, templates, members, reservations, packages } = useStore();
  const navigate = useNavigate();
  const tplById = (id: string) => templates.find((t) => t.id === id);
  const todayKey = localDate();
  const todays = sessions
    .filter((session) => session.date === todayKey && session.isVisible)
    .sort((a, b) => a.start.localeCompare(b.start));
  const todayReservations = reservations.filter((reservation) => reservation.date === todayKey && reservation.status !== "已取消");
  const statusOf = (member: typeof members[number]) => computeMonthlyStatus(member, todayKey);
  const activeMembers = members.filter((member) => {
    const status = statusOf(member);
    return status === "有效" || status === "即将到期" || status === "待激活" || member.privateRemaining > 0;
  });
  const recentlyActive = recentlyActiveMembers(members, todayKey);
  const atRisk = atRiskMembers(members, packages, todayKey);
  const monthlyRevenue = buildMonthlyRevenue(demoOrders);
  const monthRevenue = currentMonthPaidRevenue(demoOrders);
  const expiringMembers = members.flatMap((member) => {
    const items: Array<{ name: string; type: string; category: "小班课" | "私教"; expires: string; days: number; remaining?: number }> = [];
    if (member.expiry) {
      const days = Math.ceil((new Date(`${member.expiry}T12:00:00`).getTime() - new Date(`${todayKey}T12:00:00`).getTime()) / 86400000);
      if (days >= 0 && days <= 14) items.push({ name: member.name, type: "月卡", category: "小班课", expires: member.expiry, days });
    }
    if (member.privateRemaining > 0 && member.privateRemaining <= 2) items.push({ name: member.name, type: "私教课时包", category: "私教", expires: "", days: 0, remaining: member.privateRemaining });
    return items;
  });
  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="今日预约" value={String(todayReservations.length)} icon={CalendarCheck} accent="bg-emerald-500" period={`今日 ${todays.length} 节课`} />
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">活跃会员</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal-500">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3 text-stone-900 text-2xl">{activeMembers.length}</div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-400">
            <span>小班课 <span className="text-stone-600">{members.filter((member) => { const s = statusOf(member); return s === "有效" || s === "即将到期" || s === "待激活"; }).length}</span></span>
            <span className="text-stone-200">·</span>
            <span>私教 <span className="text-stone-600">{members.filter((member) => member.privateRemaining > 0).length}</span></span>
          </div>
        </div>
        <StatCard label={`近 ${AT_RISK_DAYS} 天到访会员`} value={String(recentlyActive.length)} icon={TrendingUp} accent="bg-lime-500" period={`共 ${members.length} 位 · ${atRisk.length} 人超 ${AT_RISK_DAYS} 天未到访`} />
        <StatCard label="本月营收" value={`¥${monthRevenue.toLocaleString()}`} icon={DollarSign} accent="bg-amber-500" period="已支付订单 · 本月至今" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-stone-900">本周预约</div>
              <div className="text-xs text-stone-500">预约数与签到数对比</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 预约</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-700" /> 签到</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyBookings}>
                <defs key="defs">
                  <linearGradient id="dash-g1" x1="0" y1="0" x2="0" y2="1">
                    <stop key="s1a" offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop key="s1b" offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dash-g2" x1="0" y1="0" x2="0" y2="1">
                    <stop key="s2a" offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
                    <stop key="s2b" offset="100%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f4" />
                <XAxis key="x" dataKey="day" stroke="#94a3a0" fontSize={12} />
                <YAxis key="y" stroke="#94a3a0" fontSize={12} />
                <Tooltip key="tip" contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }} />
                <Area key="bookings" type="monotone" dataKey="bookings" name="预约" stroke="#10b981" fill="url(#dash-g1)" strokeWidth={2} />
                <Area key="attended" type="monotone" dataKey="attended" name="签到" stroke="#0f766e" fill="url(#dash-g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-stone-200 p-5">
          <div className="text-stone-900">营收趋势</div>
          <div className="text-xs text-stone-500 mb-3">近 6 个月（¥）</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f4" />
                <XAxis key="x" dataKey="month" stroke="#94a3a0" fontSize={12} />
                <YAxis key="y" stroke="#94a3a0" fontSize={12} />
                <Tooltip key="tip" contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }} />
                <Bar key="revenue" dataKey="revenue" name="营收" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-stone-900">今日课程</div>
              <div className="text-xs text-stone-500">实时预约情况</div>
            </div>
            <button onClick={() => navigate("/schedule")} className="text-xs text-emerald-700 hover:underline">查看全部</button>
          </div>
          <div className="space-y-3">
            {todays.length === 0 && (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
                今日暂无排课
              </div>
            )}
            {todays.map((s) => {
              const t = tplById(s.classId);
              const cap = t?.capacity ?? 0;
              const booked = s.booked;
              const pct = cap ? Math.round((booked / cap) * 100) : 0;
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 rounded-lg border border-stone-200 hover:border-emerald-300 transition-colors">
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-stone-900 text-sm">{s.start}</div>
                    <div className="text-xs text-stone-400">{s.end}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 truncate text-stone-900 text-sm">{t?.name ?? "未关联课程"}</div>
                      {t && (
                        <span className={`shrink-0 whitespace-nowrap text-xs px-1.5 py-0.5 rounded ${t.format === "私教" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {t.format}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-stone-500">{s.instructor} · {s.room} · {difficultyLabel(s.difficulty)}</div>
                  </div>
                  <div className="w-full sm:w-40 sm:shrink-0">
                    <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                      <span>{booked}/{cap}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-stone-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-stone-900">会员卡即将到期</div>
              <div className="text-xs text-stone-500">未来 14 天内到期</div>
            </div>
            <button onClick={() => navigate("/members")} className="text-xs text-emerald-700 hover:underline">查看全部</button>
          </div>
          {(() => {
            const groups = [
              { label: "小班课", items: expiringMembers.filter(m => m.category === "小班课") },
              { label: "私教",   items: expiringMembers.filter(m => m.category === "私教")   },
            ];
            return (
              <div className="space-y-3 flex-1">
                {groups.map((g, gi) => (
                  <div key={g.label}>
                    <div className={`flex items-center gap-2 mb-1.5 ${gi > 0 ? "pt-2 border-t border-stone-100" : ""}`}>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${g.label === "小班课" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {g.label}
                      </span>
                      <span className="text-xs text-stone-400">{g.items.length} 人</span>
                    </div>
                    <div className="space-y-1">
                      {g.items.map((m) => (
                        <div key={m.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 text-stone-600 text-xs flex items-center justify-center shrink-0">
                            {m.name.slice(0, 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-stone-900">{m.name}</div>
                            <div className="text-xs text-stone-400">
                              {m.category === "私教" ? `${m.type} · 剩余 ${m.remaining} 课时` : `${m.type} · 到期 ${m.expires}`}
                            </div>
                          </div>
                          {m.category === "私教" ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                              m.remaining === 1 ? "bg-rose-50 text-rose-600"
                              : m.remaining === 2 ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-500"
                            }`}>
                              剩余 {m.remaining} 课时
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                              m.days <= 3  ? "bg-rose-50 text-rose-600"
                              : m.days <= 7 ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-500"
                            }`}>
                              {m.days} 天后
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

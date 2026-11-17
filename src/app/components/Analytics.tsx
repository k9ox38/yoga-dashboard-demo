import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { weeklyBookings, monthlyRevenue } from "./data";

const retention = [
  { month: "11月", new: 82, returning: 612 },
  { month: "12月", new: 95, returning: 658 },
  { month: "1月", new: 121, returning: 701 },
  { month: "2月", new: 88, returning: 742 },
  { month: "3月", new: 104, returning: 788 },
  { month: "4月", new: 64, returning: 812 },
];

export function Analytics() {
  return (
    <div className="p-8 grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="text-stone-900">本周预约与签到</div>
        <div className="text-xs text-stone-500 mb-3">近 7 天</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyBookings}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f4" />
              <XAxis key="x" dataKey="day" stroke="#94a3a0" fontSize={12} />
              <YAxis key="y" stroke="#94a3a0" fontSize={12} />
              <Tooltip key="tip" contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }} />
              <Legend key="legend" />
              <Line key="bookings" type="monotone" dataKey="bookings" name="预约" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line key="attended" type="monotone" dataKey="attended" name="签到" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="text-stone-900">会员留存</div>
        <div className="text-xs text-stone-500 mb-3">新会员 vs 老会员</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={retention}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f4" />
              <XAxis key="x" dataKey="month" stroke="#94a3a0" fontSize={12} />
              <YAxis key="y" stroke="#94a3a0" fontSize={12} />
              <Tooltip key="tip" contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }} />
              <Legend key="legend" />
              <Bar key="returning" dataKey="returning" name="老会员" fill="#0f766e" radius={[6, 6, 0, 0]} />
              <Bar key="new" dataKey="new" name="新会员" fill="#86efac" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-2 bg-white rounded-xl border border-stone-200 p-5">
        <div className="text-stone-900">月度营收</div>
        <div className="text-xs text-stone-500 mb-3">会员卡 + 单次课(¥)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f4" />
              <XAxis key="x" dataKey="month" stroke="#94a3a0" fontSize={12} />
              <YAxis key="y" stroke="#94a3a0" fontSize={12} />
              <Tooltip key="tip" contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4" }} />
              <Bar key="revenue" dataKey="revenue" name="营收" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

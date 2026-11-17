import { useState } from "react";
import { Camera, Mail, Phone, Shield, Clock, Key, LogOut, Check } from "lucide-react";

type Tab = "info" | "security" | "preferences";

export function ProfilePage() {
  const [tab, setTab] = useState<Tab>("info");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="p-8 max-w-4xl space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
        <div className="px-6 pb-6 -mt-12 flex items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 ring-4 ring-white flex items-center justify-center text-white text-2xl">
              林
            </div>
            <button className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 pb-2">
            <div className="text-stone-900 text-lg">林梅</div>
            <div className="text-sm text-stone-500 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                <Shield className="w-3 h-3" /> 超级管理员
              </span>
              <span>馆长 · 瑜伽管理演示</span>
            </div>
          </div>
          <button className="h-9 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm flex items-center gap-1.5 text-stone-700">
            <LogOut className="w-4 h-4" /> 退出登录
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200">
        <div className="border-b border-stone-200 px-4 pt-3 flex items-center gap-1">
          {([
            { k: "info", label: "基本信息" },
            { k: "security", label: "账号与安全" },
            { k: "preferences", label: "偏好设置" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 h-9 text-sm rounded-t-lg border-b-2 -mb-px transition-colors ${
                tab === t.k
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {tab === "info" && <InfoTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "preferences" && <PreferencesTab />}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-xl">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 mr-2">
              <Check className="w-4 h-4" /> 已保存
            </span>
          )}
          <button className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
          <button onClick={handleSave} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
            保存修改
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="text-stone-900">最近登录</div>
        <div className="text-xs text-stone-500 mb-3">仅显示最近 5 次成功登录</div>
        <ul className="divide-y divide-stone-100">
          {[
            { time: "2026-04-30 08:12", ip: "上海 · 218.83.x.x", device: "MacBook · Chrome 124" },
            { time: "2026-04-29 19:54", ip: "上海 · 218.83.x.x", device: "iPhone · Safari" },
            { time: "2026-04-28 09:03", ip: "上海 · 218.83.x.x", device: "MacBook · Chrome 124" },
          ].map((l) => (
            <li key={l.time} className="py-2.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {l.time}
              </div>
              <div className="text-xs text-stone-500">{l.device} · {l.ip}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfoTab() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="姓名" value="林梅" />
        <Field label="昵称" value="Linda" />
        <Field label="邮箱" value="admin@example.com" icon={Mail} />
        <Field label="手机号" value="138****0099" icon={Phone} />
        <Field label="角色" value="超级管理员" disabled />
        <Field label="员工编号" value="YS-A001" disabled />
      </div>
      <Field label="个人简介" textarea value="瑜伽行业从业 12 年,持 RYT500 认证,擅长哈他与阴瑜伽。" />
    </>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-200 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Key className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-stone-900">登录密码</div>
          <div className="text-xs text-stone-500">上次更新于 2026-02-14。建议每 90 天更换一次。</div>
        </div>
        <button className="h-8 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm">修改</button>
      </div>

      <div className="rounded-lg border border-stone-200 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-stone-900">两步验证</div>
          <div className="text-xs text-stone-500">已启用 · 通过短信验证码登录。</div>
        </div>
        <button className="h-8 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm">管理</button>
      </div>

      <div className="rounded-lg border border-stone-200 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-stone-900">微信绑定</div>
          <div className="text-xs text-stone-500">已绑定 · linda_yoga</div>
        </div>
        <button className="h-8 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm">解绑</button>
      </div>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-3">
      <Toggle label="新预约通知" desc="会员预约课程时通过邮件通知。" defaultOn />
      <Toggle label="取消预约通知" desc="会员取消预约时即时提醒。" defaultOn />
      <Toggle label="日报推送" desc="每天 21:00 推送当日经营摘要。" />
      <Toggle label="周报邮件" desc="每周一 09:00 推送上周数据周报。" defaultOn />

      <div className="grid grid-cols-2 gap-4 pt-2">
        <Select label="界面语言" value="简体中文" options={["简体中文", "English"]} />
        <Select label="时区" value="Asia/Shanghai (UTC+8)" options={["Asia/Shanghai (UTC+8)", "Asia/Hong_Kong (UTC+8)", "Asia/Singapore (UTC+8)"]} />
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon, disabled, textarea }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; disabled?: boolean; textarea?: boolean }) {
  return (
    <label className={`block ${textarea ? "col-span-2" : ""}`}>
      <span className="text-xs text-stone-600">{label}</span>
      <div className="mt-1 relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />}
        {textarea ? (
          <textarea
            defaultValue={value}
            rows={3}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
          />
        ) : (
          <input
            defaultValue={value}
            disabled={disabled}
            className={`w-full h-9 ${Icon ? "pl-9" : "pl-3"} pr-3 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${disabled ? "text-stone-500 cursor-not-allowed" : ""}`}
          />
        )}
      </div>
    </label>
  );
}

function Select({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-600">{label}</span>
      <select defaultValue={value} className="mt-1 w-full h-9 px-3 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-start justify-between gap-4 py-1 cursor-pointer">
      <div>
        <div className="text-sm text-stone-900">{label}</div>
        <div className="text-xs text-stone-500">{desc}</div>
      </div>
      <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <div className="w-10 h-5 bg-stone-200 rounded-full relative peer-checked:bg-emerald-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

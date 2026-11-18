import { useState } from "react";
import { Plus, X, Upload, Pencil, Trash2, ChevronRight, GripVertical } from "lucide-react";
import { localDate } from "../lib/dates";

type Tab = "brand" | "booking" | "package" | "points" | "homepage" | "advanced";

const TABS: { id: Tab; label: string }[] = [
  { id: "brand",    label: "品牌与馆所信息" },
  { id: "booking",  label: "预约规则" },
  { id: "package",  label: "套餐规则" },
  { id: "points",   label: "积分规则" },
  { id: "homepage", label: "首页内容" },
  { id: "advanced", label: "高级配置" },
];

export function Settings() {
  const [tab, setTab] = useState<Tab>("brand");

  return (
    <div className="p-8 flex gap-6 items-start">
      {/* 左侧 Tab 导航 */}
      <nav className="w-44 shrink-0 bg-white rounded-xl border border-stone-200 overflow-hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-full text-left px-4 py-3 text-sm border-b border-stone-100 last:border-0 transition-colors ${
              tab === t.id
                ? "bg-emerald-50 text-emerald-700 border-l-2 border-l-emerald-600"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* 右侧内容 */}
      <div className="flex-1 min-w-0 space-y-4">
        {tab === "brand"    && <BrandSection />}
        {tab === "booking"  && <BookingSection />}
        {tab === "package"  && <PackageSection />}
        {tab === "points"   && <PointsSection />}
        {tab === "homepage" && <HomepageSection />}
        {tab === "advanced" && <AdvancedSection />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   1. 品牌与馆所信息
───────────────────────────────────── */
function BrandSection() {
  return (
    <>
      <Card title="基础资料" desc="馆所对外展示的核心信息">
        <div className="grid grid-cols-2 gap-4">
          <Field label="馆所名称"><input defaultValue="瑜伽管理演示" className={inp()} /></Field>
          <Field label="联系电话"><input defaultValue="+86 21 5588 0099" className={inp()} /></Field>
          <Field label="馆所地址" className="col-span-2">
            <input defaultValue="上海市徐汇区安福路 200 号" className={inp()} />
          </Field>
          <Field label="品牌简介" className="col-span-2">
            <textarea
              defaultValue="本馆致力于提供专业、安全、温暖的练习空间，服务都市练习者。"
              rows={2}
              className={inp() + " h-auto py-2 resize-none"}
            />
          </Field>
        </div>
        <SaveRow />
      </Card>

      <Card title="照片资料" desc="品牌图片将在小程序馆所主页展示，建议上传 16:9 横版图，最多 8 张">
        <PhotoWall />
        <SaveRow label="保存排序" />
      </Card>
    </>
  );
}

function PhotoWall() {
  const placeholders = [
    { id: 1, bg: "from-emerald-200 to-teal-300" },
    { id: 2, bg: "from-teal-200 to-cyan-300" },
    { id: 3, bg: "from-stone-200 to-stone-300" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {placeholders.map((p) => (
        <div key={p.id} className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${p.bg} aspect-video group`}>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-6 h-6 rounded bg-white/90 flex items-center justify-center text-stone-600 hover:bg-white">
              <GripVertical className="w-3 h-3" />
            </button>
            <button className="w-6 h-6 rounded bg-white/90 flex items-center justify-center text-rose-500 hover:bg-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
      <button className="rounded-lg border-2 border-dashed border-stone-200 hover:border-emerald-400 hover:bg-emerald-50 aspect-video flex flex-col items-center justify-center gap-1.5 text-stone-400 hover:text-emerald-600 transition-colors">
        <Upload className="w-4 h-4" />
        <span className="text-xs">上传图片</span>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────
   2. 预约规则
───────────────────────────────────── */
function BookingSection() {
  return (
    <Card title="预约规则" desc="控制会员预约与取消的时间限制">
      <div className="space-y-5">
        <NumericRule
          label="取消窗口"
          unit="小时"
          defaultValue={4}
          desc="开课前多少小时内，取消预约将产生违约记录。设为 0 则不限制。"
        />
        <div className="border-t border-stone-100" />
        <NumericRule
          label="预约截止时间"
          unit="分钟"
          defaultValue={30}
          desc="开课前多少分钟后，不再接受新预约。设为 0 则不限制。"
        />
      </div>
      <SaveRow />
    </Card>
  );
}

function NumericRule({ label, unit, defaultValue, desc }: { label: string; unit: string; defaultValue: number; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <div className="text-sm text-stone-900">{label}</div>
        <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          defaultValue={defaultValue}
          min={0}
          className="w-20 h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        <span className="text-xs text-stone-500 w-8">{unit}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   3. 套餐规则
───────────────────────────────────── */
function PackageSection() {
  return (
    <Card title="套餐规则" desc="适用于私教课包与 Pass / 月卡的预约扣费规则">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="text-sm text-stone-900">私教课包预约即扣</div>
            <div className="text-xs text-stone-500 mt-0.5">开启后，私教课成功预约即扣课时；关闭则签到后才扣。</div>
          </div>
          <select defaultValue="true" className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
            <option value="true">预约即扣</option>
            <option value="false">签到后扣</option>
          </select>
        </div>
        <div className="border-t border-stone-100" />
        <NumericRule
          label="Pass / 月卡每日预约上限"
          unit="节"
          defaultValue={2}
          desc="同一会员每日通过 Pass 或月卡最多可预约的课程节数。设为 0 则不限制。"
        />
      </div>
      <SaveRow />
    </Card>
  );
}

/* ─────────────────────────────────────
   4. 积分规则
───────────────────────────────────── */
function PointsSection() {
  return (
    <Card title="积分规则" desc="控制会员积分的获取与消耗比例">
      <div className="space-y-5">
        <PointsRule
          label="购卡积分比例"
          hint="消费每 ¥1 积"
          unit="分"
          defaultValue={10}
          desc="会员购买课程套餐时，按消费金额折算积分。"
        />
        <div className="border-t border-stone-100" />
        <PointsRule
          label="推荐积分"
          hint="成功推荐每人积"
          unit="分"
          defaultValue={200}
          desc="会员成功推荐新会员注册并首次购卡后，推荐人获得积分。"
        />
        <div className="border-t border-stone-100" />
        <PointsRule
          label="积分抵扣比例"
          hint="每"
          unit="分抵 ¥1"
          defaultValue={100}
          desc="会员在购卡时使用积分抵扣金额的换算比例。"
        />
      </div>
      <SaveRow />
    </Card>
  );
}

function PointsRule({ label, hint, unit, defaultValue, desc }: { label: string; hint: string; unit: string; defaultValue: number; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <div className="text-sm text-stone-900">{label}</div>
        <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-xs text-stone-500">
        <span>{hint}</span>
        <input
          type="number"
          defaultValue={defaultValue}
          min={0}
          className="w-20 h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        <span>{unit}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   5. 首页内容
───────────────────────────────────── */
function HomepageSection() {
  return (
    <>
      <Card title="首页轮播图" desc="在小程序首页展示的轮播图片，建议比例 16:9，最多 6 张">
        <PhotoWall />
        <SaveRow label="保存排序" />
      </Card>

      <Card title="通知条配置" desc="小程序首页顶部滚动通知条的展示设置">
        <div className="space-y-5">
          <NumericRule
            label="通知条滚动间隔"
            unit="毫秒"
            defaultValue={4000}
            desc="相邻通知条目切换的时间间隔，单位毫秒（1000 = 1 秒）。"
          />
        </div>
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="text-sm text-stone-900">通知内容管理</div>
            <div className="text-xs text-stone-500 mt-0.5">通知条文案在通知管理模块中维护</div>
          </div>
          <button className="h-8 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-1.5">
            前往通知管理 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <SaveRow />
      </Card>
    </>
  );
}

/* ─────────────────────────────────────
   6. 高级配置
───────────────────────────────────── */
type ConfigEntry = { key: string; value: string; updatedAt: string };

function AdvancedSection() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([
    { key: "feature.auto_confirm_booking", value: "false", updatedAt: "2026-06-01" },
    { key: "session.reminder_lead_minutes", value: "30",    updatedAt: "2026-05-20" },
    { key: "booking.max_future_days",       value: "14",    updatedAt: "2026-04-15" },
    { key: "member.deactivate_after_days",  value: "90",    updatedAt: "2026-03-08" },
  ]);
  const [editing, setEditing] = useState<ConfigEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<ConfigEntry>({ key: "", value: "", updatedAt: "" });

  const today = localDate();

  const saveEdit = () => {
    if (!draft.key.trim()) return;
    if (editing) {
      setConfigs((prev) => prev.map((c) => c.key === editing.key ? { ...draft, updatedAt: today } : c));
    } else {
      setConfigs((prev) => [...prev, { ...draft, updatedAt: today }]);
    }
    setEditing(null);
    setAdding(false);
    setDraft({ key: "", value: "", updatedAt: "" });
  };

  const startEdit = (c: ConfigEntry) => { setEditing(c); setAdding(false); setDraft(c); };
  const startAdd  = () => { setAdding(true); setEditing(null); setDraft({ key: "", value: "", updatedAt: "" }); };
  const cancel    = () => { setEditing(null); setAdding(false); };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <div className="text-sm text-stone-900">高级配置</div>
          <div className="text-xs text-stone-500 mt-0.5">面向开发者与系统管理员的原始配置项，修改前请确认影响范围</div>
        </div>
        <button onClick={startAdd} className="h-8 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> 新增配置
        </button>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_160px_100px_72px] px-5 py-2 bg-stone-50 border-b border-stone-100 text-xs text-stone-500">
        <div>配置项 Key</div>
        <div>值</div>
        <div>更新时间</div>
        <div />
      </div>

      {/* 新增行 */}
      {adding && (
        <div className="grid grid-cols-[1fr_160px_100px_72px] items-center px-5 py-2 border-b border-stone-100 bg-emerald-50">
          <input autoFocus value={draft.key} onChange={(e) => setDraft((p) => ({ ...p, key: e.target.value }))} placeholder="feature.new_key" className="mr-3 h-7 px-2 rounded border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          <input value={draft.value} onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))} placeholder="值" className="mr-3 h-7 px-2 rounded border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          <span className="text-xs text-stone-400">{today}</span>
          <div className="flex gap-1">
            <button onClick={saveEdit} className="h-7 px-2 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700">保存</button>
            <button onClick={cancel} className="h-7 px-2 rounded border border-stone-200 text-xs hover:bg-stone-100">取消</button>
          </div>
        </div>
      )}

      {configs.map((c) => (
        editing?.key === c.key ? (
          <div key={c.key} className="grid grid-cols-[1fr_160px_100px_72px] items-center px-5 py-2 border-b border-stone-100 bg-amber-50">
            <span className="text-xs text-stone-500 font-mono mr-3 truncate">{c.key}</span>
            <input value={draft.value} onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))} className="mr-3 h-7 px-2 rounded border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            <span className="text-xs text-stone-400">{today}</span>
            <div className="flex gap-1">
              <button onClick={saveEdit} className="h-7 px-2 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700">保存</button>
              <button onClick={cancel} className="h-7 px-2 rounded border border-stone-200 text-xs hover:bg-stone-100">取消</button>
            </div>
          </div>
        ) : (
          <div key={c.key} className="grid grid-cols-[1fr_160px_100px_72px] items-center px-5 py-2.5 border-b border-stone-100 last:border-0 hover:bg-stone-50 group">
            <span className="text-xs text-stone-700 font-mono truncate pr-3">{c.key}</span>
            <span className="text-xs text-stone-500 truncate pr-3">{c.value}</span>
            <span className="text-xs text-stone-400">{c.updatedAt}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(c)} className="w-7 h-7 rounded border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-500">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => setConfigs((prev) => prev.filter((x) => x.key !== c.key))} className="w-7 h-7 rounded border border-stone-200 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center text-stone-400 hover:text-rose-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )
      ))}
    </div>
  );
}

/* ─────────────────────────────────────
   共用组件
───────────────────────────────────── */
function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
      <div>
        <div className="text-sm text-stone-900">{title}</div>
        {desc && <div className="text-xs text-stone-500 mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs text-stone-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SaveRow({ label = "保存" }: { label?: string }) {
  return (
    <div className="flex justify-end pt-2 border-t border-stone-100">
      <button className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
        {label}
      </button>
    </div>
  );
}

function inp() {
  return "w-full h-9 px-3 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";
}

import { useEffect, useRef, useState } from "react";
import { Bell, BookOpen, CheckCheck, Menu, Plus, Search, UserRound, Users, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useStore } from "../store-context";
import { difficultyLabel } from "../lib/difficulty";

const initialNotifications = [
  { id: "n1", title: "苏晴 月卡将于 3 天后到期", time: "10 分钟前", read: false },
  { id: "n2", title: "晚间阴瑜伽 已满员", time: "35 分钟前", read: false },
  { id: "n3", title: "新订单待支付", time: "1 小时前", read: false },
  { id: "n4", title: "对账：2 笔金额不符", time: "今天 09:20", read: true },
  { id: "n5", title: "教练请假申请", time: "昨天 18:40", read: true },
];

export function Topbar({ title, subtitle, primaryLabel, onPrimary, onMenu, navOpen = false }: { title: string; subtitle?: string; primaryLabel?: string; onPrimary?: () => void; onMenu?: () => void; navOpen?: boolean }) {
  const { members, templates, instructors } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const normalized = query.trim().toLowerCase();
  const memberResults = normalized ? members.filter((member) => `${member.name}${member.phone}`.toLowerCase().includes(normalized)).slice(0, 5) : [];
  const courseResults = normalized ? templates.filter((template) => template.name.toLowerCase().includes(normalized)).slice(0, 5) : [];
  const instructorResults = normalized ? instructors.filter((instructor) => instructor.name.toLowerCase().includes(normalized)).slice(0, 5) : [];
  const hasResults = memberResults.length + courseResults.length + instructorResults.length > 0;
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) setSearchOpen(false);
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileSearch(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => { if (mobileSearch) inputRef.current?.focus(); }, [mobileSearch]);

  const closeMobileSearch = () => { setQuery(""); setSearchOpen(false); setMobileSearch(false); };

  const choose = (path: string, state?: Record<string, unknown>) => {
    navigate(path, state ? { state } : undefined);
    closeMobileSearch();
  };

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:h-16 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        {onMenu && <button aria-label="打开菜单" aria-controls="app-sidebar" aria-expanded={navOpen} onClick={onMenu} className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden"><Menu className="size-5" /></button>}
        <div className="min-w-0"><div className="truncate text-stone-900">{title}</div>{subtitle && <div className="hidden truncate text-xs text-stone-500 sm:block">{subtitle}</div>}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Below md the search is an icon; tapping it lays the field over the header row. */}
        <button aria-label="搜索" onClick={() => { setMobileSearch(true); setNotificationsOpen(false); }} className="flex size-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 md:hidden"><Search className="size-4" /></button>
        <div ref={searchRef} className={`${mobileSearch ? "absolute inset-0 z-10 flex items-center gap-2 bg-white px-4 sm:px-6" : "hidden"} md:relative md:inset-auto md:z-auto md:flex md:bg-transparent md:px-0`}>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              ref={inputRef}
              value={query}
              onFocus={() => { if (query.trim()) setSearchOpen(true); }}
              onChange={(event) => { setQuery(event.target.value); setSearchOpen(Boolean(event.target.value.trim())); }}
              placeholder="搜索会员、课程……"
              className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-9 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 md:w-56 xl:w-72"
            />
            {query && <button aria-label="清空搜索" onClick={() => { setQuery(""); setSearchOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"><X className="size-3.5" /></button>}
          </div>
          <button onClick={closeMobileSearch} className="h-9 shrink-0 px-1 text-sm text-stone-600 hover:text-stone-900 md:hidden">取消</button>
          {searchOpen && normalized && (
            <div className="absolute inset-x-3 top-full mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl md:inset-x-auto md:right-0 md:w-[380px]">
              <div className="max-h-[min(420px,70vh)] overflow-y-auto p-2">
                {!hasResults ? <div className="py-10 text-center text-sm text-stone-400">没有找到相关结果</div> : <>
                  <ResultGroup title="会员" icon={Users}>
                    {memberResults.map((member) => <ResultItem key={member.id} title={member.name} subtitle={member.phone} onClick={() => choose("/members", { memberId: member.id, searchAt: Date.now() })} />)}
                  </ResultGroup>
                  <ResultGroup title="课程" icon={BookOpen}>
                    {courseResults.map((course) => <ResultItem key={course.id} title={course.name} subtitle={`${course.format} · ${difficultyLabel(course.difficulty)}`} onClick={() => choose("/classes")} />)}
                  </ResultGroup>
                  <ResultGroup title="教练" icon={UserRound}>
                    {instructorResults.map((instructor) => <ResultItem key={instructor.id} title={instructor.name} subtitle={instructor.specialty.join(" · ")} onClick={() => choose(`/instructors/${instructor.id}`)} />)}
                  </ResultGroup>
                </>}
              </div>
            </div>
          )}
        </div>

        {/* Static below sm so the panel is placed against the header and can span the screen. */}
        <div ref={notificationsRef} className="sm:relative">
          <button aria-label="通知" onClick={() => { setNotificationsOpen((open) => !open); setSearchOpen(false); }} className="relative flex size-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50">
            <Bell className="size-4" />
            {unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />}
          </button>
          {notificationsOpen && (
            <div className="absolute inset-x-3 top-full mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl sm:inset-x-auto sm:right-0 sm:w-80">
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3"><div className="text-sm font-medium text-stone-900">消息提醒</div><button disabled={!unreadCount} onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} className="flex items-center gap-1 text-xs text-emerald-700 disabled:text-stone-300"><CheckCheck className="size-3.5" />全部标为已读</button></div>
              <div>{notifications.map((item) => <div key={item.id} className="flex gap-3 border-b border-stone-100 px-4 py-3 last:border-0"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? "bg-stone-200" : "bg-emerald-500"}`} /><div><div className={`text-sm ${item.read ? "text-stone-500" : "font-medium text-stone-800"}`}>{item.title}</div><div className="mt-1 text-xs text-stone-400">{item.time}</div></div></div>)}</div>
              <button onClick={() => { setNotificationsOpen(false); navigate("/notifications"); }} className="w-full border-t border-stone-100 px-4 py-3 text-center text-sm text-emerald-700 hover:bg-stone-50">查看全部通知</button>
            </div>
          )}
        </div>
        {onPrimary && primaryLabel && <button onClick={onPrimary} aria-label={primaryLabel} className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-sm text-white hover:bg-emerald-700 sm:px-3"><Plus className="size-4" /><span className="hidden sm:inline">{primaryLabel}</span></button>}
      </div>
    </header>
  );
}

function ResultGroup({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return <div className="py-1"><div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-stone-400"><Icon className="size-3.5" />{title}</div>{children}</div>;
}
function ResultItem({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left hover:bg-stone-50"><span className="text-sm text-stone-800">{title}</span><span className="max-w-52 truncate text-xs text-stone-400">{subtitle}</span></button>;
}

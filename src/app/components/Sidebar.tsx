import { NavLink } from "react-router";
import { LayoutDashboard, Calendar, Users, BookOpen, UserCog, Settings, Flower2, CreditCard, ReceiptText, Bell, ScrollText, PieChart, ArrowLeftRight, X } from "lucide-react";

const NAV_GROUPS: { label?: string; items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  {
    items: [
      { to: "/dashboard",  label: "概览",   icon: LayoutDashboard },
    ],
  },
  {
    label: "排课与预约",
    items: [
      { to: "/schedule",      label: "排课",     icon: Calendar },
      { to: "/classes",       label: "课程",     icon: Flower2 },
      { to: "/reservations",  label: "预约管理", icon: BookOpen },
    ],
  },
  {
    label: "人员管理",
    items: [
      { to: "/members",    label: "会员", icon: Users },
      { to: "/instructors",label: "教练", icon: UserCog },
    ],
  },
  {
    label: "商业运营",
    items: [
      { to: "/packages",      label: "套餐管理", icon: CreditCard },
      { to: "/orders",        label: "订单管理", icon: ReceiptText },
      { to: "/notifications", label: "通知公告", icon: Bell },
    ],
  },
  {
    label: "数据与财务",
    items: [
      { to: "/reports",        label: "数据报表", icon: PieChart },
      { to: "/reconciliation", label: "对账管理", icon: ArrowLeftRight },
      { to: "/audit-log",      label: "审计日志", icon: ScrollText },
    ],
  },
  {
    items: [
      { to: "/settings", label: "设置", icon: Settings },
    ],
  },
];

/**
 * From lg (1024px) up the sidebar is a fixed column. Below that it is an off-canvas drawer:
 * the Topbar's menu button opens it, and the backdrop, the close button, Escape or choosing a
 * page closes it.
 */
export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  return (
    <>
    <div aria-hidden className={`fixed inset-0 z-40 bg-stone-900/40 transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} />
    <aside
      id="app-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] shrink-0 flex-col border-r border-stone-200 bg-stone-50 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-56 lg:max-w-none lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Logo */}
      <div className="px-5 py-4 border-b border-stone-200 flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shrink-0">
          <Flower2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-stone-900 truncate">瑜伽管理演示</div>
          <div className="text-xs text-stone-500">管理后台</div>
        </div>
        <button aria-label="关闭菜单" onClick={onClose} className="ml-auto flex size-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-900 lg:hidden"><X className="size-4" /></button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {/* Group separator + label */}
            {gi > 0 && (
              <div className={`${group.label ? "pt-3 pb-1" : "pt-2"}`}>
                {group.label && (
                  <div className="px-2.5 text-[10px] text-[#6B7280] uppercase tracking-widest mb-0.5">
                    {group.label}
                  </div>
                )}
              </div>
            )}
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg outline-none focus:outline-none transition-colors text-sm ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Profile */}
      <NavLink
        to="/profile"
        aria-label="查看管理员资料"
        onClick={onClose}
        className={({ isActive }) =>
          `px-4 py-3.5 border-t border-stone-200 flex items-center gap-2.5 transition-colors shrink-0 ${
            isActive ? "bg-stone-200" : "hover:bg-stone-100"
          }`
        }
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 flex items-center justify-center text-white text-xs shrink-0">
          林
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-stone-900 truncate">林梅</div>
          <div className="text-xs text-stone-500 truncate">馆长 · 查看资料</div>
        </div>
      </NavLink>
    </aside>
    </>
  );
}

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { ClassModal } from "./components/ClassModal";
import { SessionModal } from "./components/SessionModal";
import { InstructorModal } from "./components/InstructorModal";
import { readSession } from "./lib/auth";
import { useStore } from "./store-context";

const meta: Record<string, { title: string; subtitle: string; primary: "class" | "session" | "instructor" | "none" }> = {
  "/dashboard":      { title: "概览",     subtitle: "欢迎回到瑜伽管理演示",  primary: "session"     },
  "/schedule":       { title: "排课",     subtitle: "为已有课程安排具体时间",   primary: "session"     },
  "/classes":        { title: "课程",     subtitle: "课程目录与模板管理",       primary: "class"       },
  "/reservations":   { title: "预约管理", subtitle: "全部预约记录",             primary: "none"        },
  "/members":        { title: "会员",     subtitle: "会员档案与卡包管理",       primary: "none"        },
  "/instructors":    { title: "教练",     subtitle: "教练档案与资质管理",       primary: "instructor"  },
  "/packages":       { title: "套餐管理", subtitle: "套餐产品与用户卡包",       primary: "none"        },
  "/orders":         { title: "订单管理", subtitle: "订单流水与支付退款",       primary: "none"        },
  "/notifications":  { title: "通知公告", subtitle: "小程序通知条内容管理",     primary: "none"        },
  "/reports":        { title: "数据报表", subtitle: "预约、营收与教练多维报表", primary: "none"        },
  "/reconciliation": { title: "对账管理", subtitle: "渠道流水核对与匹配",       primary: "none"        },
  "/audit-log":      { title: "审计日志", subtitle: "操作记录与数据变更追溯",   primary: "none"        },
  "/settings":       { title: "设置",     subtitle: "馆所基础配置",             primary: "none"        },
  "/profile":        { title: "管理员资料",subtitle: "个人信息与账号安全",      primary: "none"        },
};

function RootLayout() {
  const { pathname } = useLocation();
  const m = pathname.startsWith("/instructors/")
    ? { title: "教练详情", subtitle: "教练资料、排课与授课记录", primary: "none" as const }
    : pathname.startsWith("/packages/")
    ? { title: "套餐管理", subtitle: "维护线下售卡套餐与价格", primary: "none" as const }
    : meta[pathname] ?? { title: "瑜伽管理演示", subtitle: "管理后台", primary: "none" as const };
  const store = useStore();
  const [navOpen, setNavOpen] = useState(false);

  // Close the phone/tablet nav drawer whenever the page changes, and on Escape.
  useEffect(() => { setNavOpen(false); }, [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setNavOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const primaryLabel =
    m.primary === "class" ? "新建课程"
    : m.primary === "session" ? "排课"
    : m.primary === "instructor" ? "新增教练"
    : undefined;
  const onPrimary =
    m.primary === "class" ? store.openCreateClass
    : m.primary === "session" ? () => store.openCreateSession()
    : m.primary === "instructor" ? store.openCreateInstructor
    : undefined;

  return (
    <div className="size-full flex bg-stone-100">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={m.title} subtitle={m.subtitle} primaryLabel={primaryLabel} onPrimary={onPrimary} navOpen={navOpen} onMenu={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ClassModal
        open={store.modal.kind === "class"}
        mode={store.modal.kind === "class" && store.modal.editing ? "edit" : "create"}
        initial={store.modal.kind === "class" ? store.modal.editing : null}
        onClose={store.closeModal}
        onSubmit={store.submitClass}
        onDelete={store.deleteClass}
      />

      <SessionModal
        open={store.modal.kind === "session"}
        mode={store.modal.kind === "session" && store.modal.editing ? "edit" : "create"}
        initial={
          store.modal.kind === "session"
            ? store.modal.editing ?? (store.modal.preselect || store.modal.date || store.modal.instructor
                ? { id: "", classId: store.modal.preselect ?? "", instructor: store.modal.instructor ?? "", room: "", date: store.modal.date ?? (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })(), start: store.modal.start ?? "09:00", end: store.modal.end ?? "10:00", booked: 0, difficulty: 3, isVisible: true }
                : null)
            : null
        }
        templates={store.templates}
        instructors={store.instructors}
        onClose={store.closeModal}
        onSubmit={store.submitSession}
        onDelete={store.deleteSession}
      />

      <InstructorModal
        open={store.modal.kind === "instructor"}
        mode={store.modal.kind === "instructor" && store.modal.editing ? "edit" : "create"}
        initial={store.modal.kind === "instructor" ? store.modal.editing : null}
        onClose={store.closeModal}
        onSubmit={store.submitInstructor}
        onDelete={store.deleteInstructor}
      />
    </div>
  );
}

/** Every app page needs a signed-in session; otherwise go to the login page and come back afterwards. */
export function Root() {
  const location = useLocation();
  if (!readSession()) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <RootLayout />;
}

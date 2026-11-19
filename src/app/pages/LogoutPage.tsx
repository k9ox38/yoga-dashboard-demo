import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { sessionMinutes, signOut } from "../lib/auth";

function formatDuration(minutes: number) {
  if (minutes < 1) return "不到 1 分钟";
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

/** Shown after signing out. Opening it directly also signs out. */
export function LogoutPage() {
  const location = useLocation();
  const signedInAt = (location.state as { signedInAt?: string } | null)?.signedInAt;
  const [minutes] = useState(() => (signedInAt ? sessionMinutes(signedInAt) : null));

  useEffect(() => { signOut(); }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-4 py-10 text-stone-800">
      <BrandMark className="mb-8" />
      <main className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-7" /></span>
        <h1 className="mt-5 text-xl font-semibold text-stone-900">你已安全退出</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">本机的登录状态已清除。如果在公共电脑上使用，建议同时关闭浏览器窗口。</p>

        {signedInAt && minutes !== null && (
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-stone-50 px-4 py-3 text-left text-sm">
            <dt className="text-stone-500">登录时间</dt><dd className="tabular-nums text-stone-800">{signedInAt.slice(0, 16)}</dd>
            <dt className="text-stone-500">在线时长</dt><dd className="text-stone-800">{formatDuration(minutes)}</dd>
          </dl>
        )}

        <Link to="/login" replace className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          重新登录
        </Link>
      </main>
      <p className="mt-8 text-xs text-stone-400">瑜伽管理演示 · 仅用于界面演示</p>
    </div>
  );
}

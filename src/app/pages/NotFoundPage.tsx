import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="p-12 max-w-lg">
      <div className="text-stone-900 text-2xl">页面未找到</div>
      <div className="text-sm text-stone-500 mt-2">您访问的链接不存在或已被移除。</div>
      <Link to="/dashboard" className="inline-block mt-4 h-9 px-4 leading-9 rounded-lg bg-emerald-600 text-white text-sm">返回概览</Link>
    </div>
  );
}

import { Flower2 } from "lucide-react";

/** The sidebar's logo and name, for pages shown outside the app shell (login, signed out). */
export function BrandMark({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const light = tone === "light";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${light ? "bg-white/15 ring-1 ring-white/25" : "bg-gradient-to-br from-emerald-400 to-teal-600"}`}>
        <Flower2 className="size-[18px]" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block text-[15px] font-medium ${light ? "text-white" : "text-stone-900"}`}>瑜伽管理演示</span>
        <span className={`block text-xs ${light ? "text-emerald-50/75" : "text-stone-500"}`}>管理后台</span>
      </span>
    </div>
  );
}

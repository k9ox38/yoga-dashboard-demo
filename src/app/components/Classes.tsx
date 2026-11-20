import type { ClassTemplate } from "./data";
import { Edit3, CalendarPlus, Users } from "lucide-react";
import { DifficultyStars } from "./Difficulty";

const formatGradient: Record<string, string> = {
  团课: "from-emerald-400 to-teal-600",
  私教: "from-amber-400 to-orange-500",
};

type Props = {
  templates: ClassTemplate[];
  sessionCounts: Record<string, number>;
  onCreate: () => void;
  onEdit: (t: ClassTemplate) => void;
  onSchedule: (t: ClassTemplate) => void;
};

export function Classes({ templates, sessionCounts, onEdit, onSchedule }: Props) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-stone-900">课程目录</div>
          <div className="text-xs text-stone-500">先创建课程，再到课程表上排课</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className={`h-20 bg-gradient-to-br ${formatGradient[c.format] ?? "from-stone-300 to-stone-500"} relative flex items-end p-3`}>
              <span className="text-xs px-2 py-0.5 bg-white/90 rounded-full text-stone-800">{c.format}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-stone-900">{c.name}</div>
              <p className="text-xs text-stone-600 mt-1 line-clamp-2 flex-1">{c.description || "暂无描述"}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-stone-500">
                <DifficultyStars value={c.difficulty} />
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.capacity}</span>
                <span className="ml-auto">{sessionCounts[c.id] ?? 0} 节排课</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => onEdit(c)} className="h-8 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm text-stone-700 flex items-center justify-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> 编辑
                </button>
                <button onClick={() => onSchedule(c)} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center justify-center gap-1.5">
                  <CalendarPlus className="w-3.5 h-3.5" /> 排课
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

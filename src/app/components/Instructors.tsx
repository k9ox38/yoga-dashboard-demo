import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarCheck,
  Edit3,
  GraduationCap,
  Phone,
  Search,
  Star,
  UsersRound,
} from "lucide-react";
import type { Instructor } from "./data";
import { useStore } from "../store-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = {
  instructors: Instructor[];
  onEdit: (instructor: Instructor) => void;
};

const avatarColors = [
  "from-emerald-300 to-teal-600",
  "from-sky-300 to-cyan-600",
  "from-amber-300 to-orange-500",
  "from-violet-300 to-purple-600",
  "from-rose-300 to-pink-600",
];

function instructorMetrics(instructor: Instructor, index: number) {
  const seed = instructor.name.charCodeAt(0) + index;
  return {
    students: 168 + (seed % 7) * 37,
    rating: (4.6 + (seed % 4) * 0.1).toFixed(1),
  };
}

export function Instructors({ instructors, onEdit }: Props) {
  const { sessions } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("全部");
  const [status, setStatus] = useState<"全部" | Instructor["status"]>("全部");

  const specialties = useMemo(
    () => ["全部", ...Array.from(new Set(instructors.flatMap((instructor) => instructor.specialty)))],
    [instructors],
  );
  const filtered = useMemo(() => instructors.filter((instructor) => {
    const matchesSearch = !search.trim() || `${instructor.name}${instructor.phone}`.includes(search.trim());
    const matchesSpecialty = specialty === "全部" || instructor.specialty.includes(specialty);
    const matchesStatus = status === "全部" || instructor.status === status;
    return matchesSearch && matchesSpecialty && matchesStatus;
  }), [instructors, search, specialty, status]);

  const enabledNames = new Set(instructors.filter((instructor) => instructor.status === "启用").map((instructor) => instructor.name));
  const weeklySessions = sessions.filter((session) => enabledNames.has(session.instructor)).length;
  const stats = [
    { label: "在职教练数", value: String(enabledNames.size), sub: `共 ${instructors.length} 位教练`, icon: UsersRound, accent: "bg-emerald-600" },
    { label: "本周授课节数", value: String(weeklySessions), sub: "按当前排课统计", icon: CalendarCheck, accent: "bg-teal-500" },
    { label: "本月授课学员人次", value: "486", sub: "较上月 +8.2%", icon: GraduationCap, accent: "bg-amber-500" },
    { label: "平均评分", value: "4.8", sub: "近 30 天课程评价", icon: Star, accent: "bg-sky-500" },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="flex min-w-0 items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:gap-4 sm:p-5">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent}`}><Icon className="size-4 text-white" /></div>
            <div className="min-w-0"><div className="text-xs text-stone-500">{label}</div><div className="mt-0.5 text-xl text-stone-900">{value}</div><div className="mt-0.5 text-xs text-stone-400">{sub}</div></div>
          </div>
        ))}
      </div>

      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索教练姓名 / 手机号" className="h-10 border-stone-200 bg-white pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">状态</span>
            {(["全部", "启用", "禁用"] as const).map((item) => (
              <Button key={item} type="button" variant="outline" onClick={() => setStatus(item)} className={`h-8 rounded-full px-3 text-xs ${status === item ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white" : "border-stone-200 text-stone-600"}`}>{item}</Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
          <span className="mr-1 text-xs text-stone-500">专长方向</span>
          {specialties.map((item) => (
            <Button key={item} type="button" variant="outline" onClick={() => setSpecialty(item)} className={`h-8 rounded-full px-3 text-xs ${specialty === item ? "border-teal-600 bg-teal-50 text-teal-700 hover:bg-teal-100" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{item}</Button>
          ))}
          <span className="ml-auto text-xs text-stone-400">共 {filtered.length} 位</span>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center"><div className="text-sm text-stone-600">暂无匹配教练</div><div className="mt-1 text-xs text-stone-400">请调整搜索或筛选条件</div></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((instructor) => {
            const sourceIndex = instructors.findIndex((item) => item.id === instructor.id);
            const metrics = instructorMetrics(instructor, sourceIndex);
            const instructorSessions = sessions.filter((session) => session.instructor === instructor.name);
            return (
              <article
                key={instructor.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/instructors/${instructor.id}`)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/instructors/${instructor.id}`); }}
                className={`group relative cursor-pointer rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md ${instructor.status === "禁用" ? "opacity-55 grayscale-[20%]" : ""}`}
              >
                <Button type="button" variant="ghost" size="icon" aria-label={`编辑${instructor.name}`} onClick={(event) => { event.stopPropagation(); onEdit(instructor); }} className="absolute right-4 top-4 size-8 text-stone-400 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="size-4" /></Button>
                <div className="flex items-start gap-4 pr-9">
                  <div className={`flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xl font-semibold text-white shadow-sm ${avatarColors[sourceIndex % avatarColors.length]}`}>{instructor.name.slice(0, 1)}</div>
                  <div className="min-w-0 pt-1"><div className="flex flex-wrap items-center gap-2"><div className="text-lg font-semibold text-stone-900">{instructor.name}</div><span className={`rounded-full px-2 py-0.5 text-xs ${instructor.status === "启用" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{instructor.status}</span></div><div className="mt-1 flex items-center gap-1.5 text-xs text-stone-400"><Phone className="size-3" />{instructor.phone}</div></div>
                </div>
                <div className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">{instructor.bio || "暂无简介"}</div>
                <div className="mt-4 flex min-h-7 flex-wrap gap-1.5"><SpecialtyTags tags={instructor.specialty} max={4} /></div>
                <div className="mt-5 grid grid-cols-3 divide-x divide-stone-100 border-t border-stone-100 pt-4 text-center">
                  <Metric value={String(instructorSessions.length)} label="本周课程" />
                  <Metric value={String(metrics.students)} label="累计学员" />
                  <Metric value={metrics.rating} label="评分" suffix={<Star className="size-3 fill-amber-400 text-amber-400" />} />
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}

function Metric({ value, label, suffix }: { value: string; label: string; suffix?: React.ReactNode }) {
  return <div><div className="flex items-center justify-center gap-1 text-sm font-medium text-stone-800">{value}{suffix}</div><div className="mt-1 text-[11px] text-stone-400">{label}</div></div>;
}

export function SpecialtyTags({ tags, max = 4 }: { tags: string[]; max?: number }) {
  if (!tags?.length) return <span className="text-xs text-stone-300">暂无专长</span>;
  const shown = tags.slice(0, max);
  const hidden = tags.length - max;
  return (
    <>
      {shown.map((tag) => <span key={tag} className="whitespace-nowrap rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-700">{tag}</span>)}
      {hidden > 0 && <span className="whitespace-nowrap rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-500">+{hidden}</span>}
    </>
  );
}

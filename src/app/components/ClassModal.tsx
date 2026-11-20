import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import type { ClassTemplate, ClassFormat } from "./data";
import { DifficultyInput } from "./Difficulty";
import { DEFAULT_DIFFICULTY } from "../lib/difficulty";

const FORMATS: ClassFormat[] = ["团课", "私教"];

const empty: ClassTemplate = {
  id: "",
  name: "",
  description: "",
  difficulty: DEFAULT_DIFFICULTY,
  format: "团课",
  capacity: 15,
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: ClassTemplate | null;
  onClose: () => void;
  onSubmit: (values: ClassTemplate) => void;
  onDelete?: (id: string) => void;
};

export function ClassModal({ open, mode, initial, onClose, onSubmit, onDelete }: Props) {
  const [values, setValues] = useState<ClassTemplate>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues(initial ?? empty);
    setErrors({});
  }, [open, initial]);

  if (!open) return null;

  const set = <K extends keyof ClassTemplate>(k: K, v: ClassTemplate[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "请输入课程名称";
    if (values.capacity < 1) e.capacity = "容量需大于 0";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({ ...values, id: values.id || `t_${Date.now()}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div>
            <div className="text-stone-900">{mode === "create" ? "创建课程" : "编辑课程"}</div>
            <div className="text-xs text-stone-500">课程定义，稍后可在课程表上排课</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <Field label="课程名称" error={errors.name}>
            <input value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="如：晨间流动" className={inputCls(errors.name)} />
          </Field>

          <Field label="课程描述">
            <textarea value={values.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="简要介绍课程内容、强度与适合人群" className={inputCls() + " h-auto py-2 resize-none"} />
          </Field>

          {/* Not wrapped in <label>: a label would pass clicks on its text to the first star. */}
          <div>
            <div className="text-xs text-stone-600">默认难度</div>
            <div className="mt-1">
              <DifficultyInput label="默认难度" value={values.difficulty} onChange={(difficulty) => set("difficulty", difficulty)} />
            </div>
            <div className="mt-1 text-xs text-stone-500">排课时自动带入，可按单节课调整</div>
          </div>

          <Field label="授课形式">
            <div className="flex gap-2">
              {FORMATS.map((f) => {
                const on = values.format === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      set("format", f);
                      if (f === "私教") set("capacity", 1);
                    }}
                    className={`flex-1 h-10 rounded-lg border text-sm transition-colors ${on ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-stone-200 text-stone-700 hover:bg-stone-50"}`}
                  >
                    {f}
                    <span className="block text-xs opacity-70">{f === "团课" ? "多人共同练习" : "1 对 1 教学"}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="容量（每场最大人数）" error={errors.capacity}>
            <input
              type="number"
              min={1}
              disabled={values.format === "私教"}
              value={values.capacity}
              onChange={(e) => set("capacity", parseInt(e.target.value) || 0)}
              className={inputCls(errors.capacity) + (values.format === "私教" ? " opacity-60" : "")}
            />
            {values.format === "私教" && <div className="text-xs text-stone-500 mt-1">私教课程容量固定为 1</div>}
          </Field>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl">
          <div>
            {mode === "edit" && onDelete && initial && (
              <button onClick={() => { onDelete(initial.id); onClose(); }} className="h-9 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-sm flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> 删除课程
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
            <button onClick={handleSubmit} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              {mode === "create" ? "创建" : "保存修改"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </label>
  );
}

function inputCls(error?: string) {
  return `w-full h-9 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
    error ? "border-rose-300" : "border-stone-200 focus:border-emerald-500"
  }`;
}

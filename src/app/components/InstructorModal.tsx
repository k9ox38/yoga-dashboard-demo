import { useEffect, useState, useRef } from "react";
import { X, Trash2, Plus } from "lucide-react";
import type { Instructor } from "./data";

const PRESET_SPECIALTIES = [
  "哈他", "流瑜伽", "阴瑜伽", "阿斯汤加",
  "空中吊绳", "孕产", "冥想", "理疗",
  "肩颈舒缓", "普拉提",
];

const empty: Instructor = {
  id: "",
  name: "",
  phone: "",
  bio: "",
  status: "启用",
  specialty: [],
  activities: [],
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Instructor | null;
  onClose: () => void;
  onSubmit: (values: Instructor) => void;
  onDelete?: (id: string) => void;
};

export function InstructorModal({ open, mode, initial, onClose, onSubmit, onDelete }: Props) {
  const [values, setValues] = useState<Instructor>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState("");
  const customRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValues(initial ? { ...initial, specialty: initial.specialty ?? [] } : empty);
    setErrors({});
    setCustomInput("");
  }, [open, initial]);

  if (!open) return null;

  const set = <K extends keyof Instructor>(k: K, v: Instructor[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  const togglePreset = (tag: string) => {
    const has = values.specialty.includes(tag);
    set("specialty", has ? values.specialty.filter((s) => s !== tag) : [...values.specialty, tag]);
  };

  const addCustom = () => {
    const tag = customInput.trim();
    if (!tag || values.specialty.includes(tag)) { setCustomInput(""); return; }
    set("specialty", [...values.specialty, tag]);
    setCustomInput("");
    customRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    set("specialty", values.specialty.filter((s) => s !== tag));
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!values.name.trim())  e.name  = "请输入姓名";
    if (!values.phone.trim()) e.phone = "请输入手机号";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({ ...values, id: values.id || `i_${Date.now()}` });
    onClose();
  };

  /* Custom tags: ones selected that are NOT in the preset list */
  const customTags = values.specialty.filter((s) => !PRESET_SPECIALTIES.includes(s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="text-stone-900">{mode === "create" ? "新增教练" : "编辑教练"}</div>
            <div className="text-xs text-stone-500">教练信息用于排课与对外展示</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="姓名" error={errors.name}>
              <input
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="如：吴安雅"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="手机号" error={errors.phone}>
              <input
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="如：138****2841"
                className={inputCls(errors.phone)}
              />
            </Field>
          </div>

          {/* Specialty */}
          <Field label="专长方向">
            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_SPECIALTIES.map((tag) => {
                const selected = values.specialty.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => togglePreset(tag)}
                    className={`h-7 px-3 rounded-full text-xs border transition-colors ${
                      selected
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom tags display */}
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {customTags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="w-4 h-4 rounded-full hover:bg-teal-200 flex items-center justify-center text-teal-600"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom input */}
            <div className="flex items-center gap-2">
              <input
                ref={customRef}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                placeholder="自定义专长，回车或点击添加"
                className="flex-1 h-8 px-3 rounded-lg border border-stone-200 bg-stone-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!customInput.trim()}
                className="h-8 px-3 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs text-stone-600 flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" /> 添加
              </button>
            </div>

            {values.specialty.length === 0 && (
              <div className="text-xs text-stone-400 mt-1.5">从上方选择预设专长，或输入自定义标签</div>
            )}
          </Field>

          <Field label="简介">
            <textarea
              value={values.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              placeholder="教学背景、资历说明等"
              className={inputCls() + " h-auto py-2 resize-none"}
            />
          </Field>

          <Field label="状态">
            <select value={values.status} onChange={(e) => set("status", e.target.value as Instructor["status"])} className={inputCls()}>
              <option value="启用">启用</option>
              <option value="禁用">禁用</option>
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl shrink-0">
          <div>
            {mode === "edit" && onDelete && initial && (
              <button onClick={() => { onDelete(initial.id); onClose(); }} className="h-9 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-sm flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> 删除教练
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg border border-stone-200 hover:bg-white text-sm">取消</button>
            <button onClick={handleSubmit} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              {mode === "create" ? "新增" : "保存修改"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-stone-600 mb-1">{label}</div>
      {children}
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full h-9 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
    error ? "border-rose-300" : "border-stone-200 focus:border-emerald-500"
  }`;
}

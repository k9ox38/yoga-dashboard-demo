import { useRef, useState, type KeyboardEvent } from "react";
import { Star } from "lucide-react";
import { cn } from "./ui/utils";
import { DIFFICULTY_LEVELS, clampDifficulty, difficultyLabel } from "../lib/difficulty";

/** Read-only stars with the difficulty's name beside them. */
export function DifficultyStars({ value, showLabel = true, className }: { value: number; showLabel?: boolean; className?: string }) {
  const level = clampDifficulty(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} role="img" aria-label={`难度 ${level} 星，${difficultyLabel(level)}`}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {DIFFICULTY_LEVELS.map((n) => (
          <Star key={n} className={cn("size-3", n <= level ? "fill-amber-400 text-amber-400" : "fill-stone-100 text-stone-200")} />
        ))}
      </span>
      {showLabel && <span className="text-xs text-stone-500" aria-hidden>{difficultyLabel(level)}</span>}
    </span>
  );
}

/** Star picker used by both the course form and the class form. */
export function DifficultyInput({ value, onChange, label = "难度" }: { value: number; onChange: (value: number) => void; label?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const level = clampDifficulty(value);
  const shown = hover ?? level;

  const onKeyDown = (event: KeyboardEvent) => {
    const next = { ArrowRight: level + 1, ArrowUp: level + 1, ArrowLeft: level - 1, ArrowDown: level - 1, Home: 1, End: 5 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = clampDifficulty(next);
    onChange(target);
    groupRef.current?.querySelector<HTMLElement>(`[data-level="${target}"]`)?.focus();
  };

  return (
    <div className="flex items-center gap-1">
      <div ref={groupRef} role="radiogroup" aria-label={label} className="flex items-center" onMouseLeave={() => setHover(null)}>
        {DIFFICULTY_LEVELS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            data-level={n}
            aria-checked={n === level}
            aria-label={`${n} 星，${difficultyLabel(n)}`}
            tabIndex={n === level ? 0 : -1}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onKeyDown={onKeyDown}
            className="rounded-md p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-500/40 pointer-coarse:p-1.5"
          >
            <Star className={cn("size-6 transition-colors", n <= shown ? "fill-amber-400 text-amber-400" : "fill-stone-100 text-stone-300")} />
          </button>
        ))}
      </div>
      <span className="ml-1.5 min-w-8 text-sm text-stone-600" aria-hidden>{difficultyLabel(shown)}</span>
    </div>
  );
}

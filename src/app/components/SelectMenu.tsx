import { Children, Fragment, isValidElement, type OptionHTMLAttributes, type ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "./ui/utils";

/**
 * A drop-in replacement for a single-choice <select> whose opened list is drawn by the app
 * rather than the operating system. Pass <option> elements as children, exactly as for a
 * native select; an option without a `value` uses its text, and an option whose value is ""
 * (such as 全部状态) is still selectable.
 *
 * `className` styles the closed control. With `placeholder`, an empty value shows the
 * placeholder in muted text instead of an option.
 */
export type SelectMenuProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

type Option = { value: string; label: ReactNode; disabled?: boolean };

// Radix reserves "" for "nothing selected", so options whose value is "" travel under this key.
const EMPTY = "__select-menu-empty__";

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function readOptions(children: ReactNode): Option[] {
  const options: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      options.push(...readOptions((child.props as { children?: ReactNode }).children));
      return;
    }
    if (child.type !== "option") return;
    const props = child.props as OptionHTMLAttributes<HTMLOptionElement>;
    options.push({
      value: props.value != null ? String(props.value) : textOf(props.children),
      label: props.children,
      disabled: props.disabled,
    });
  });
  return options;
}

const triggerBase =
  "group flex h-9 w-auto min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 text-left text-sm font-normal whitespace-nowrap text-stone-800 outline-none transition-[border-color,box-shadow,background-color] hover:border-stone-300 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/25 data-[state=open]:border-emerald-500 data-[state=open]:ring-2 data-[state=open]:ring-emerald-500/25 data-[placeholder]:text-stone-400 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rose-300";

const contentBase =
  "z-[70] max-h-[min(var(--radix-select-content-available-height),20rem)] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1.5rem)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-xl border border-stone-200 bg-white text-stone-800 shadow-lg shadow-stone-900/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1";

const itemBase =
  "relative flex min-h-9 cursor-pointer select-none items-center rounded-lg py-1.5 pl-3 pr-9 text-sm text-stone-700 outline-none scroll-my-1.5 data-[highlighted]:bg-stone-100 data-[highlighted]:text-stone-900 data-[state=checked]:bg-emerald-50 data-[state=checked]:font-medium data-[state=checked]:text-emerald-800 data-[state=checked]:data-[highlighted]:bg-emerald-100/70 data-[disabled]:cursor-not-allowed data-[disabled]:text-stone-400 pointer-coarse:min-h-11";

const scrollButton = "flex h-6 cursor-default items-center justify-center bg-white text-stone-400";

export function SelectMenu({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  contentClassName,
  placeholder,
  disabled,
  required,
  name,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: SelectMenuProps) {
  const options = readOptions(children);
  const hasEmpty = options.some((option) => option.value === "");
  const toRadix = (next: string | undefined) => (next === "" && hasEmpty ? EMPTY : next);

  return (
    <SelectPrimitive.Root
      value={toRadix(value)}
      defaultValue={toRadix(defaultValue)}
      onValueChange={(next) => onValueChange?.(next === EMPTY ? "" : next)}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectPrimitive.Trigger id={id} aria-label={ariaLabel} aria-invalid={ariaInvalid || undefined} className={cn(triggerBase, className)}>
        {/* Every label sits in the same grid cell, so the control keeps the width of its longest option, as a native select does. */}
        <span className="grid min-w-0 flex-1 overflow-hidden">
          <span className="col-start-1 row-start-1 truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
          {options.map((option) => (
            <span key={option.value || EMPTY} aria-hidden className="invisible col-start-1 row-start-1 h-0 truncate">{option.label}</span>
          ))}
          {placeholder && <span aria-hidden className="invisible col-start-1 row-start-1 h-0 truncate">{placeholder}</span>}
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-stone-400 transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          // Escape closes just this list, not the dialog or drawer the select sits in.
          onEscapeKeyDown={(event) => event.stopPropagation()}
          className={cn(contentBase, contentClassName)}
        >
          <SelectPrimitive.ScrollUpButton className={scrollButton}><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value || EMPTY} value={option.value === "" ? EMPTY : option.value} disabled={option.disabled} className={itemBase}>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center">
                  <Check className="size-4 text-emerald-600" strokeWidth={2.5} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className={scrollButton}><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

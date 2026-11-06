// Select.tsx — Shared native select with a predictable accessible control shape.
import type { SelectHTMLAttributes } from "react";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/utils";
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  filterStyle?: boolean;
}
// Render a keyboard-native select using the shared design tokens.
export function Select({
  options,
  placeholder,
  className,
  filterStyle = false,
  ...props
}: SelectProps) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className={cn("field-control appearance-none", filterStyle ? "pl-9 pr-3" : "pr-9", className)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        className={cn("pointer-events-none absolute top-3", filterStyle ? "left-3 text-foreground" : "right-3 text-muted-foreground")}
      />
    </div>
  );
}

// FormField.tsx — Consistent form labels, errors and invalid-field animation.
import type { ReactNode } from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}
// Bind a field's label and error description to its control.
export function FormField({
  id,
  label,
  error,
  children,
  hint,
}: FormFieldProps) {
  return (
    <Field
      data-invalid={!!error}
      className={cn("gap-2", error && "invalid-field")}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {error ? (
        <FieldDescription
          id={`${id}-error`}
          className="text-destructive"
          role="alert"
        >
          {error}
        </FieldDescription>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}

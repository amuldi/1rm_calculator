import React from "react";
import { cn } from "@/lib/utils";

export const Field = React.forwardRef(function Field(
  { label, hint, error, className, inputClassName, as: Tag = "input", children, ...inputProps },
  ref
) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="label">{label}</label>}
      <Tag
        ref={ref}
        className={cn("field", inputClassName)}
        style={error ? { borderColor: "var(--red-border)" } : undefined}
        {...inputProps}
      >
        {children}
      </Tag>
      {hint && !error && (
        <p className="text-xs" style={{ color: "var(--text-2)" }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>
      )}
    </div>
  );
});

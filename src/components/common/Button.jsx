import React from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASS = {
  accent: "btn-accent",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const SIZE_CLASS = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-sm",
};

export function Button({
  variant = "accent",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(VARIANT_CLASS[variant] || VARIANT_CLASS.accent, SIZE_CLASS[size] || SIZE_CLASS.md, className)}
      {...props}
    >
      {children}
    </button>
  );
}

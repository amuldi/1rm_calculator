import React from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASS = {
  default: "card",
  soft: "card-soft",
  accent: "card-accent",
};

export function Card({ variant = "default", className, children, ...props }) {
  return (
    <div className={cn(VARIANT_CLASS[variant] || VARIANT_CLASS.default, className)} {...props}>
      {children}
    </div>
  );
}

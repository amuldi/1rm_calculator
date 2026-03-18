import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const TREND_ICON = { up: TrendingUp, down: TrendingDown, stable: Minus };
const TREND_COLOR = {
  up:     "var(--accent)",
  down:   "var(--red)",
  stable: "var(--text-3)",
};

export function StatsCard({ label, value, unit, sub, trend, accent, icon: Icon, delay = 0 }) {
  const TrendIcon = trend ? TREND_ICON[trend] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={accent ? "card-accent p-5 flex flex-col gap-3" : "card p-5 flex flex-col gap-3"}
    >
      <div className="flex items-center justify-between">
        <span className="section-label">{label}</span>
        <div className="flex items-center gap-1.5">
          {TrendIcon && (
            <TrendIcon size={13} style={{ color: TREND_COLOR[trend] }} />
          )}
          {Icon && <Icon size={15} style={{ color: "var(--text-3)" }} />}
        </div>
      </div>

      <div>
        <div
          className="text-3xl font-black tracking-tight leading-none"
          style={{ color: accent ? "var(--accent)" : "var(--text-1)" }}
        >
          {value ?? "—"}
          {unit && (
            <span className="text-base font-semibold ml-1.5" style={{ color: "var(--text-2)" }}>
              {unit}
            </span>
          )}
        </div>
        {sub && (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-2)" }}>{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

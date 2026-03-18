import React from "react";
import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import { EXERCISES } from "@/constants/exercises";
import { formatDate } from "@/lib/utils";

export function PRBoard({ prMap, unit }) {
  const prs = EXERCISES.filter((ex) => prMap[ex.id]).map((ex) => ({
    ...ex,
    record: prMap[ex.id],
  }));

  if (!prs.length) {
    return (
      <div className="card p-6 text-center space-y-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <Trophy size={20} style={{ color: "var(--text-3)" }} />
        </div>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>아직 기록이 없습니다.</p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>1RM을 계산하면 여기에 기록됩니다.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Trophy size={15} style={{ color: "var(--accent)" }} />
        <span className="section-label">종목별 최고 기록</span>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {prs.map((ex, i) => {
          const isTopPR = i === 0 && prs.every((p) => ex.record.rm >= p.record.rm);
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between px-5 py-3.5 transition-colors"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
                  style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
                >
                  {ex.abbr}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{ex.label}</p>
                    {isTopPR && <Star size={11} style={{ color: "var(--accent)", fill: "var(--accent)" }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                    {formatDate(ex.record.date)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-black tabular-nums" style={{ color: "var(--text-1)" }}>
                  {ex.record.rm}
                  <span className="text-sm font-normal ml-1" style={{ color: "var(--text-2)" }}>
                    {ex.record.unit}
                  </span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-2)" }}>
                  {ex.record.weight}{ex.record.unit} × {ex.record.reps}회
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

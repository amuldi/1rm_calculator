import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import { VolumeChart } from "./components/VolumeChart";
import { StrengthCurve } from "./components/StrengthCurve";
import { TrendSummary } from "./components/TrendSummary";
import { useWorkoutStore } from "@/store/workoutStore";
import { useUIStore } from "@/store/uiStore";
import { getVolumeByDate } from "@/lib/utils";

const PERIODS = [
  { label: "7일",  value: 7 },
  { label: "30일", value: 30 },
  { label: "3개월", value: 90 },
  { label: "전체", value: 0 },
];

export default function AnalyticsPage() {
  const { history } = useWorkoutStore();
  const { unit } = useUIStore();
  const [period, setPeriod] = useState(30);

  const filtered = useMemo(() => {
    if (!period) return history;
    const cutoff = Date.now() - period * 86400000;
    return history.filter((r) => new Date(r.date).getTime() >= cutoff);
  }, [history, period]);

  const volumeData     = useMemo(() => getVolumeByDate(filtered), [filtered]);
  const groupedHistory = useMemo(() => {
    const groups = {};
    for (const r of filtered) {
      if (!groups[r.exerciseId]) groups[r.exerciseId] = [];
      groups[r.exerciseId].push(r);
    }
    return groups;
  }, [filtered]);

  const summary = useMemo(() => {
    if (!filtered.length) return null;
    const sessions = new Set(filtered.map((r) => r.date?.split("T")[0])).size;
    const volume   = Math.round(filtered.reduce((s, r) => s + r.weight * r.reps, 0));
    const avgRM    = (filtered.reduce((s, r) => s + r.rm, 0) / filtered.length).toFixed(1);
    return { sessions, volume, avgRM };
  }, [filtered]);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header + period picker */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>분석</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>기간별 운동 통계</p>
          </div>
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  color: period === p.value ? "#060912" : "var(--text-2)",
                }}
              >
                {period === p.value && (
                  <motion.div
                    layoutId="period-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "var(--accent)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!filtered.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center space-y-3"
          >
            <BarChart2 size={32} style={{ color: "var(--text-3)", margin: "0 auto" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>해당 기간에 기록이 없습니다</p>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>다른 기간을 선택하거나 운동을 기록하세요.</p>
          </motion.div>
        ) : (
          <>
            {/* Summary strip */}
            {summary && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "세션",    value: summary.sessions },
                  { label: "총 볼륨", value: summary.volume.toLocaleString(), unit },
                  { label: "평균 1RM", value: summary.avgRM, unit },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="card p-4 text-center"
                  >
                    <p className="section-label mb-1.5">{s.label}</p>
                    <p className="text-xl font-black tabular-nums leading-none" style={{ color: "var(--text-1)" }}>
                      {s.value}
                      {s.unit && (
                        <span className="text-xs font-normal ml-1" style={{ color: "var(--text-2)" }}>{s.unit}</span>
                      )}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {volumeData.length > 1 && <VolumeChart data={volumeData} unit={unit} />}
            {Object.keys(groupedHistory).length > 0 && <StrengthCurve groupedHistory={groupedHistory} />}
            <TrendSummary groupedHistory={groupedHistory} />
          </>
        )}
      </div>
    </div>
  );
}

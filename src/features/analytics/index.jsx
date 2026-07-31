import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VolumeChart } from "./components/VolumeChart";
import { StrengthCurve } from "./components/StrengthCurve";
import { TrendSummary } from "./components/TrendSummary";
import { NutritionTrendChart } from "./components/NutritionTrendChart";
import { useWorkoutStore } from "@/store/workoutStore";
import { useUIStore } from "@/store/uiStore";
import { useNutritionStore } from "@/store/nutritionStore";
import { EXERCISE_MAP } from "@/constants/exercises";
import { getEmptyAnalyticsCopy } from "@/lib/onboarding";
import {
  getDisplayWeightFromKg,
  getRecordRMKg,
  getRecordVolume,
  getVolumeByDate,
} from "@/lib/utils";

const PERIODS = [
  { label: "7일", value: 7 },
  { label: "30일", value: 30 },
  { label: "3개월", value: 90 },
  { label: "전체", value: 0 },
];

function buildInsight(filtered, unit) {
  if (filtered.length < 2) return "기록이 쌓이면 최근 변화와 강점 종목을 요약해드립니다.";

  const byExercise = {};
  for (const record of filtered) {
    if (!byExercise[record.exerciseId]) byExercise[record.exerciseId] = [];
    byExercise[record.exerciseId].push(record);
  }

  const ranked = Object.entries(byExercise)
    .map(([exerciseId, records]) => {
      const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = getRecordRMKg(sorted[0]);
      const last = getRecordRMKg(sorted[sorted.length - 1]);
      return { exerciseId, count: records.length, deltaKg: last - first };
    })
    .sort((a, b) => b.deltaKg - a.deltaKg);

  const best = ranked[0];
  const volume = Math.round(filtered.reduce((sum, record) => sum + getRecordVolume(record, unit), 0));
  if (!best || Math.abs(best.deltaKg) < 0.5) {
    return `총 볼륨 ${volume.toLocaleString()} ${unit}를 기록했고, 1RM 흐름은 전반적으로 유지 중입니다.`;
  }

  const direction = best.deltaKg > 0 ? "상승" : "하락";
  const delta = getDisplayWeightFromKg(Math.abs(best.deltaKg), unit);
  const label = EXERCISE_MAP[best.exerciseId]?.labelKo || best.exerciseId.replace(/-/g, " ");
  return `가장 큰 변화는 ${label}이며, 기간 내 1RM이 ${delta} ${unit} ${direction}했습니다.`;
}

function buildQualityInsight(filtered) {
  if (!filtered.length) return null;

  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const prByExercise = {};
  let latestPR = null;
  for (const record of sorted) {
    const rmKg = getRecordRMKg(record);
    const previous = prByExercise[record.exerciseId] ?? 0;
    if (rmKg >= previous) {
      prByExercise[record.exerciseId] = rmKg;
      latestPR = record;
    }
  }

  const rpeRecords = filtered
    .map((record) => Number(record.rpe))
    .filter((value) => Number.isFinite(value) && value > 0);
  const avgRpe = rpeRecords.length
    ? rpeRecords.reduce((sum, value) => sum + value, 0) / rpeRecords.length
    : null;
  const fatigueLabel = avgRpe == null
    ? "RPE 기록이 쌓이면 피로도 해석을 제공합니다."
    : avgRpe >= 8.5
      ? `평균 RPE ${avgRpe.toFixed(1)}로 강도가 높습니다. 회복 상태를 함께 확인하세요.`
      : avgRpe <= 6.5
        ? `평균 RPE ${avgRpe.toFixed(1)}로 여유가 있습니다. 점진적 증량 여지가 있습니다.`
        : `평균 RPE ${avgRpe.toFixed(1)}로 관리 가능한 강도입니다.`;

  if (!latestPR) return fatigueLabel;
  const label = EXERCISE_MAP[latestPR.exerciseId]?.labelKo || latestPR.exerciseId?.replace(/-/g, " ");
  const date = latestPR.date ? latestPR.date.split("T")[0] : "최근";
  return `최근 PR 후보는 ${label} (${date})입니다. ${fatigueLabel}`;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { history } = useWorkoutStore();
  const { unit } = useUIStore();
  const { meals: nutritionMeals, getRecentDailyTotals, goal: nutritionGoal } = useNutritionStore();
  const [period, setPeriod] = useState(30);
  const nutritionTrend = useMemo(() => getRecentDailyTotals(7), [getRecentDailyTotals, nutritionMeals]);

  const filtered = useMemo(() => {
    if (!period) return history;
    const cutoff = Date.now() - period * 86400000;
    return history.filter((r) => new Date(r.date).getTime() >= cutoff);
  }, [history, period]);

  const volumeData = useMemo(() => getVolumeByDate(filtered, unit), [filtered, unit]);
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
    const volume = Math.round(filtered.reduce((sum, record) => sum + getRecordVolume(record, unit), 0));
    const avgRMKg = filtered.reduce((sum, record) => sum + getRecordRMKg(record), 0) / filtered.length;
    const avgRM = getDisplayWeightFromKg(avgRMKg, unit).toFixed(1);
    return { sessions, volume, avgRM };
  }, [filtered, unit]);
  const insight = useMemo(() => buildInsight(filtered, unit), [filtered, unit]);
  const qualityInsight = useMemo(() => buildQualityInsight(filtered), [filtered]);
  const periodLabel = PERIODS.find((item) => item.value === period)?.label || "선택한 기간";
  const emptyCopy = useMemo(() => getEmptyAnalyticsCopy(periodLabel), [periodLabel]);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>분석</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>기간별 운동 통계</p>
          </div>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--control-bg)" }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="relative px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  color: period === p.value ? "var(--text-on-accent)" : "var(--text-2)",
                }}
              >
                {period === p.value && (
                  <motion.div
                    layoutId="period-pill"
                    className="absolute inset-0 rounded-md"
                    style={{ background: "var(--accent)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {nutritionTrend.length > 1 && (
          <NutritionTrendChart data={nutritionTrend} calorieTarget={nutritionGoal?.calorieTarget} />
        )}

        {!filtered.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center space-y-3"
          >
            <BarChart2 size={32} style={{ color: "var(--text-3)", margin: "0 auto" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{emptyCopy.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{emptyCopy.body}</p>
            <button
              type="button"
              onClick={() => navigate("/calculator")}
              className="btn-accent px-4 py-2 text-xs mx-auto"
            >
              {emptyCopy.action}
              <ChevronRight size={13} />
            </button>
          </motion.div>
        ) : (
          <>
            {summary && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "세션", value: summary.sessions },
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
                <div className="card p-4">
                  <p className="section-label mb-1.5">최근 해석</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-1)" }}>{insight}</p>
                  {qualityInsight && (
                    <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--text-2)" }}>
                      {qualityInsight}
                    </p>
                  )}
                </div>
              </>
            )}

            {volumeData.length > 1 && <VolumeChart data={volumeData} unit={unit} />}
            {Object.keys(groupedHistory).length > 0 && <StrengthCurve groupedHistory={groupedHistory} unit={unit} />}
            <TrendSummary groupedHistory={groupedHistory} unit={unit} />
          </>
        )}
      </div>
    </div>
  );
}

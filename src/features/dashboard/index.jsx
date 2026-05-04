import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Dumbbell, ChevronRight, Flame, Activity, BarChart2 } from "lucide-react";
import { StatsCard } from "./components/StatsCard";
import { PRBoard } from "./components/PRBoard";
import { GoalProgress } from "./components/GoalProgress";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGoalStore } from "@/store/goalStore";
import { useUIStore } from "@/store/uiStore";
import { EXERCISE_MAP } from "@/constants/exercises";
import { getRecordDisplay, getRecordRMKg, getRecordVolume, getTrend } from "@/lib/utils";

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { history, getPRByExercise, getWeeklyVolume, getStreakDays } = useWorkoutStore();
  const { goals } = useGoalStore();
  const { unit } = useUIStore();

  const prMap = useMemo(() => getPRByExercise(), [history]);
  const weeklyVol = useMemo(() => Math.round(getWeeklyVolume(unit)), [getWeeklyVolume, history, unit]);
  const streak = useMemo(() => getStreakDays(), [getStreakDays, history]);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const last = getRecordDisplay(history[0], unit);
    const chronological = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const trend = getTrend(chronological.slice(-10).map((r) => getRecordRMKg(r)));
    const totalVol = Math.round(history.reduce((sum, record) => sum + getRecordVolume(record, unit), 0));
    return { last, trend, totalVol };
  }, [history, unit]);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-6">

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-0.5"
        >
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
            {format(new Date(), "yyyy년 M월 d일")}
          </p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>{GREETING()}</h1>
          {history.length > 0 && (
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              총 {history.length}회 세션 기록됨
            </p>
          )}
        </motion.div>

        {!history.length ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="card p-10 text-center space-y-5"
          >
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto"
              style={{ background: "var(--accent-faint)", border: "1px solid var(--accent-border)" }}
            >
              <Dumbbell size={28} style={{ color: "var(--accent)" }} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>첫 기록을 시작하세요</h2>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                1RM을 계산하면 대시보드에 운동 기록과 통계가 표시됩니다.
              </p>
            </div>
            <button
              onClick={() => navigate("/calculator")}
              className="btn-accent px-6 py-2.5 text-sm mx-auto flex items-center gap-2"
            >
              <Dumbbell size={16} />
              1RM 계산하기
              <ChevronRight size={14} />
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard label="마지막 1RM" value={stats?.last?.rm} unit={unit} sub={stats?.last ? format(new Date(stats.last.date), "M/d") : null} trend={stats?.trend} accent delay={0} />
              <StatsCard label="이번 주 볼륨" value={weeklyVol > 0 ? weeklyVol.toLocaleString() : "—"} unit={weeklyVol > 0 ? unit : undefined} sub="7일 합산" icon={Activity} delay={0.05} />
              <StatsCard label="연속 운동" value={streak || "—"} unit={streak ? "일" : undefined} sub={streak ? "현재 스트릭" : "기록 없음"} icon={Flame} delay={0.1} />
              <StatsCard label="총 볼륨" value={stats?.totalVol?.toLocaleString()} unit={unit} sub="전체 기간" icon={BarChart2} delay={0.15} />
            </div>

            <PRBoard prMap={prMap} unit={unit} />
            <GoalProgress goals={goals} prMap={prMap} unit={unit} />

            <div className="card overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <span className="section-label">최근 세션</span>
                <button
                  onClick={() => navigate("/calculator")}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  전체 보기
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {history.slice(0, 5).map((record, i) => {
                  const r = getRecordDisplay(record, unit);
                  const exercise = EXERCISE_MAP[r.exerciseId];
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                          {exercise?.labelKo || r.exerciseId?.replace(/-/g, " ")}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                          {r.weight}{unit} × {r.reps}회 · {format(new Date(r.date), "M/d")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black tabular-nums" style={{ color: "var(--text-1)" }}>
                          {r.rm}
                          <span className="text-xs font-normal ml-1" style={{ color: "var(--text-2)" }}>{unit}</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => navigate("/calculator")}
              className="w-full btn-accent py-3.5 text-sm"
            >
              <Dumbbell size={16} />
              새 세션 기록하기
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}

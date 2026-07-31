import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Trash2, Scale, Info,
  Download, Upload, CheckCircle2, AlertCircle, Cloud,
} from "lucide-react";
import { format } from "date-fns";
import { useUIStore } from "@/store/uiStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGoalStore } from "@/store/goalStore";
import { useNutritionStore } from "@/store/nutritionStore";
import { useAuthStore } from "@/store/authStore";
import { useSyncStore } from "@/store/syncStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import { createBackupPayload, parseBackupPayload } from "@/lib/backup";
import { getSyncSummary, isValidSyncTime } from "@/lib/syncFeedback";
import { getSyncStatus } from "@/lib/syncConfig";
import { syncUserData } from "@/lib/syncService";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

function Row({ icon: Icon, label, children, border = true }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={border ? { borderBottom: "1px solid var(--border-subtle)" } : {}}
    >
      <div className="flex items-center gap-3">
        <Icon size={17} style={{ color: "var(--text-3)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Toast({ msg, type = "ok" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold"
      style={{
        background: "var(--card)",
        border: `1px solid ${type === "ok" ? "var(--accent-border)" : "var(--red-border)"}`,
        color: type === "ok" ? "var(--text-1)" : "var(--red)",
      }}
    >
      {type === "ok"
        ? <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
        : <AlertCircle size={16} style={{ color: "var(--red)" }} />
      }
      {msg}
    </motion.div>
  );
}

export default function ProfilePage() {
  useDocumentMeta({
    title: "프로필 | 설정 및 데이터 관리",
    description: "단위, 테마, 백업/복원, 계정 동기화 상태를 관리합니다.",
  });
  const { unit, setUnit } = useUIStore();
  const { isDark, toggle } = useDarkMode();
  const { history, deletedRecords, clearHistory, importHistory, importDeletedRecords } = useWorkoutStore();
  const { goals, deletedGoals, importGoals, importDeletedGoals } = useGoalStore();
  const {
    meals, deletedMeals, goal: nutritionGoal, favorites,
    importMeals, importDeletedMeals, importGoal: importNutritionGoal, importFavorites,
  } = useNutritionStore();
  const {
    status: authStatus,
    user,
    error: authError,
    initializeAuth,
    signInWithGoogle,
    signOutUser,
  } = useAuthStore();
  const {
    lastSyncedAt,
    lastSyncStats,
    lastSyncError,
    markSyncSuccess,
    markSyncError,
  } = useSyncStore();
  const fileRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const syncStatus = getSyncStatus();
  const hasLastSync = isValidSyncTime(lastSyncedAt);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleExport = () => {
    const data = createBackupPayload({
      history, goals, deletedRecords, deletedGoals,
      meals, nutritionGoal, deletedMeals, favorites,
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `1rm-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("백업 파일이 다운로드되었습니다.");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const parsed = parseBackupPayload(data);
        importHistory(parsed.history);
        importGoals(parsed.goals);
        importDeletedRecords(parsed.deletedRecords);
        importDeletedGoals(parsed.deletedGoals);
        importMeals(parsed.meals);
        importNutritionGoal(parsed.nutritionGoal);
        importDeletedMeals(parsed.deletedMeals);
        importFavorites(parsed.favorites);
        const skipped = parsed.stats.droppedRecords ? ` · ${parsed.stats.droppedRecords}개 제외` : "";
        const mealPart = parsed.stats.mealCount ? `, 식사 ${parsed.stats.mealCount}개` : "";
        showToast(`${parsed.stats.recordCount}개 기록, 목표 ${parsed.stats.goalCount}개${mealPart}를 불러왔습니다${skipped}.`);
      } catch (error) {
        showToast(error?.message || "파일 형식이 올바르지 않습니다.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClear = () => {
    if (!window.confirm("모든 운동 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    clearHistory();
    showToast("기록이 삭제되었습니다.");
  };

  const handleSync = async () => {
    if (!user?.uid) {
      showToast("로그인 후 동기화할 수 있습니다.", "error");
      return;
    }
    setSyncing(true);
    try {
      const result = await syncUserData({ uid: user.uid, history, goals, deletedRecords, deletedGoals });
      importHistory(result.history);
      importGoals(result.goals);
      importDeletedRecords(result.deletedRecords);
      importDeletedGoals(result.deletedGoals);
      markSyncSuccess(result.stats);
      showToast(`${result.stats.recordCount}개 기록, 목표 ${result.stats.goalCount}개를 동기화했습니다.`);
    } catch (error) {
      const message = error?.message || "동기화에 실패했습니다.";
      markSyncError(message);
      showToast(message, "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>프로필</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>환경설정 및 데이터 관리</p>
        </div>

        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 flex items-center gap-4"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0"
            style={{
              background: "var(--accent-faint)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent)",
            }}
          >
            1RM
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>1RM 계산기</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
              {history.length}개 기록 · 목표 {Object.keys(goals).length}개 · 식사 {meals.length}개
            </p>
          </div>
        </motion.div>

        {/* Service readiness */}
        <div className="card px-5 py-1">
          <p className="section-label pt-4 pb-2">서비스 상태</p>
          <Row icon={Cloud} label="계정 동기화" border={false}>
            <div className="text-right max-w-[220px]">
              <span
                className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold"
                style={{
                  background: syncStatus.configured ? "var(--accent-faint)" : "var(--control-bg)",
                  color: syncStatus.configured ? "var(--accent)" : "var(--text-2)",
                  border: `1px solid ${syncStatus.configured ? "var(--accent-border)" : "var(--border-subtle)"}`,
                }}
              >
                {syncStatus.configured ? "준비됨" : "로컬 모드"}
              </span>
              <p className="text-xs leading-relaxed mt-1.5" style={{ color: "var(--text-2)" }}>
                {syncStatus.message}
              </p>
              {user && (
                <p className="text-xs mt-1" style={{ color: "var(--text-1)" }}>
                  {user.email || user.displayName || "로그인됨"}
                </p>
              )}
              {authError && (
                <p className="text-xs mt-1" style={{ color: "var(--red)" }}>
                  {authError}
                </p>
              )}
              {hasLastSync && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-2)" }}>
                  마지막 동기화 {format(new Date(lastSyncedAt), "yyyy. M. d. HH:mm")}
                  {lastSyncStats ? ` · ${getSyncSummary(lastSyncStats)}` : ""}
                </p>
              )}
              {lastSyncError && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--red)" }}>
                  최근 오류: {lastSyncError}
                </p>
              )}
              <div className="flex justify-end gap-2 mt-3 flex-wrap">
                {!syncStatus.configured ? null : user ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing}
                      className="btn-accent text-xs px-3 py-2"
                    >
                      {syncing ? "동기화 중" : "동기화"}
                    </button>
                    <button type="button" onClick={signOutUser} className="btn-ghost text-xs px-3 py-2">
                      로그아웃
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={authStatus === "loading"}
                    className="btn-accent text-xs px-3 py-2"
                  >
                    {authStatus === "loading" ? "로그인 중" : "Google 로그인"}
                  </button>
                )}
              </div>
            </div>
          </Row>
        </div>

        {/* Preferences */}
        <div className="card px-5 py-1">
          <p className="section-label pt-4 pb-2">환경설정</p>
          <Row icon={Scale} label="무게 단위">
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--control-bg)" }}>
              {["kg", "lb"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: unit === u ? "var(--accent)" : "transparent",
                    color:      unit === u ? "var(--text-on-accent)" : "var(--text-2)",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </Row>
          <Row icon={isDark ? Moon : Sun} label="화면 테마" border={false}>
            <button
              onClick={toggle}
              className="relative w-11 h-6 rounded-full transition-colors duration-300"
              style={{ background: isDark ? "var(--accent)" : "var(--control-active)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
                style={{ transform: isDark ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </Row>
        </div>

        {/* Data */}
        <div className="card px-5 py-1">
          <p className="section-label pt-4 pb-2">데이터</p>
          <Row icon={Download} label="데이터 백업 (JSON 내보내기)">
            <button onClick={handleExport} className="btn-ghost text-xs px-3 py-2">내보내기</button>
          </Row>
          <Row icon={Upload} label="데이터 복원 (JSON 가져오기)">
            <>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs px-3 py-2">가져오기</button>
            </>
          </Row>
          <Row icon={Trash2} label="모든 기록 삭제" border={false}>
            <button onClick={handleClear} disabled={!history.length} className="btn-danger text-xs px-3 py-2 disabled:opacity-30">
              삭제
            </button>
          </Row>
        </div>

        {/* App info */}
        <div className="card px-5 py-1">
          <p className="section-label pt-4 pb-2">앱 정보</p>
          {[
            ["버전", "2.0.0"],
            ["총 기록 수", `${history.length}개`],
            ["설정된 목표", `${Object.keys(goals).length}개`],
          ].map(([k, v], i, arr) => (
            <Row key={k} icon={Info} label={k} border={i < arr.length - 1}>
              <span className="text-sm" style={{ color: "var(--text-2)" }}>{v}</span>
            </Row>
          ))}
          <Row icon={Info} label="데이터 처리 안내">
            <Link to="/privacy" className="btn-ghost text-xs px-3 py-2">
              보기
            </Link>
          </Row>
          <Row icon={Info} label="출시 준비도">
            <Link to="/readiness" className="btn-ghost text-xs px-3 py-2">
              확인
            </Link>
          </Row>
          <Row icon={Info} label="진단 정보" border={false}>
            <Link to="/diagnostics" className="btn-ghost text-xs px-3 py-2">
              보기
            </Link>
          </Row>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}

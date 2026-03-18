import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Trash2, Scale, Info,
  Download, Upload, CheckCircle2, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useUIStore } from "@/store/uiStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGoalStore } from "@/store/goalStore";
import { useDarkMode } from "@/hooks/useDarkMode";

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
  const { unit, setUnit } = useUIStore();
  const { isDark, toggle } = useDarkMode();
  const { history, clearHistory, importHistory } = useWorkoutStore();
  const { goals, importGoals } = useGoalStore();
  const fileRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleExport = () => {
    const data = { version: "2.0", exportedAt: new Date().toISOString(), history, goals };
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
        if (!data.history && !data.goals) throw new Error("invalid");
        if (data.history) importHistory(data.history);
        if (data.goals) importGoals(data.goals);
        showToast(`${data.history?.length ?? 0}개 기록을 불러왔습니다.`);
      } catch {
        showToast("파일 형식이 올바르지 않습니다.", "error");
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
              {history.length}개 기록 · 목표 {Object.keys(goals).length}개
            </p>
          </div>
        </motion.div>

        {/* Preferences */}
        <div className="card px-5 py-1">
          <p className="section-label pt-4 pb-2">환경설정</p>
          <Row icon={Scale} label="무게 단위">
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
              {["kg", "lb"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: unit === u ? "var(--accent)" : "transparent",
                    color:      unit === u ? "#060912" : "var(--text-2)",
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
              style={{ background: isDark ? "var(--accent)" : "rgba(255,255,255,0.15)" }}
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
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}

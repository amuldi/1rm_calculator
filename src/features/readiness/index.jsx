import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleDashed, KeyRound, Rocket, ShieldAlert } from "lucide-react";
import {
  getFirebaseEnvReadiness,
  getReadinessStatusLabel,
  getReleaseReadiness,
  RELEASE_SETUP_STEPS,
} from "@/lib/releaseReadiness";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const KNOWN_LOCAL_CHECKS = {
  ci: true,
  "release-preflight": true,
  "performance-budget": true,
  privacy: true,
  "firestore-rules": true,
};

export default function ReadinessPage() {
  useDocumentMeta({
    title: "출시 준비도 | 1RM 계산기",
    description: "배포 전 확인이 필요한 환경 변수, 보안 규칙, CI, QA 항목을 점검합니다.",
    noindex: true,
  });
  const readiness = getReleaseReadiness({
    env: import.meta.env,
    checks: KNOWN_LOCAL_CHECKS,
  });
  const firebaseEnv = getFirebaseEnvReadiness(import.meta.env);
  const statusLabel = getReadinessStatusLabel(readiness);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <Link to="/profile" className="btn-ghost text-xs px-3 py-2 mb-5">
            <ArrowLeft size={14} />
            프로필
          </Link>
          <p className="section-label mb-2">Release Readiness</p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>
            출시 준비도
          </h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>
            실제 배포 전에 필요한 환경 변수, 보안 규칙, CI, QA, 성능 예산 항목을 한 화면에서 점검합니다.
          </p>
        </div>

        <div className="card-accent p-5 flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
          >
            <Rocket size={19} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              {statusLabel}
            </p>
            <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
              필수 항목 {readiness.totalRequired}개 중 {readiness.passedRequired}개가 현재 확인됐습니다.
              빌드, 테스트, 브라우저 QA는 배포 직전 명령 실행 결과와 CI 상태로 확인해야 합니다.
            </p>
          </div>
        </div>

        {(readiness.missingEnv.length > 0 || readiness.invalidEnv.length > 0) && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={16} style={{ color: "var(--red)" }} />
              <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                확인이 필요한 Firebase 환경 변수
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {readiness.missingEnv.map((key) => (
                <span
                  key={key}
                  className="text-[11px] font-bold px-2 py-1 rounded-md"
                  style={{
                    color: "var(--red)",
                    background: "var(--red-faint)",
                    border: "1px solid var(--red-border)",
                  }}
                >
                  {key} 누락
                </span>
              ))}
              {readiness.invalidEnv.map((item) => (
                <span
                  key={item.key}
                  className="text-[11px] font-bold px-2 py-1 rounded-md"
                  title={item.message}
                  style={{
                    color: "var(--red)",
                    background: "var(--red-faint)",
                    border: "1px solid var(--red-border)",
                  }}
                >
                  {item.key} 형식 오류
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} style={{ color: "var(--text-3)" }} />
            <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
              Firebase 설정값
            </h2>
          </div>
          <div className="space-y-3">
            {firebaseEnv.map((item) => (
              <div
                key={item.key}
                className="rounded-lg p-3"
                style={{
                  background: "var(--control-bg)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold break-all" style={{ color: "var(--text-1)" }}>
                      {item.key}
                    </p>
                    <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
                      {item.purpose}
                    </p>
                    <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-3)" }}>
                      {item.source}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-md shrink-0"
                    style={{
                      color: item.configured
                        ? "var(--accent)"
                        : item.invalid || item.required
                          ? "var(--red)"
                          : "var(--text-2)",
                      background: item.configured
                        ? "var(--accent-faint)"
                        : item.invalid || item.required
                          ? "var(--red-faint)"
                          : "var(--card)",
                      border: `1px solid ${
                        item.configured
                          ? "var(--accent-border)"
                          : item.invalid || item.required
                            ? "var(--red-border)"
                            : "var(--border-subtle)"
                      }`,
                    }}
                  >
                    {item.configured ? "설정됨" : item.invalid ? "형식 오류" : item.required ? "필수" : "선택"}
                  </span>
                </div>
                {item.invalid && item.message && (
                  <p className="text-[11px] leading-relaxed mt-2" style={{ color: "var(--red)" }}>
                    {item.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {readiness.items.map((item) => {
            const Icon = item.passed ? CheckCircle2 : CircleDashed;
            return (
              <div key={item.id} className="card p-5 flex items-start gap-3">
                <Icon
                  size={18}
                  className="mt-0.5 shrink-0"
                  style={{ color: item.passed ? "var(--accent)" : "var(--text-3)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                      {item.label}
                    </p>
                    <span
                      className="text-[11px] font-bold px-2 py-1 rounded-md shrink-0"
                      style={{
                        color: item.passed ? "var(--accent)" : "var(--text-2)",
                        background: item.passed ? "var(--accent-faint)" : "var(--control-bg)",
                        border: `1px solid ${item.passed ? "var(--accent-border)" : "var(--border-subtle)"}`,
                      }}
                    >
                      {item.passed ? "확인됨" : "확인 필요"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
                    {item.evidence}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            다음 실행 순서
          </p>
          <ol className="mt-3 space-y-2">
            {RELEASE_SETUP_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    background: "var(--control-bg)",
                    color: "var(--text-1)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

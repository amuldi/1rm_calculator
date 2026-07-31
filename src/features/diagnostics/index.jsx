import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bug, Copy, Download, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  createDiagnosticsPayload,
  getDiagnosticsSummary,
  getDiagnosticsSupportCopy,
  serializeDiagnosticsPayload,
} from "@/lib/diagnostics";
import { getSyncStatus } from "@/lib/syncConfig";
import { getSupportConfig } from "@/lib/supportConfig";
import { useDiagnosticStore } from "@/store/diagnosticStore";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const APP_VERSION = "2.0.0";

export default function DiagnosticsPage() {
  useDocumentMeta({
    title: "진단 정보 | 1RM 계산기",
    description: "최근 런타임 오류와 동기화 상태를 확인하고 지원 패키지를 내려받습니다.",
    noindex: true,
  });
  const { events, clearEvents } = useDiagnosticStore();
  const syncStatus = getSyncStatus();
  const support = getSupportConfig(import.meta.env);
  const payload = createDiagnosticsPayload({
    events,
    appVersion: APP_VERSION,
    syncStatus,
    runtime: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      path: window.location.pathname,
    },
  });
  const serializedPayload = serializeDiagnosticsPayload(payload);
  const supportCopy = getDiagnosticsSupportCopy({ support, payload });

  const handleDownload = () => {
    const blob = new Blob([serializedPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `1rm-diagnostics-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(serializedPayload);
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <Link to="/profile" className="btn-ghost text-xs px-3 py-2 mb-5">
            <ArrowLeft size={14} />
            프로필
          </Link>
          <p className="section-label mb-2">Diagnostics</p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>
            진단 정보
          </h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>
            최근 앱 오류를 이 기기에 보관합니다. 외부 서버로 자동 전송하지 않습니다.
          </p>
        </div>

        <div className="card-accent p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
            >
              <Bug size={18} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                {getDiagnosticsSummary(events)}
              </p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
                문제가 반복되면 진단 패키지를 내려받거나 운영 문의에 함께 전달합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearEvents}
            disabled={!events.length}
            className="btn-ghost w-9 h-9 p-0 shrink-0 disabled:opacity-30"
            aria-label="진단 정보 삭제"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            지원 패키지
          </p>
          <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
            앱 버전, 브라우저 정보, 동기화 설정 상태, 최근 오류만 포함합니다. 운동 기록과 Firebase 비밀값은 포함하지 않습니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            <button type="button" onClick={handleDownload} className="btn-ghost justify-center text-xs px-3 py-2">
              <Download size={14} />
              JSON 다운로드
            </button>
            <button type="button" onClick={handleCopy} className="btn-ghost justify-center text-xs px-3 py-2">
              <Copy size={14} />
              복사
            </button>
            {supportCopy.href ? (
              <a href={supportCopy.href} className="btn-accent justify-center text-xs px-3 py-2">
                <Mail size={14} />
                {supportCopy.actionLabel}
              </a>
            ) : (
              <button type="button" disabled className="btn-ghost justify-center text-xs px-3 py-2 opacity-50">
                <Mail size={14} />
                {supportCopy.actionLabel}
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed mt-3" style={{ color: "var(--text-3)" }}>
            {supportCopy.message}
          </p>
        </div>

        <div className="space-y-3">
          {events.length ? events.map((event) => (
            <article key={event.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                  {event.type}
                </p>
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  {format(new Date(event.createdAt), "yyyy. M. d. HH:mm")}
                </span>
              </div>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-2)" }}>
                {event.message}
              </p>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-3)" }}>
                {event.source}
              </p>
            </article>
          )) : (
            <div className="card p-5">
              <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                저장된 오류가 없습니다
              </p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
                앱을 사용하는 동안 렌더링 오류나 처리되지 않은 런타임 오류가 발생하면 여기에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Database, Mail, ShieldCheck } from "lucide-react";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED_AT } from "@/lib/privacyContent";
import { getDeletionRequestCopy, getSupportConfig } from "@/lib/supportConfig";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function PrivacyPage() {
  useDocumentMeta({
    title: "데이터 처리 안내 | 1RM 계산기",
    description: "저장하는 데이터, 사용자 제어 방법, 삭제 요청 절차를 안내합니다.",
  });
  const deletionRequest = getDeletionRequestCopy(getSupportConfig(import.meta.env));

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <Link to="/profile" className="btn-ghost text-xs px-3 py-2 mb-5">
            <ArrowLeft size={14} />
            프로필
          </Link>
          <p className="section-label mb-2">Data & Privacy</p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>
            데이터 처리 안내
          </h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>
            1RM 계산기는 운동 기록을 계산과 분석에 필요한 범위로만 사용합니다.
            계정 동기화 전에는 데이터가 이 기기에 저장됩니다.
          </p>
        </div>

        <div className="card-accent p-5 flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              최소 수집 원칙
            </p>
            <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
              앱은 1RM 계산, 기록 분석, 백업, 계정 동기화에 필요한 데이터만 다룹니다.
              건강 상태를 진단하거나 의료 정보를 수집하지 않습니다.
            </p>
            <p className="text-[11px] mt-3" style={{ color: "var(--text-3)" }}>
              업데이트: {PRIVACY_UPDATED_AT}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.title} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database size={16} style={{ color: "var(--text-3)" }} />
                <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm leading-relaxed pl-3"
                    style={{ color: "var(--text-2)", borderLeft: "2px solid var(--border-subtle)" }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--control-bg)", color: "var(--text-2)" }}
            >
              <Mail size={16} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                {deletionRequest.title}
              </p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
                {deletionRequest.message}
              </p>
              {deletionRequest.href ? (
                <a href={deletionRequest.href} className="btn-accent text-xs px-3 py-2 mt-3">
                  {deletionRequest.actionLabel}
                </a>
              ) : (
                <span
                  className="inline-flex text-[11px] font-bold px-2 py-1 rounded-md mt-3"
                  style={{
                    color: "var(--text-2)",
                    background: "var(--control-bg)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {deletionRequest.actionLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

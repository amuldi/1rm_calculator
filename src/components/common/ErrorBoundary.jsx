import React from "react";
import { AlertCircle } from "lucide-react";
import { useDiagnosticStore } from "@/store/diagnosticStore";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    useDiagnosticStore.getState().recordEvent({
      type: "render",
      source: "ErrorBoundary",
      message: error?.message || "렌더링 오류",
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="card-accent p-6 max-w-sm w-full text-center">
          <AlertCircle size={28} className="mx-auto mb-3" style={{ color: "var(--red)" }} />
          <h1 className="text-lg font-black" style={{ color: "var(--text-1)" }}>
            화면을 불러오지 못했습니다
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-2)" }}>
            앱을 새로고침해 주세요. 오류 정보는 프로필의 진단 화면에 저장됩니다.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="btn-accent px-4 py-2 mt-4">
            새로고침
          </button>
        </div>
      </div>
    );
  }
}

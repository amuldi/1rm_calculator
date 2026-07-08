import React, { useEffect, useState } from "react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { getPWAStatusCopy } from "@/lib/pwaStatus";

export default function PWAStatus() {
  const [online, setOnline] = useState(() => (
    typeof navigator === "undefined" ? true : navigator.onLine
  ));
  const [dismissedTone, setDismissedTone] = useState("");
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW() {},
    onRegisterError() {},
  });

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const copy = getPWAStatusCopy({ online, needRefresh });
  if (!copy || dismissedTone === copy.tone) return null;

  const Icon = copy.tone === "offline" ? WifiOff : RefreshCw;

  return (
    <div className="fixed left-4 right-4 bottom-24 md:left-auto md:right-6 md:bottom-6 md:w-[360px] z-[120]">
      <div
        className="card-soft p-4 flex items-start gap-3"
        style={{
          borderColor: copy.tone === "update" ? "var(--accent-border)" : "var(--border-subtle)",
          boxShadow: "var(--shadow-menu)",
        }}
        role="status"
        aria-live="polite"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: copy.tone === "update" ? "var(--accent-faint)" : "var(--control-bg)",
            color: copy.tone === "update" ? "var(--accent)" : "var(--text-2)",
          }}
        >
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{copy.title}</p>
          <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-2)" }}>
            {copy.message}
          </p>
          {copy.action && (
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="btn-accent text-xs px-3 py-2 mt-3"
            >
              {copy.action}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissedTone(copy.tone)}
          className="btn-ghost w-8 h-8 p-0 shrink-0"
          aria-label="상태 알림 닫기"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

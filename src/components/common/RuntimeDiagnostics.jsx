import { useEffect } from "react";
import { useDiagnosticStore } from "@/store/diagnosticStore";

export default function RuntimeDiagnostics() {
  const recordEvent = useDiagnosticStore((state) => state.recordEvent);

  useEffect(() => {
    const handleError = (event) => {
      recordEvent({
        type: "runtime",
        source: event.filename || "window.error",
        message: event.message || event.error?.message || "런타임 오류",
      });
    };
    const handleRejection = (event) => {
      recordEvent({
        type: "promise",
        source: "unhandledrejection",
        message: event.reason?.message || String(event.reason || "처리되지 않은 비동기 오류"),
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [recordEvent]);

  return null;
}

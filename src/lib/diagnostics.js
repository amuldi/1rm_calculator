const MAX_DIAGNOSTIC_EVENTS = 20;
const DIAGNOSTICS_SCHEMA_VERSION = 1;

export function normalizeDiagnosticEvent(event = {}) {
  const now = new Date().toISOString();
  return {
    id: event.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type || "runtime",
    message: String(event.message || "알 수 없는 오류"),
    source: event.source || "app",
    createdAt: event.createdAt || now,
  };
}

export function mergeDiagnosticEvents(events = [], nextEvent = {}) {
  const normalized = normalizeDiagnosticEvent(nextEvent);
  return [normalized, ...events]
    .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
    .slice(0, MAX_DIAGNOSTIC_EVENTS);
}

export function getDiagnosticsSummary(events = []) {
  if (!events.length) return "최근 오류 없음";
  return `최근 오류 ${events.length}건`;
}

export function createDiagnosticsPayload({
  events = [],
  appVersion = "unknown",
  syncStatus = {},
  now = new Date().toISOString(),
  runtime = {},
} = {}) {
  return {
    schemaVersion: DIAGNOSTICS_SCHEMA_VERSION,
    generatedAt: now,
    app: {
      name: "1rm-calculator",
      version: appVersion,
    },
    runtime: {
      userAgent: String(runtime.userAgent || ""),
      language: String(runtime.language || ""),
      online: Boolean(runtime.online),
      path: String(runtime.path || ""),
    },
    sync: {
      provider: syncStatus.provider || "firebase",
      mode: syncStatus.mode || "local",
      configured: Boolean(syncStatus.configured),
      missingKeys: Array.isArray(syncStatus.missing) ? syncStatus.missing : [],
      invalidKeys: Array.isArray(syncStatus.invalid) ? syncStatus.invalid : [],
      issueTypes: Array.isArray(syncStatus.issues)
        ? syncStatus.issues.map((issue) => ({ key: issue.key, type: issue.type }))
        : [],
    },
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      source: event.source,
      createdAt: event.createdAt,
    })),
  };
}

export function serializeDiagnosticsPayload(payload) {
  return JSON.stringify(payload, null, 2);
}

export function getDiagnosticsSupportCopy({ support = {}, payload = {} } = {}) {
  if (!support.configured) {
    return {
      actionLabel: "지원 메일 준비 필요",
      href: "",
      message: "운영 문의 이메일이 설정되면 진단 정보를 포함한 지원 메일을 작성할 수 있습니다.",
    };
  }

  const subject = encodeURIComponent("1RM Calculator 진단 정보 전달");
  const body = encodeURIComponent([
    "문제 상황:",
    "",
    "재현 순서:",
    "",
    "진단 정보:",
    serializeDiagnosticsPayload(payload),
  ].join("\n"));

  return {
    actionLabel: "지원 메일 작성",
    href: `mailto:${support.email}?subject=${subject}&body=${body}`,
    message: `${support.email}로 진단 정보를 포함한 문의 메일을 작성합니다.`,
  };
}

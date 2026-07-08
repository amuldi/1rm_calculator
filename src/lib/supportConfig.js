import { getAccountDeletionRequestBody, getRemoteDeletionScope } from "./dataLifecycle.js";

export function isValidSupportEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export function getSupportConfig(env = {}) {
  const email = String(env.VITE_SUPPORT_EMAIL || "").trim();
  return {
    email,
    configured: isValidSupportEmail(email),
    invalid: Boolean(email) && !isValidSupportEmail(email),
    deletionRequestSubject: "1RM Calculator 계정 데이터 삭제 요청",
  };
}

export function getDeletionRequestCopy(config = getSupportConfig()) {
  if (!config.configured) {
    return {
      title: "계정 데이터 삭제 요청",
      message: "운영 문의 이메일을 연결하면 이 화면에 계정 데이터 삭제 요청 절차가 표시됩니다.",
      actionLabel: "문의 채널 준비 필요",
      href: "",
    };
  }

  const subject = encodeURIComponent(config.deletionRequestSubject);
  const body = encodeURIComponent(getAccountDeletionRequestBody());
  const scope = getRemoteDeletionScope().join(", ");
  return {
    title: "계정 데이터 삭제 요청",
    message: `${config.email}로 요청하면 계정 동기화 데이터(${scope}) 삭제 절차를 안내받을 수 있습니다.`,
    actionLabel: "삭제 요청 메일 작성",
    href: `mailto:${config.email}?subject=${subject}&body=${body}`,
  };
}

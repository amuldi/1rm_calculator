export function getPWAStatusCopy({ online = true, needRefresh = false } = {}) {
  if (needRefresh) {
    return {
      tone: "update",
      title: "새 버전 준비됨",
      message: "업데이트하면 최신 기능과 수정사항이 적용됩니다.",
      action: "업데이트",
    };
  }

  if (!online) {
    return {
      tone: "offline",
      title: "오프라인 모드",
      message: "기록은 이 기기에 저장되고, 계정 동기화는 연결 후 다시 시도할 수 있습니다.",
      action: "",
    };
  }

  return null;
}

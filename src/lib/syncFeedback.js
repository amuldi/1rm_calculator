export function normalizeSyncStats(stats = {}) {
  return {
    recordCount: Math.max(0, Math.round(Number(stats.recordCount) || 0)),
    goalCount: Math.max(0, Math.round(Number(stats.goalCount) || 0)),
    deletedRecordCount: Math.max(0, Math.round(Number(stats.deletedRecordCount) || 0)),
    deletedGoalCount: Math.max(0, Math.round(Number(stats.deletedGoalCount) || 0)),
  };
}

export function getSyncSummary(stats = {}) {
  const normalized = normalizeSyncStats(stats);
  const parts = [
    `${normalized.recordCount}개 기록`,
    `목표 ${normalized.goalCount}개`,
  ];

  if (normalized.deletedRecordCount > 0) {
    parts.push(`기록 삭제 반영 ${normalized.deletedRecordCount}개`);
  }

  if (normalized.deletedGoalCount > 0) {
    parts.push(`목표 삭제 반영 ${normalized.deletedGoalCount}개`);
  }

  return parts.join(" · ");
}

export function isValidSyncTime(value) {
  return Number.isFinite(new Date(value).getTime());
}

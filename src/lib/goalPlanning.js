import { getDisplayWeightFromKg, getGoalKg } from "./utils.js";

export function getGoalPlan(goal, currentKg, unit = "kg", now = new Date()) {
  const targetKg = getGoalKg(goal);
  const current = Number(currentKg) || 0;
  const targetDate = goal && typeof goal === "object" && typeof goal.targetDate === "string"
    ? goal.targetDate
    : "";

  if (!targetKg || current <= 0) {
    return {
      targetKg,
      targetDate,
      current: getDisplayWeightFromKg(current, unit),
      remainingKg: targetKg ? targetKg : 0,
      remaining: targetKg ? getDisplayWeightFromKg(targetKg, unit) : 0,
      daysLeft: null,
      weeklyGain: null,
      status: "no-current",
      message: "현재 최고 기록이 생기면 목표까지 필요한 증가량을 계산합니다.",
    };
  }

  const remainingKg = Math.max(0, targetKg - current);
  const remaining = getDisplayWeightFromKg(remainingKg, unit);
  if (remainingKg <= 0) {
    return {
      targetKg,
      targetDate,
      current: getDisplayWeightFromKg(current, unit),
      remainingKg,
      remaining,
      daysLeft: 0,
      weeklyGain: 0,
      status: "done",
      message: "목표를 달성했습니다. 다음 목표를 설정해도 좋습니다.",
    };
  }

  if (!targetDate) {
    return {
      targetKg,
      targetDate,
      current: getDisplayWeightFromKg(current, unit),
      remainingKg,
      remaining,
      daysLeft: null,
      weeklyGain: null,
      status: "no-date",
      message: `목표까지 ${remaining} ${unit} 남았습니다. 목표일을 정하면 주간 필요 증가량을 계산합니다.`,
    };
  }

  const deadline = new Date(`${targetDate}T00:00:00`);
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
  if (!Number.isFinite(daysLeft) || daysLeft < 0) {
    return {
      targetKg,
      targetDate,
      current: getDisplayWeightFromKg(current, unit),
      remainingKg,
      remaining,
      daysLeft,
      weeklyGain: null,
      status: "overdue",
      message: `목표일이 지났고 ${remaining} ${unit} 남았습니다. 목표일을 다시 조정하세요.`,
    };
  }

  const weeksLeft = Math.max(daysLeft / 7, 1 / 7);
  const weeklyGain = getDisplayWeightFromKg(remainingKg / weeksLeft, unit);
  return {
    targetKg,
    targetDate,
    current: getDisplayWeightFromKg(current, unit),
    remainingKg,
    remaining,
    daysLeft,
    weeklyGain,
    status: "active",
    message: `목표까지 ${remaining} ${unit} 남았고, 주당 약 ${weeklyGain} ${unit} 증가가 필요합니다.`,
  };
}

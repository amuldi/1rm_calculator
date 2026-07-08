import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

const DEFAULT_UNIT = "kg";
const LB_PER_KG = 2.20462;

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function roundWeight(value, precision = 1) {
  const number = toFiniteNumber(value);
  if (number == null) return 0;
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  if (isToday(d)) return "오늘";
  if (isYesterday(d)) return "어제";
  return format(d, "yyyy. M. d.");
}

export function toDateInputValue(dateStr = new Date()) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateInputToISO(dateInput) {
  if (!dateInput || typeof dateInput !== "string") return new Date().toISOString();
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return new Date().toISOString();
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

export function formatRelative(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function kgToLb(kg) {
  return roundWeight(kg * LB_PER_KG);
}

export function lbToKg(lb) {
  return roundWeight(lb / LB_PER_KG);
}

export function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return roundWeight(value);
  return fromUnit === "kg" ? kgToLb(value) : lbToKg(value);
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const val = typeof key === "function" ? key(item) : item[key];
    if (!groups[val]) groups[val] = [];
    groups[val].push(item);
    return groups;
  }, {});
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatWeight(value, unit) {
  return `${roundWeight(value)} ${unit}`;
}

export function getDisplayWeightFromKg(valueKg, unit = DEFAULT_UNIT) {
  const kg = toFiniteNumber(valueKg);
  if (kg == null) return 0;
  return unit === "lb" ? kgToLb(kg) : roundWeight(kg);
}

export function getRecordWeightKg(record) {
  const explicit = toFiniteNumber(record?.weightKg);
  if (explicit != null) return explicit;

  const weight = toFiniteNumber(record?.weight);
  if (weight == null) return 0;
  return record?.unit === "lb" ? lbToKg(weight) : roundWeight(weight);
}

export function getRecordRMKg(record) {
  const explicit = toFiniteNumber(record?.rmKg);
  if (explicit != null) return explicit;

  const rm = toFiniteNumber(record?.rm);
  if (rm == null) return 0;
  return record?.unit === "lb" ? lbToKg(rm) : roundWeight(rm);
}

export function normalizeWorkoutRecord(record = {}) {
  const now = new Date().toISOString();
  const unit = record.unit === "lb" ? "lb" : DEFAULT_UNIT;
  const weightKg = getRecordWeightKg({ ...record, unit });
  const rmKg = getRecordRMKg({ ...record, unit });
  const date = record.date || record.createdAt || now;
  const createdAt = record.createdAt || date || now;
  const updatedAt = record.updatedAt || record.modifiedAt || createdAt;
  const sets = clamp(Math.round(toFiniteNumber(record.sets) ?? 1), 1, 20);
  const rpe = toFiniteNumber(record.rpe);
  const syncVersion = Math.max(1, Math.round(toFiniteNumber(record.syncVersion) ?? 1));

  return {
    ...record,
    unit,
    date,
    createdAt,
    updatedAt,
    syncVersion,
    weight: roundWeight(record.weight ?? getDisplayWeightFromKg(weightKg, unit)),
    rm: roundWeight(record.rm ?? getDisplayWeightFromKg(rmKg, unit)),
    reps: clamp(Math.round(toFiniteNumber(record.reps) ?? 1), 1, 30),
    sets,
    rpe: rpe == null ? null : clamp(roundWeight(rpe), 1, 10),
    notes: typeof record.notes === "string" ? record.notes.trim().slice(0, 160) : "",
    weightKg,
    rmKg,
  };
}

export function getRecordDisplay(record, unit = DEFAULT_UNIT) {
  return {
    ...record,
    unit,
    weight: getDisplayWeightFromKg(getRecordWeightKg(record), unit),
    rm: getDisplayWeightFromKg(getRecordRMKg(record), unit),
  };
}

export function getRecordVolume(record, unit = DEFAULT_UNIT) {
  const reps = Number(record?.reps) || 0;
  const sets = Number(record?.sets) || 1;
  return getDisplayWeightFromKg(getRecordWeightKg(record), unit) * reps * sets;
}

export function getGoalKg(goal, fallbackUnit = DEFAULT_UNIT) {
  if (goal && typeof goal === "object") {
    const explicit = toFiniteNumber(goal.targetKg ?? goal.goalKg ?? goal.valueKg);
    if (explicit != null) return explicit;

    const value = toFiniteNumber(goal.value ?? goal.goal);
    if (value == null) return null;
    return (goal.unit || fallbackUnit) === "lb" ? lbToKg(value) : roundWeight(value);
  }

  const value = toFiniteNumber(goal);
  return value == null ? null : roundWeight(value);
}

export function getGoalDisplay(goal, unit = DEFAULT_UNIT) {
  const goalKg = getGoalKg(goal);
  return goalKg == null ? null : getDisplayWeightFromKg(goalKg, unit);
}

export function getPRMap(history) {
  const map = {};
  for (const record of history) {
    const key = record.exerciseId;
    if (!key) continue;
    if (!map[key] || getRecordRMKg(record) > getRecordRMKg(map[key])) {
      map[key] = record;
    }
  }
  return map;
}

export function getVolumeByDate(history, unit = DEFAULT_UNIT) {
  const byDate = {};
  for (const r of history) {
    const day = r.date?.split("T")[0];
    if (!day) continue;
    byDate[day] = (byDate[day] || 0) + getRecordVolume(r, unit);
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, volume]) => ({ date, volume: Math.round(volume) }));
}

export function getTrend(values) {
  const clean = values.map(Number).filter(Number.isFinite);
  if (clean.length < 3) return "stable";
  const recent = clean.slice(-3);
  const previous = clean.slice(-6, -3);
  const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAvg = previous.length
    ? previous.reduce((sum, value) => sum + value, 0) / previous.length
    : clean[0];
  const delta = recentAvg - previousAvg;
  if (delta > 0.5) return "up";
  if (delta < -0.5) return "down";
  return "stable";
}

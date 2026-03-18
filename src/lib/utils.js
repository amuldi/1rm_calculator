import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatRelative(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function kgToLb(kg) {
  return parseFloat((kg * 2.20462).toFixed(1));
}

export function lbToKg(lb) {
  return parseFloat((lb / 2.20462).toFixed(1));
}

export function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  return fromUnit === "kg" ? kgToLb(value) : lbToKg(value);
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const val = typeof key === "function" ? key(item) : item[key];
    return { ...groups, [val]: [...(groups[val] || []), item] };
  }, {});
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatWeight(value, unit) {
  return `${parseFloat(value.toFixed(1))} ${unit}`;
}

export function getPRMap(history) {
  const map = {};
  for (const record of history) {
    const key = record.exerciseId;
    if (!map[key] || record.rm > map[key].rm) {
      map[key] = record;
    }
  }
  return map;
}

export function getVolumeByDate(history) {
  const byDate = {};
  for (const r of history) {
    const day = r.date.split("T")[0];
    byDate[day] = (byDate[day] || 0) + r.weight * r.reps;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, volume]) => ({ date, volume: Math.round(volume) }));
}

export function getTrend(values) {
  if (values.length < 3) return "stable";
  const last = values.slice(-3);
  const avg = (last[2] - last[0]) / 2;
  if (avg > 0.5) return "up";
  if (avg < -0.5) return "down";
  return "stable";
}

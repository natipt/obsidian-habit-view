import { HabitEntry } from './types';
import { moment } from 'obsidian';

export function isDoneToday(entries: HabitEntry[]): boolean {
  const today = moment().format("YYYY-MM-DD");
  return entries.some(e => e.completedDate === today);
}

export function computeStreak(entries: HabitEntry[]): number {
  console.log("Raw entries:", entries);
  const sorted = entries
    .filter(e => e.done && e.completedDate && e.completedDate.trim() !== "")
    .sort((a, b) => (a.completedDate! > b.completedDate! ? 1 : -1)) // ascending

  let streak = 0;
  let date = moment(); // today

  // If today wasn't done, start from yesterday
  const latest = sorted[sorted.length - 1];
  if (latest.completedDate !== date.format("YYYY-MM-DD")) {
    date.subtract(1, "day");
  }

  const completedSet = new Set(sorted.map(e => e.completedDate));
  
  while (completedSet.has(date.format("YYYY-MM-DD"))) {
    streak++;
    date.subtract(1, "day");
  }

  return streak;
}
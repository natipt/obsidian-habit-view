import { HabitEntry, Habit } from './types';
import { moment } from 'obsidian';

export function isDoneToday(habit: Habit): boolean {
  if (!habit.entries) {
    return habit.subhabits.every(e => isDoneToday(e));
  }
  else {
    const today = moment().format("YYYY-MM-DD");
    return habit.entries.some(e => e.completedDate === today);
  }
}

export function computeStreak(habit: Habit): number {
  if (!habit.entries) {
    const streaks = habit.subhabits.map(sub => computeStreak(sub));
    return Math.min(...streaks);
  }
  else {
    const sorted = habit.entries
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
}
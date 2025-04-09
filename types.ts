export type HabitType = 'Daily' | 'Weekly' | 'Monthly';

export interface HabitEntry {
    done: boolean;
    scheduledDate?: string; // 📅 2025-03-13
    completedDate?: string; // ✅ 2025-03-17
}

export interface Habit {
  name: string;
  type: HabitType;
  entries: HabitEntry[];
}
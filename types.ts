export type HabitType = 'daily' | 'weekly' | 'monthly';

export interface HabitEntry {
    done: boolean;
    scheduledDate?: string; // 📅 2025-03-13
    completedDate?: string; // ✅ 2025-03-17
}

export interface Habit {
  name: string;
  path?: string;
  type?: HabitType;
  hasSubhabits?: boolean;
  entries?: HabitEntry[];
  icon?: string;
  color?: string;
  subhabits?: Subhabit[];
  isSubhabit?: boolean;
}

export interface Subhabit extends Habit {
  isSubhabit: boolean;  // TODO: DOES THIS SET IT AS MANDATORY?
  parentHabit: string;
}
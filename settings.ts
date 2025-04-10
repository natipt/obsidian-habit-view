export interface HabitTrackerSettings {
  habitsFolder: string;
  showSidebarHeader: boolean; 
}

export const DEFAULT_SETTINGS: HabitTrackerSettings = {
  habitsFolder: "Habits",
  showSidebarHeader: true, 
};
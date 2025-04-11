export interface HabitTrackerSettings {
  habitsFolder: string;
  showSidebarHeader: boolean; 
  habitOrder: string[];
}

export const DEFAULT_SETTINGS: HabitTrackerSettings = {
  habitsFolder: "Habits",
  showSidebarHeader: true, 
  habitOrder: [],
};
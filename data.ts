import { App, TFile } from 'obsidian';
import { Habit, HabitType } from './types';
import { parseHabitFile } from './parser';

export async function loadHabits(app: App, basePath: string): Promise<Habit[]> {
  const types: HabitType[] = ['Daily', 'Weekly', 'Monthly'];
  const habits: Habit[] = [];

  for (const type of types) {
    const folderPath = `${basePath}/${type}`;
    const files = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folderPath));

    for (const file of files) {
      const content = await app.vault.read(file);
      const entries = parseHabitFile(content).map(e => ({
        ...e,
        title: file.basename,
      }));

      habits.push({
        name: file.basename,
        type,
        entries,
      });
    }
  }

  return habits;
}

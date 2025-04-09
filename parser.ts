import { HabitEntry } from './types';

export function parseHabitFile(content: string): HabitEntry[] {
  const entries: HabitEntry[] = [];
  const lines = content.split('\n');

  const lineRegex = /^- \[( |x)\](.*)/;
  const completedDateRegex = /✅\s*(\d{4}-\d{2}-\d{2})/;
  const scheduledDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;

  for (const line of lines) {
    const lineMatch = line.match(lineRegex);
    if (!lineMatch) continue;

    const [, checkbox, rest] = lineMatch;

    const completedMatch = rest.match(completedDateRegex);
    const scheduledMatch = rest.match(scheduledDateRegex);

    entries.push({
      done: checkbox === 'x',
      completedDate: completedMatch?.[1],
      scheduledDate: scheduledMatch?.[1],
    });
  }

  return entries;
}

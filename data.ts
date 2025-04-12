import { App, TFile, normalizePath } from "obsidian";
import { Habit, HabitType } from "./types";
import { parseHabitFile } from "./parser";

export async function loadHabits(app: App, basePath: string): Promise<Habit[]> {
  const types: HabitType[] = ["Daily", "Weekly", "Monthly"];
  const habits: Habit[] = [];

  // Load Iconic plugin icon mapping
  const iconicPath = normalizePath(".obsidian/plugins/iconic/data.json");
  let iconMap: Record<string, { icon: string; color?: string }> = {};
  try {
    const raw = await this.app.vault.adapter.read(iconicPath);
    const parsed = JSON.parse(raw);

    iconMap = parsed.fileIcons ?? {};
    console.log("[Habit Tracker] Loaded icon map:", iconMap);
  } catch (err) {
    console.warn("[Habit Tracker] Failed to load Iconic icon map", err);
    iconMap = {};
  }  

  for (const type of types) {
    const folderPath = `${basePath}/${type}`;
    const files = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folderPath));

    for (const file of files) {
      const content = await app.vault.read(file);
      // const entries = parseHabitFile(content);
      const parsed = parseHabitFile(content);
      console.log(`[Habit Tracker] Parsed ${file.basename}:`, parsed);

      const iconMeta = iconMap[file.path] ?? {};
      const icon = iconMeta.icon ?? "lucide-book";
      const color = iconMeta.color ?? "gray";

      habits.push({
        name: file.basename,
        path: file.path,
        type: type.toLowerCase() as "daily" | "weekly" | "monthly",
        hasSubhabits: parsed.hasSubhabits,
        entries: parsed.entries,
        subhabits: parsed.subhabits,
        icon,
        color,
      });
    }
  }
  
  return habits;
}

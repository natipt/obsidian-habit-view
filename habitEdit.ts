// import { App, TFile, moment } from "obsidian";
// import { Habit } from "./types";

// export async function markHabitDoneToday(app: App, habit: Habit) {
//   const today = moment().format("YYYY-MM-DD");
//   const file = app.vault.getMarkdownFiles().find(f => f.basename === habit.name);

//   if (!file) {
//     console.warn("[Habit] Could not find file for habit:", habit.name);
//     return;
//   }

//   const content = await app.vault.read(file);
//   const lines = content.split("\n");

//   let updated = false;
//   const newLines = lines.map(line => {
//     if (line.match(/- \[ \]/)) {
//       updated = true;
//       return line.replace("- [ ]", "- [x]") + ` ✅ ${today}`;
//     }
//     return line;
//   });

//   if (updated) {
//     console.log(`[Habit] Found existing incomplete task. Marking it as done.`);
//     await app.vault.modify(file, newLines.join("\n"));
//     return;
//   }

//   // No undone tasks found — create a new one
//   const newTask = `- [x] ${habit.name} 🔁 every day when done 📅 ${today} ✅ ${today}`;
//   const updatedContent = content + "\n" + newTask;
//   await app.vault.modify(file, updatedContent);
//   console.log(`[Habit] No existing task found. Created a new done task for today.`);
// }

import { App, TFile, moment } from "obsidian";
import { Habit } from "./types";

export async function markHabitDoneToday(app: App, habit: Habit) {
  const today = moment().format("YYYY-MM-DD");
  const file = app.vault.getMarkdownFiles().find(f => f.basename === habit.name);
  if (!file) return;

  const content = await app.vault.read(file);
  const lines = content.split("\n");

  // Case 1: Undo last completed task for today
  const foundIndex = lines.findIndex(line =>
    line.match(/- \[x\]/) &&
    line.includes(`✅ ${today}`)
  );

  if (foundIndex !== -1) {
    lines[foundIndex] = lines[foundIndex]
      .replace("- [x]", "- [ ]")
      .replace(`✅ ${today}`, "");
    await app.vault.modify(file, lines.join("\n"));
    console.log(`[Habit] Unchecked '${habit.name}' for ${today}`);
    return;
  }

  // Case 2: Check an existing undone task
  const newLines = lines.map(line => {
    if (line.match(/- \[ \]/) && !line.includes("✅")) {
      return line.replace("- [ ]", "- [x]") + ` ✅ ${today}`;
    }
    return line;
  });

  if (newLines.join("\n") !== content) {
    await app.vault.modify(file, newLines.join("\n"));
    console.log(`[Habit] Marked '${habit.name}' as done for ${today}`);
    return;
  }

  // Case 3: No existing task found, create new
  const newTask = `- [x] ${habit.name} 🔁 every day when done 📅 ${today} ✅ ${today}`;
  await app.vault.modify(file, content + "\n" + newTask);
  console.log(`[Habit] Created and checked new task for '${habit.name}'`);
}

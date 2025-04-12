import { App, moment } from "obsidian";
import { Habit } from "./types";

export async function markHabitDoneToday(app: App, habit: Habit) {
  const today = moment().format("YYYY-MM-DD");
  const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");

  const file = app.vault.getMarkdownFiles().find(f => f.basename === habit.name);
  if (!file) return;

  const content = await app.vault.read(file);
  const lines = content.split("\n");
  let modified = false;

  // 1. Try to uncheck today if already done
  const foundDoneIndex = lines.findIndex(line =>
    line.match(/- \[x\]/) && line.includes(`✅ ${today}`)
  );

  if (foundDoneIndex !== -1) {
    console.log("[Habit] Found done task for today, unchecking...");

    // 1. Uncheck the task line BEFORE modifying anything else
    const uncheckedLine = lines[foundDoneIndex]
      .replace("- [x]", "- [ ]")
      .replace(`✅ ${today}`, "");

    // 2. Replace the line in the original array
    lines[foundDoneIndex] = uncheckedLine;

    // 3. Remove ALL other unchecked lines
    const cleanedLines = lines.filter((line, i) => {
      return !(line.match(/- \[ \]/) && i !== foundDoneIndex);
    });

    // 4. Save changes
    lines.length = 0;
    lines.push(...cleanedLines);
    modified = true;

    console.log("[Habit] Unchecked today and removed all other `[ ]` tasks");
  } else {
    // Try to find and check an existing `[ ]` task
    let checked = false;
    let checkedLineIndex = -1;
    let originalCheckedLine = "";
    const newLines = lines.map((line, index) => {
      if (!checked && line.match(/- \[ \]/) && !line.includes("✅")) {
        checked = true;
        checkedLineIndex = index;
        originalCheckedLine = line;
        return line.replace("- [ ]", "- [x]").trimEnd() + ` ✅ ${today}`;
      }
      return line;
    });
  
    // 3. If no existing task found, create a new one
    if (!checked) {
      originalCheckedLine = `- [x] ${habit.name} 🔁 every day when done 📅 ${today} ✅ ${today}`;
      newLines.push(originalCheckedLine);
      checked = true;
      checkedLineIndex = newLines.length - 1;
    }

    // Check if we should add tomorrow's line
    const isRepeating = originalCheckedLine.includes("🔁 every day when done");

    if (isRepeating) {
      // Copy and update the task for tomorrow
      const tomorrowLine = originalCheckedLine
        .replace("- [x]", "- [ ]")
        .replace(/📅 \d{4}-\d{2}-\d{2}/, `📅 ${tomorrow}`)
        .replace(/ ✅ \d{4}-\d{2}-\d{2}/, ""); // remove ✅ if present

      newLines.splice(checkedLineIndex, 0, tomorrowLine);
    }

  
    // const baseLine = `- [ ] ${habit.name} 🔁 every day when done 📅 ${tomorrow}`;
    // newLines.push(baseLine);

    // lines.length = 0;
    // lines.push(...newLines);
    // modified = true;
    lines.length = 0;
    lines.push(...newLines);
    modified = true;
    console.log("[Habit] Checked today & created tomorrow's task");
  }

  if (modified) {
    await app.vault.modify(file, lines.join("\n"));
  }
}

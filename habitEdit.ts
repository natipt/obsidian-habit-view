import { App, moment } from "obsidian";
import { Habit } from "./types";

export async function markHabitDoneToday(app: App, habit: Habit) {
  console.log(`Mark habit done today called on ${habit.name}`)
  const today = moment().format("YYYY-MM-DD");
  const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");

  // TODO: this only works if no other files in the whole vault have this basename
  // I should really consider the whole path
  let file = app.vault.getMarkdownFiles().find(f => f.basename === habit.name);
  if (habit.isSubhabit) {
    console.log("Parent habit ", habit.parentHabit)
    file = app.vault.getMarkdownFiles().find(f => f.basename === habit.parentHabit);
  }
  if (!file) return;

  const content = await app.vault.read(file);
  const allLines = content.split("\n");
  let lines: string[] = [];
  let startIndex = 0;
  let endIndex = 0;
  // Get a specific section if subhabit 
  if (habit.isSubhabit) {
    const headingRegex = new RegExp(`^#+\\s*${habit.name}\\s*$`, "i");
    startIndex = allLines.findIndex(line => headingRegex.test(line));
    if (startIndex === -1) {
      console.warn(`Could not find heading for subhabit: ${habit.name}`);
      return;
    }
    endIndex = allLines.length;
    for (let i = startIndex + 1; i < allLines.length; i++) {
      if (/^#+\s+/.test(allLines[i])) {
        endIndex = i;
        break;
      }
    }
    lines = allLines.slice(startIndex + 1, endIndex);
  }
  else {
    lines = allLines;
  }

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

    lines.length = 0;
    lines.push(...newLines);
    modified = true;
    console.log("[Habit] Checked today & created tomorrow's task");
  }

  if (modified) {
    if (habit.isSubhabit) {
      allLines.splice(startIndex + 1, endIndex - startIndex - 1, ...lines);
      await app.vault.modify(file, allLines.join("\n"));
    } else {
      await app.vault.modify(file, lines.join("\n"));
    }
  }
}

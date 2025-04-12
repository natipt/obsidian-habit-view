import { HabitEntry, Subhabit } from './types';

export function parseHabitFile(content: string, habitName: string): {
  hasSubhabits: boolean;
  subhabits?: Subhabit[];
  entries?: HabitEntry[];
} {
  let entries: HabitEntry[] = [];
  const subhabits: Subhabit[] = [];
  let currentHeading: string | null = null;  
  let foundSubhabits = false;
  const lines = content.split('\n');

  const lineRegex = /^- \[( |x)\](.*)/;
  const completedDateRegex = /✅\s*(\d{4}-\d{2}-\d{2})/;
  const scheduledDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;

  for (const line of lines) {
    const headingMatch = line.match(/^# (.+)/);
    if (headingMatch) { 
      // If there was already a subhabit being read before
      // push it even if it has no entries
      if (currentHeading) {
        subhabits.push({
          name: currentHeading,
          entries: entries,
          isSubhabit: true,
          parentHabit: habitName,
        });
        entries = [];
      }
      currentHeading = headingMatch[1].trim();
      foundSubhabits = true;
      continue;
    }

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

  // push final subhabit group if needed, even if it has no entries listed
  if (foundSubhabits && currentHeading) {
    subhabits.push({
      name: currentHeading,
      entries: entries,
      isSubhabit: true,
      parentHabit: habitName,
    });
  }

  // FIX RETURN
  if (foundSubhabits) {
    return {
      hasSubhabits: true,
      subhabits,
    };
  } else {
    return {
      hasSubhabits: false,
      entries: entries,
    };
  }
}


// const lines = content.split('\n');

//   const subhabits: Subhabit[] = [];
//   let currentHeading: string | null = null;
//   let currentEntries: HabitEntry[] = [];

//   let foundSubhabits = false;

//   const lineRegex = /^- \[( |x)\](.*)/;
//   const completedDateRegex = /✅\s*(\d{4}-\d{2}-\d{2})/;
//   const scheduledDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;

//   for (const line of lines) {
//     const headingMatch = line.match(/^# (.+)/);
//     if (headingMatch) {
//       if (currentHeading && currentEntries.length > 0) {
//         // subhabits.push({ name: currentHeading, entries: currentEntries });
//         subhabits.push({
//           name: currentHeading,
//           path: context?.path,
//           entries: sectionEntries,
//           type: context?.type,
//           hasSubhabits: false,
//           icon: context?.icon,
//           color: context?.color,
//           isSubhabit: true,
//       });
//         currentEntries = [];
//       }

//       currentHeading = headingMatch[1].trim();
//       foundSubhabits = true;
//       continue;
//     }

//     const lineMatch = line.match(lineRegex);
//     if (!lineMatch) continue;

//     const [, checkbox, rest] = lineMatch;

//     const completedMatch = rest.match(completedDateRegex);
//     const scheduledMatch = rest.match(scheduledDateRegex);

    
//     const entry: HabitEntry = {
//       done: checkbox === "x",
//       scheduledDate: scheduledMatch?.[1],
//       completedDate: completedMatch?.[1],
//     }

//     currentEntries.push(entry);
//   }

//   // 👇 push final group if needed
//   if (foundSubhabits && currentHeading && currentEntries.length > 0) {
//     subhabits.push({
//       name: currentHeading,
//       path: context?.path,
//       entries: sectionEntries,
//       type: context?.type,
//       hasSubhabits: false,
//       icon: context?.icon,
//       color: context?.color,
//       isSubhabit: true,
//     });
//   }

//   // 👇 return now that we've processed all lines
//   if (foundSubhabits) {
//     return {
//       hasSubhabits: true,
//       subhabits,
//     };
//   } else {
//     return {
//       hasSubhabits: false,
//       entries: currentEntries,
//     };
//   }
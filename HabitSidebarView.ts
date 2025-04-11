import { isDoneToday } from "./streaks";
import { loadHabits } from "./data";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { icons, createElement } from "lucide";
import { markHabitDoneToday } from "./habitEdit";
import { computeStreak } from "./streaks";

export class HabitSidebarView extends ItemView {
  plugin: HabitTrackerPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: HabitTrackerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return "habit-sidebar-view";
  }

  getDisplayText() {
    return "Habits Today";
  }

  async render() {
    const container = this.containerEl.children[1];
    container.empty();

    if (this.plugin.settings.showSidebarHeader) {
      const header = container.createEl("p", {
        text: "Today's Habits",
      });
      header.classList.add("habit-sidebar-header");
    } 
    
    const wrapper = container.createDiv({ cls: "habit-sidebar-grid" });

    const habits = await loadHabits(this.app, this.plugin.settings.habitsFolder, this.plugin.iconMap);
    console.log("[Sidebar] Loaded habits:", habits);

    const dailyHabits = habits.filter(h => h.type === "Daily");

    if (dailyHabits.length === 0) {
      wrapper.createEl("p", { text: "No daily habits found." });
      return;
    }

    for (const habit of dailyHabits) {
        const done = isDoneToday(habit.entries);
        const streak = computeStreak(habit.entries);
      
        const iconBox = wrapper.createDiv({ cls: "habit-icon" });
        iconBox.setAttr("title", habit.name);
        iconBox.addClass(done ? "done" : "not-done");
        iconBox.setAttr("title", `${habit.name}\n🔥 ${streak} day streak`);

        function kebabToPascalCase(kebab: string): string {
            return kebab
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join("");
          }
        const rawIcon = habit.icon?.replace(/^lucide-/, "") || "circle";
        const iconName = kebabToPascalCase(rawIcon); // e.g. "GlassWater"

        let svg: SVGElement;

        if (iconName in icons) {
            const iconNode = icons[iconName as keyof typeof icons]; // get the IconNode
            svg = createElement(iconNode);
            console.log("svg", svg)
        } else {
            console.warn(`[HabitSidebar] Unknown Lucide icon: '${iconName}', using fallback.`);
            svg = createElement(icons["Book"]);
        }

        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("stroke", habit.color || "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("fill", "none");

        // Append to your habit card
        iconBox.appendChild(svg);

        iconBox.onclick = async () => {
            await markHabitDoneToday(this.app, habit);
            this.plugin.refreshSidebar?.();
          };
          

        // iconEl.addClass("lucide");
        // iconEl.addClass(iconName); // e.g. "lucide-glass-water"
        // iconEl.setAttr("style", `color: ${habit.color || "currentColor"}; font-size: 24px;`);
      }
  }      

  async onOpen() {
    await this.render();
  }
}

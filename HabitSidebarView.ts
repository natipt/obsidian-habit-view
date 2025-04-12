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

    const dailyHabits = habits.filter(h => h.type === "daily");

    if (dailyHabits.length === 0) {
      wrapper.createEl("p", { text: "No daily habits found." });
      return;
    }

    // ORDER THEM ACCORDING TO THE SETTING
    const ordered = this.plugin.settings.habitOrder;

    if (ordered?.length > 0) {
      dailyHabits.sort((a, b) => {
        const aIndex = ordered.indexOf(a.name);
        const bIndex = ordered.indexOf(b.name);
        return aIndex - bIndex;
      });
    }

    for (const habit of dailyHabits) {
      const done = isDoneToday(habit);
      // console.log(`${habit.name} is done today `, done) // TESTED
      // const streak = computeStreak(habit.entries); // TODO 
    
      const iconBox = wrapper.createDiv({ cls: "habit-icon" });
      iconBox.addClass(done ? "done" : "not-done");
      // iconBox.setAttr("title", `${habit.name}\n🔥 ${streak} day streak`);
      iconBox.setAttr("title", `${habit.name}`);

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
          // console.log("svg", svg) // TESTED
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

      let tooltip: HTMLDivElement | null = null;
      if (!habit.entries && habit.subhabits) {
        console.log(`${habit.name} has subs and am adding tooltip`)
        // tooltip = wrapper.createDiv({ cls: "habit-tooltip" });
        const tooltip = document.createElement("div");
        tooltip.style.position = "fixed";
        tooltip.style.display = "none";
        document.body.appendChild(tooltip);
        for (const sub of habit.subhabits) {
          const row = tooltip.createDiv({ cls: "subhabit-row" });
          const checkbox = row.createEl("input");
          checkbox.type = "checkbox";
          checkbox.checked = isDoneToday(sub);
          row.createSpan({ text: sub.name });
          checkbox.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await markHabitDoneToday(this.app, sub);
            this.plugin.refreshSidebar?.();
          });
        }
        let hoverTimeout: number;

        iconBox.addEventListener("mouseenter", () => {
          clearTimeout(hoverTimeout);
          const rect = iconBox.getBoundingClientRect();
          tooltip.style.left = `${rect.left}px`;
          tooltip.style.top = `${rect.bottom + 6}px`;
          tooltip.style.display = "block";
        });

        iconBox.addEventListener("mouseleave", () => {
          hoverTimeout = window.setTimeout(() => {
            tooltip.style.display = "none";
          }, 200); // slight delay
        });

        tooltip.addEventListener("mouseenter", () => {
          clearTimeout(hoverTimeout);
          tooltip.style.display = "block";
        });

        tooltip.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
      } else{
        iconBox.onclick = async () => {
          await markHabitDoneToday(this.app, habit);
          this.plugin.refreshSidebar?.();
        };
      }   
    }
  }      

  async onOpen() {
    await this.render();
  }
}

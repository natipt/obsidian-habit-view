import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';
import { HabitTrackerSettings, DEFAULT_SETTINGS } from './settings';
import { loadHabits } from './data';
import { isDoneToday, computeStreak } from './streaks'

export default class HabitTrackerPlugin extends Plugin {
  settings: HabitTrackerSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HabitTrackerSettingTab(this.app, this));

    // TEMP: load data on startup
    const habits = await loadHabits(this.app, this.settings.habitsFolder);
    console.log("Loaded habits:", habits);

	this.registerMarkdownCodeBlockProcessor("habitdisplay", async (source, el, ctx) => {
		const type = source.trim().toLowerCase(); // "daily", "weekly", etc.
		if (!["daily", "weekly", "monthly"].includes(type)) {
		  el.createEl("p", { text: `Unknown habit type: ${type}` });
		  return;
		}
	  
		const habits = await loadHabits(this.app, this.settings.habitsFolder);
		const filtered = habits.filter(h => h.type.toLowerCase() === type);
	  
		const container = el.createDiv({ cls: "habit-gallery" });
	  
		for (const habit of filtered) {
      console.log(habit)
		  const streak = computeStreak(habit.entries);
		  const doneToday = isDoneToday(habit.entries);
	  
		  const card = container.createDiv({ cls: "habit-card" });
	  
		  card.innerHTML = `<div class="card-text">
			  <p class="card-title">${habit.name}</p>
			  <p class="card-subtitle">🔥 ${streak} day streak</p>
			</div>`;
		}
	  });
	  
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class HabitTrackerSettingTab extends PluginSettingTab {
  plugin: HabitTrackerPlugin;

  constructor(app: App, plugin: HabitTrackerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Habit Tracker Settings" });

    new Setting(containerEl)
      .setName("Habits folder")
      .setDesc("Folder path that contains Daily, Weekly, and Monthly subfolders.")
      .addText(text => text
        .setPlaceholder("Habits")
        .setValue(this.plugin.settings.habitsFolder)
        .onChange(async (value) => {
          this.plugin.settings.habitsFolder = value;
          await this.plugin.saveSettings();
        }));
  }
}

import { Plugin, PluginSettingTab, App, Setting, normalizePath } from 'obsidian';
import { HabitTrackerSettings, DEFAULT_SETTINGS } from './settings';
import { loadHabits } from './data';
import { isDoneToday, computeStreak } from './streaks';
import { HabitSidebarView } from './HabitSidebarView';
import Sortable from "sortablejs";


export default class HabitTrackerPlugin extends Plugin {
  settings: HabitTrackerSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HabitTrackerSettingTab(this.app, this));

    // TEMP: load data on startup
    const habits = await loadHabits(this.app, this.settings.habitsFolder);

    this.registerView(
      'habit-sidebar-view',
      (leaf) => new HabitSidebarView(leaf, this)
    );
    
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.getRightLeaf(false).setViewState({
        type: 'habit-sidebar-view',
        active: true
      });
    });

    this.registerEvent(
      this.app.metadataCache.on("changed", async (file) => {
        // If the file is in your habit folder, re-render
        if (file.path.startsWith(this.settings.habitsFolder)) {
          console.log("[HabitSidebar] Detected habit file change:", file.path);
          this.refreshSidebar?.();
        }
      })
    );
	  
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshSidebar() {
    const leaves = this.app.workspace.getLeavesOfType("habit-sidebar-view");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (typeof (view as any).render === "function") {
        (view as any).render();
      }
    }
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

    new Setting(containerEl)
    .setName("Show 'Today's Habits' header")
    .setDesc("Toggle the header text at the top of the sidebar.")
    .addToggle(toggle => toggle
      .setValue(this.plugin.settings.showSidebarHeader)
      .onChange(async (value) => {
        this.plugin.settings.showSidebarHeader = value;
        await this.plugin.saveSettings();
        this.plugin.refreshSidebar?.(); // Re-render if needed
    }));  

    const dailyFolderPath = normalizePath(`${this.plugin.settings.habitsFolder}/Daily`);
    const dailyFiles = this.app.vault.getFiles().filter(f =>
      f.path.startsWith(dailyFolderPath)
    );

    const habitNames = dailyFiles.map(f => f.basename);

    // Use saved order or default to vault order
    const ordered = this.plugin.settings.habitOrder.length > 0
      ? this.plugin.settings.habitOrder
      : habitNames;

    containerEl.createEl("h3", { text: "Daily Habit Order" });

    const listContainer = containerEl.createDiv({ cls: "habit-order-list" });

    ordered.forEach(name => {
      const item = listContainer.createDiv({ cls: "habit-order-item" });
      item.setText(name);
      item.setAttr("data-habit", name);
    });

    Sortable.create(listContainer, {
      animation: 150,
      onEnd: async () => {
        const newOrder = Array.from(listContainer.children).map(
          (el: Element) => el.getAttribute("data-habit")!
        );
        this.plugin.settings.habitOrder = newOrder;
        await this.plugin.saveSettings();
        this.plugin.refreshSidebar?.();
      }
    });    
  }
}



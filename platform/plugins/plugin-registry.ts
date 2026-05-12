/**
 * Plugin Registry — in-memory registry for internal extensions.
 * Singleton. Populated at app startup. No persistence needed.
 * Designed for future dynamic loading without breaking call sites.
 */

import type {
  PluginDefinition,
  PluginRegistryState,
  CommandExtension,
  SidebarWidget,
  EntityActionExtension,
} from "./types";

// ─── Registry singleton ───────────────────────────────────────────────────────

class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map();

  register(plugin: PluginDefinition): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginRegistry] Plugin "${plugin.id}" already registered. Skipping.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
  }

  enable(pluginId: string): void {
    const p = this.plugins.get(pluginId);
    if (p) this.plugins.set(pluginId, { ...p, enabled: true });
  }

  disable(pluginId: string): void {
    const p = this.plugins.get(pluginId);
    if (p) this.plugins.set(pluginId, { ...p, enabled: false });
  }

  getState(): PluginRegistryState {
    const enabled = [...this.plugins.values()].filter((p) => p.enabled);

    const commandItems = enabled
      .flatMap((p) => p.extensions)
      .filter((e): e is CommandExtension => e.capability === "command_extension")
      .flatMap((e) => e.items);

    const sidebarWidgets = enabled
      .flatMap((p) => p.extensions)
      .filter((e): e is SidebarWidget => e.capability === "sidebar_widget");

    const entityActions = enabled
      .flatMap((p) => p.extensions)
      .filter((e): e is EntityActionExtension => e.capability === "entity_action")
      .flatMap((e) => e.actions);

    return { plugins: enabled, commandItems, sidebarWidgets, entityActions };
  }

  getAll(): PluginDefinition[] {
    return [...this.plugins.values()];
  }
}

export const pluginRegistry = new PluginRegistry();

// ─── Built-in extensions (registered at startup) ──────────────────────────────

pluginRegistry.register({
  id:           "core.advisor",
  name:         "Execution Advisor",
  version:      "1.0.0",
  description:  "Adds Advisor to command palette and entity actions.",
  capabilities: ["command_extension", "entity_action"],
  enabled:      true,
  extensions: [
    {
      capability: "command_extension",
      items: [
        { id: "goto-advisor",  label: "Advisor",         group: "Navigate", icon: "Sparkles", shortcut: "G A", href: "/advisor"  },
        { id: "goto-reviews",  label: "Strategic Reviews", group: "Navigate", icon: "BookOpenText", shortcut: "G R", href: "/reviews" },
        { id: "goto-settings", label: "Settings",        group: "Navigate", icon: "Settings",  shortcut: "G S", href: "/settings" },
      ],
    },
    {
      capability: "entity_action",
      actions: [
        { id: "start-deep-work", label: "Start Deep Work", entityKind: ["project"], icon: "Focus", action: "deep_work.start" },
      ],
    },
  ],
});

pluginRegistry.register({
  id:           "core.import-export",
  name:         "Import / Export",
  version:      "1.0.0",
  description:  "Adds export/import to command palette.",
  capabilities: ["command_extension"],
  enabled:      true,
  extensions: [
    {
      capability: "command_extension",
      items: [
        { id: "export-workspace", label: "Export Workspace", group: "System", icon: "Download", href: "/settings/export" },
        { id: "import-data",      label: "Import Data",      group: "System", icon: "Upload",   href: "/settings/import" },
      ],
    },
  ],
});

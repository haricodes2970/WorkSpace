/**
 * Plugin / Extension Foundation — internal architecture only.
 * Not a public marketplace. Enables future modularity without schema chaos.
 * Pure TypeScript. No runtime I/O.
 */

// ─── Plugin capability types ──────────────────────────────────────────────────

export type PluginCapability =
  | "command_extension"    // adds items to command palette
  | "sidebar_widget"       // adds a widget to sidebar footer
  | "entity_action"        // adds actions to entity context menus
  | "dashboard_widget"     // adds a widget to the dashboard
  | "review_section";      // adds sections to strategic reviews

// ─── Command extension ────────────────────────────────────────────────────────

export interface CommandExtensionItem {
  id:       string;
  label:    string;
  sublabel?: string;
  group:    string;
  shortcut?: string;
  icon:     string;          // lucide icon name
  href?:    string;          // navigate to
  action?:  string;          // named action to dispatch
}

export interface CommandExtension {
  capability: "command_extension";
  items:      CommandExtensionItem[];
}

// ─── Sidebar widget ───────────────────────────────────────────────────────────

export interface SidebarWidget {
  capability: "sidebar_widget";
  id:         string;
  label:      string;
  position:   "top" | "bottom";
  href:       string;
  icon:       string;
}

// ─── Entity action ────────────────────────────────────────────────────────────

export interface EntityAction {
  id:         string;
  label:      string;
  entityKind: string[];    // which entity kinds this action applies to
  icon:       string;
  action:     string;      // named action identifier
}

export interface EntityActionExtension {
  capability: "entity_action";
  actions:    EntityAction[];
}

// ─── Dashboard widget ─────────────────────────────────────────────────────────

export interface DashboardWidget {
  capability:  "dashboard_widget";
  id:          string;
  label:       string;
  description: string;
  defaultSize: "small" | "medium" | "large";
  component:   string;      // registered component name
}

// ─── Plugin definition ────────────────────────────────────────────────────────

export type PluginExtension =
  | CommandExtension
  | SidebarWidget
  | EntityActionExtension
  | DashboardWidget;

export interface PluginDefinition {
  id:           string;
  name:         string;
  version:      string;
  description:  string;
  capabilities: PluginCapability[];
  extensions:   PluginExtension[];
  enabled:      boolean;
}

// ─── Registry state ───────────────────────────────────────────────────────────

export interface PluginRegistryState {
  plugins:        PluginDefinition[];
  commandItems:   CommandExtensionItem[];
  sidebarWidgets: SidebarWidget[];
  entityActions:  EntityAction[];
}

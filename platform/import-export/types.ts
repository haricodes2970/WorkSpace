/**
 * Workspace Export / Import Format — portable, relationship-preserving serialization.
 * JSON format is canonical. Markdown is human-readable derivative.
 */

// ─── Export manifest ──────────────────────────────────────────────────────────

export interface WorkspaceExportMeta {
  version:     "1.0";
  exportedAt:  string;   // ISO timestamp
  userId:      string;
  userEmail:   string;
  entityCounts: Record<string, number>;
}

// ─── Entity export shapes ─────────────────────────────────────────────────────

export interface ExportedIdea {
  id:              string;
  title:           string;
  description:     string | null;
  status:          string;
  readinessStatus: string;
  readinessScore:  number;
  tags:            string[];
  pinned:          boolean;
  convertedAt:     string | null;
  createdAt:       string;
  updatedAt:       string;
  blocks: Array<{
    type:    string;
    content: string;
  }>;
  notes: Array<{ title: string | null; content: string; createdAt: string }>;
  links: Array<{ label: string; url: string }>;
}

export interface ExportedProject {
  id:              string;
  title:           string;
  description:     string | null;
  status:          string;
  executionState:  string;
  momentumScore:   number;
  tags:            string[];
  startDate:       string | null;
  targetDate:      string | null;
  shippedAt:       string | null;
  createdAt:       string;
  updatedAt:       string;
  tasks: Array<{
    id:          string;
    title:       string;
    status:      string;
    priority:    string;
    tags:        string[];
    dueDate:     string | null;
    completedAt: string | null;
    subtasks:    Array<{ title: string; status: string }>;
  }>;
  milestones: Array<{
    title:       string;
    status:      string;
    targetDate:  string | null;
    completedAt: string | null;
  }>;
  decisions: Array<{
    title:       string;
    decision:    string;
    context:     string;
    alternatives: string;
    tradeoffs:   string;
    reversed:    boolean;
    reversalNote: string | null;
    createdAt:   string;
  }>;
  weeklyReviews: Array<{
    weekStarting:     string;
    movedForward:     string;
    stalled:          string;
    changed:          string;
    assumptionsFailed: string;
    shouldCut:        string;
    worthContinuing:  boolean;
    overallRating:    number;
  }>;
  scopeItems: Array<{ title: string; bucket: string; notes: string | null }>;
  risks: Array<{ title: string; severity: string; mitigated: boolean }>;
  blockers: Array<{ title: string; resolved: boolean }>;
  notes: Array<{ title: string | null; content: string }>;
  links: Array<{ label: string; url: string }>;
  timelineEvents: Array<{ type: string; title: string; occurredAt: string }>;
}

export interface ExportedMemory {
  id:           string;
  type:         string;
  title:        string;
  body:         string;
  tags:         string[];
  significance: number;
  pinned:       boolean;
  projectTitle: string | null;
  ideaTitle:    string | null;
  createdAt:    string;
}

export interface ExportedStrategicReview {
  id:          string;
  type:        string;
  period:      string;
  periodStart: string;
  periodEnd:   string;
  wins:        string;
  struggles:   string;
  patterns:    string;
  nextFocus:   string;
  snapshot:    unknown;
  createdAt:   string;
}

// ─── Full workspace export ────────────────────────────────────────────────────

export interface WorkspaceExport {
  meta:            WorkspaceExportMeta;
  ideas:           ExportedIdea[];
  projects:        ExportedProject[];
  memories:        ExportedMemory[];
  strategicReviews: ExportedStrategicReview[];
}

// ─── Import result ────────────────────────────────────────────────────────────

export interface ImportResult {
  success:  boolean;
  imported: Record<string, number>;
  errors:   string[];
  warnings: string[];
}

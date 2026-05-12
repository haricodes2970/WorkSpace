/**
 * Activity Event Layer — append-only system-wide event stream.
 * Foundation for strategic continuity, historical reconstruction, and future intelligence.
 */

import type { EntityKind } from "@/platform/entities/types";

// ─── Append payload shapes per kind ──────────────────────────────────────────

export interface ActivityPayloadCreated  { title: string }
export interface ActivityPayloadUpdated  { fields: string[] }
export interface ActivityPayloadArchived { reason?: string }
export interface ActivityPayloadConverted { targetKind: EntityKind; targetId: string; targetTitle: string }
export interface ActivityPayloadLinked   { targetKind: EntityKind; targetId: string; targetTitle: string }
export interface ActivityPayloadTagged   { added: string[]; removed: string[] }
export interface ActivityPayloadCompleted { title?: string }
export interface ActivityPayloadShipped  { title: string; at: string }

export type ActivityPayload =
  | ActivityPayloadCreated
  | ActivityPayloadUpdated
  | ActivityPayloadArchived
  | ActivityPayloadConverted
  | ActivityPayloadLinked
  | ActivityPayloadTagged
  | ActivityPayloadCompleted
  | ActivityPayloadShipped
  | Record<string, unknown>;

// ─── Typed event record (read model) ─────────────────────────────────────────

export interface ActivityEventRecord {
  id:         string;
  userId:     string;
  entityKind: EntityKind;
  entityId:   string;
  kind:       ActivityEventKind;
  payload:    ActivityPayload | null;
  occurredAt: Date;
}

export type ActivityEventKind =
  | "CREATED"
  | "UPDATED"
  | "ARCHIVED"
  | "CONVERTED"
  | "LINKED"
  | "REVIEWED"
  | "COMPLETED"
  | "BLOCKED"
  | "RESUMED"
  | "SHIPPED"
  | "DELETED"
  | "RESTORED"
  | "TAGGED";

// ─── Append input ─────────────────────────────────────────────────────────────

export interface AppendActivityEventInput {
  userId:     string;
  entityKind: EntityKind;
  entityId:   string;
  kind:       ActivityEventKind;
  payload?:   ActivityPayload;
  occurredAt?: Date;
}

// ─── Query options ────────────────────────────────────────────────────────────

export interface ActivityEventQueryOptions {
  limit?:      number;
  cursor?:     string;   // last event ID for cursor pagination
  kinds?:      ActivityEventKind[];
  entityKind?: EntityKind;
  entityId?:   string;
  since?:      Date;
  until?:      Date;
}

CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('RAW', 'REFINING', 'READY', 'CONVERTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('CAPTURED', 'EXPLORING', 'VALIDATING', 'PLANNING', 'READY', 'CONVERTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('PROBLEM', 'USER_PAIN', 'EXISTING_ALTERNATIVES', 'MARKET_GAP', 'CONSTRAINTS', 'RISKS', 'ASSUMPTIONS', 'MVP_SCOPE', 'SUCCESS_METRICS', 'EXECUTION_PLAN', 'MONETIZATION', 'VALIDATION_STRATEGY');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('RELATED', 'DEPENDS_ON', 'BLOCKS', 'DUPLICATE_OF', 'SPAWNED_FROM');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'SHIPPED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExecutionState" AS ENUM ('PLANNING', 'BUILDING', 'VALIDATING', 'STABILIZING', 'SHIPPING', 'MAINTAINING', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('TASK_COMPLETED', 'MILESTONE_REACHED', 'SCOPE_CHANGED', 'DECISION_MADE', 'REVIEW_COMPLETED', 'STATUS_CHANGED', 'BLOCKED', 'UNBLOCKED', 'NOTE_ADDED', 'SHIPPED');

-- CreateEnum
CREATE TYPE "ScopeBucket" AS ENUM ('MVP', 'V1', 'LATER', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('INSIGHT', 'MISTAKE', 'DISCOVERY', 'PATTERN', 'CONSTRAINT', 'LEARNING', 'BREAKTHROUGH', 'PIVOT');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('IDEA', 'PROJECT', 'DECISION', 'WEEKLY_REVIEW', 'NOTE', 'KNOWLEDGE_MEMORY', 'MILESTONE', 'BLOCKER');

-- CreateEnum
CREATE TYPE "GraphRelationshipType" AS ENUM ('RELATED_TO', 'INSPIRED_BY', 'BLOCKED_BY', 'DUPLICATES', 'EVOLVED_INTO', 'REFERENCES', 'CONTRADICTS', 'DEPENDS_ON', 'VALIDATES', 'REPLACES');

-- CreateEnum
CREATE TYPE "EmbeddingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('BLOCKER_PATTERN', 'SCOPE_INFLATION', 'MOMENTUM_DECAY', 'ABANDONED_PATTERN', 'EXECUTION_BOTTLENECK', 'REVIEW_BENEFIT', 'DECISION_REVERSAL', 'VELOCITY_TREND');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RetrospectiveType" AS ENUM ('WEEKLY', 'MONTHLY', 'PROJECT_CLOSE', 'IDEA_AUDIT', 'DECISION_REVIEW', 'QUARTERLY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'RAW',
    "readiness_status" "ReadinessStatus" NOT NULL DEFAULT 'CAPTURED',
    "readiness_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "project_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_blocks" (
    "id" UUID NOT NULL,
    "idea_id" UUID NOT NULL,
    "type" "BlockType" NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "idea_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_relationships" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "execution_state" "ExecutionState" NOT NULL DEFAULT 'PLANNING',
    "momentum_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scope_health_score" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reviews" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "week_starting" DATE NOT NULL,
    "moved_forward" TEXT NOT NULL DEFAULT '',
    "stalled" TEXT NOT NULL DEFAULT '',
    "changed" TEXT NOT NULL DEFAULT '',
    "assumptions_failed" TEXT NOT NULL DEFAULT '',
    "should_cut" TEXT NOT NULL DEFAULT '',
    "worth_continuing" BOOLEAN NOT NULL DEFAULT true,
    "overall_rating" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "decision" TEXT NOT NULL,
    "alternatives" TEXT NOT NULL DEFAULT '',
    "tradeoffs" TEXT NOT NULL DEFAULT '',
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversal_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scope_items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "bucket" "ScopeBucket" NOT NULL DEFAULT 'MVP',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scope_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_risks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "RiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "mitigated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "project_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockers" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "milestone_id" UUID,
    "parent_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'UPCOMING',
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "idea_id" UUID,
    "project_id" UUID,
    "task_id" UUID,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "idea_id" UUID,
    "project_id" UUID,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_memories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "idea_id" UUID,
    "type" "MemoryType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "significance" INTEGER NOT NULL DEFAULT 5,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_relationships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sourceType" "EntityType" NOT NULL,
    "source_id" UUID NOT NULL,
    "targetType" "EntityType" NOT NULL,
    "target_id" UUID NOT NULL,
    "type" "GraphRelationshipType" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" UUID NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "vector" vector(1536),
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embedding_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" "EmbeddingJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "embedding_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_snapshots" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "evidence" JSONB,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'INFO',
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "insight_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrospectives" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "type" "RetrospectiveType" NOT NULL,
    "title" TEXT NOT NULL,
    "period" TEXT,
    "went_well" TEXT NOT NULL DEFAULT '',
    "went_poorly" TEXT NOT NULL DEFAULT '',
    "learned" TEXT NOT NULL DEFAULT '',
    "next_actions" TEXT NOT NULL DEFAULT '',
    "snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retrospectives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_auth_id_idx" ON "users"("auth_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "ideas_project_id_key" ON "ideas"("project_id");

-- CreateIndex
CREATE INDEX "ideas_user_id_idx" ON "ideas"("user_id");

-- CreateIndex
CREATE INDEX "ideas_status_idx" ON "ideas"("status");

-- CreateIndex
CREATE INDEX "ideas_readiness_status_idx" ON "ideas"("readiness_status");

-- CreateIndex
CREATE INDEX "ideas_readiness_score_idx" ON "ideas"("readiness_score");

-- CreateIndex
CREATE INDEX "ideas_deleted_at_idx" ON "ideas"("deleted_at");

-- CreateIndex
CREATE INDEX "idea_blocks_idea_id_idx" ON "idea_blocks"("idea_id");

-- CreateIndex
CREATE INDEX "idea_blocks_deleted_at_idx" ON "idea_blocks"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "idea_blocks_idea_id_type_key" ON "idea_blocks"("idea_id", "type");

-- CreateIndex
CREATE INDEX "idea_relationships_source_id_idx" ON "idea_relationships"("source_id");

-- CreateIndex
CREATE INDEX "idea_relationships_target_id_idx" ON "idea_relationships"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "idea_relationships_source_id_target_id_key" ON "idea_relationships"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_execution_state_idx" ON "projects"("execution_state");

-- CreateIndex
CREATE INDEX "projects_deleted_at_idx" ON "projects"("deleted_at");

-- CreateIndex
CREATE INDEX "weekly_reviews_project_id_idx" ON "weekly_reviews"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reviews_project_id_week_starting_key" ON "weekly_reviews"("project_id", "week_starting");

-- CreateIndex
CREATE INDEX "decisions_project_id_idx" ON "decisions"("project_id");

-- CreateIndex
CREATE INDEX "decisions_deleted_at_idx" ON "decisions"("deleted_at");

-- CreateIndex
CREATE INDEX "timeline_events_project_id_occurred_at_idx" ON "timeline_events"("project_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "scope_items_project_id_idx" ON "scope_items"("project_id");

-- CreateIndex
CREATE INDEX "scope_items_deleted_at_idx" ON "scope_items"("deleted_at");

-- CreateIndex
CREATE INDEX "project_risks_project_id_idx" ON "project_risks"("project_id");

-- CreateIndex
CREATE INDEX "project_risks_deleted_at_idx" ON "project_risks"("deleted_at");

-- CreateIndex
CREATE INDEX "blockers_project_id_idx" ON "blockers"("project_id");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_deleted_at_idx" ON "tasks"("deleted_at");

-- CreateIndex
CREATE INDEX "milestones_user_id_idx" ON "milestones"("user_id");

-- CreateIndex
CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");

-- CreateIndex
CREATE INDEX "milestones_deleted_at_idx" ON "milestones"("deleted_at");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_deleted_at_idx" ON "notes"("deleted_at");

-- CreateIndex
CREATE INDEX "links_user_id_idx" ON "links"("user_id");

-- CreateIndex
CREATE INDEX "links_deleted_at_idx" ON "links"("deleted_at");

-- CreateIndex
CREATE INDEX "knowledge_memories_user_id_idx" ON "knowledge_memories"("user_id");

-- CreateIndex
CREATE INDEX "knowledge_memories_project_id_idx" ON "knowledge_memories"("project_id");

-- CreateIndex
CREATE INDEX "knowledge_memories_idea_id_idx" ON "knowledge_memories"("idea_id");

-- CreateIndex
CREATE INDEX "knowledge_memories_type_idx" ON "knowledge_memories"("type");

-- CreateIndex
CREATE INDEX "knowledge_memories_deleted_at_idx" ON "knowledge_memories"("deleted_at");

-- CreateIndex
CREATE INDEX "graph_relationships_user_id_idx" ON "graph_relationships"("user_id");

-- CreateIndex
CREATE INDEX "graph_relationships_sourceType_source_id_idx" ON "graph_relationships"("sourceType", "source_id");

-- CreateIndex
CREATE INDEX "graph_relationships_targetType_target_id_idx" ON "graph_relationships"("targetType", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "graph_relationships_sourceType_source_id_targetType_target__key" ON "graph_relationships"("sourceType", "source_id", "targetType", "target_id");

-- CreateIndex
CREATE INDEX "embeddings_entityType_idx" ON "embeddings"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_entityType_entity_id_key" ON "embeddings"("entityType", "entity_id");

-- CreateIndex
CREATE INDEX "embedding_jobs_status_created_at_idx" ON "embedding_jobs"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "embedding_jobs_entityType_entity_id_key" ON "embedding_jobs"("entityType", "entity_id");

-- CreateIndex
CREATE INDEX "insight_snapshots_user_id_dismissed_idx" ON "insight_snapshots"("user_id", "dismissed");

-- CreateIndex
CREATE INDEX "insight_snapshots_generated_at_idx" ON "insight_snapshots"("generated_at");

-- CreateIndex
CREATE INDEX "retrospectives_user_id_idx" ON "retrospectives"("user_id");

-- CreateIndex
CREATE INDEX "retrospectives_project_id_idx" ON "retrospectives"("project_id");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_blocks" ADD CONSTRAINT "idea_blocks_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_relationships" ADD CONSTRAINT "idea_relationships_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_relationships" ADD CONSTRAINT "idea_relationships_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scope_items" ADD CONSTRAINT "scope_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scope_items" ADD CONSTRAINT "scope_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_memories" ADD CONSTRAINT "knowledge_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_memories" ADD CONSTRAINT "knowledge_memories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_memories" ADD CONSTRAINT "knowledge_memories_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_relationships" ADD CONSTRAINT "graph_relationships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embedding_jobs" ADD CONSTRAINT "embedding_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_snapshots" ADD CONSTRAINT "insight_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrospectives" ADD CONSTRAINT "retrospectives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrospectives" ADD CONSTRAINT "retrospectives_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

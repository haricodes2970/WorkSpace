import { prisma } from "@/lib/prisma/client";
import type { ProjectStatus, InsightSeverity, TaskStatus, Priority } from "@prisma/client";

export interface ActiveBuild {
  id: string;
  title: string;
  status: ProjectStatus;
  momentumScore: number;
  tasksDone: number;
  tasksTotal: number;
  activeBlockers: number;
  updatedAt: Date;
}

export interface TodayBlocker {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
  daysOld: number;
}

export interface TodayTask {
  id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  projectId: string;
  projectTitle: string;
  dueDate: Date | null;
  isOverdue: boolean;
}

export interface TodayDecision {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
  createdAt: Date;
}

export interface TodayInsight {
  id: string;
  title: string;
  body: string;
  severity: InsightSeverity;
  type: string;
}

export interface StaleProject {
  id: string;
  title: string;
  daysSince: number;
}

export interface TodayData {
  activeBuilds: ActiveBuild[];
  blockers: TodayBlocker[];
  tasks: TodayTask[];
  decisions: TodayDecision[];
  insights: TodayInsight[];
  staleProjects: StaleProject[];
  avgMomentum: number;
  totalActive: number;
}

export async function getTodayData(userId: string): Promise<TodayData> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [projects, allBlockers, focusTasks, recentDecisions, insights] = await Promise.all([
    prisma.project.findMany({
      where: { userId, deletedAt: null, status: "ACTIVE" },
      include: {
        tasks:    { where: { deletedAt: null }, select: { id: true, status: true } },
        blockers: { where: { resolved: false }, select: { id: true } },
        weeklyReviews: {
          orderBy: { weekStarting: "desc" },
          take: 1,
          select: { weekStarting: true },
        },
      },
      orderBy: { momentumScore: "desc" },
    }),
    prisma.blocker.findMany({
      where: { project: { userId }, resolved: false },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: {
        project: { userId },
        projectId: { not: null },
        deletedAt: null,
        status: { notIn: ["DONE", "CANCELLED"] },
        OR: [
          { status: "IN_PROGRESS" },
          { dueDate: { lte: now } },
          { priority: { in: ["HIGH", "URGENT"] } },
        ],
      },
      include: { project: { select: { id: true, title: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 12,
    }),
    prisma.decision.findMany({
      where: {
        userId,
        deletedAt: null,
        reversed: false,
        createdAt: { gte: sevenDaysAgo },
      },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.insightSnapshot.findMany({
      where: { userId, dismissed: false, severity: { in: ["WARNING", "CRITICAL"] } },
      orderBy: [{ severity: "desc" }, { generatedAt: "desc" }],
      take: 3,
    }),
  ]);

  const staleProjects: StaleProject[] = projects
    .filter((p) => {
      const last = p.weeklyReviews[0]?.weekStarting;
      return !last || last < sevenDaysAgo;
    })
    .map((p) => {
      const last = p.weeklyReviews[0]?.weekStarting ?? p.updatedAt;
      const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return { id: p.id, title: p.title, daysSince };
    })
    .slice(0, 3);

  const activeBuilds: ActiveBuild[] = projects.map((p) => ({
    id:             p.id,
    title:          p.title,
    status:         p.status,
    momentumScore:  p.momentumScore,
    tasksDone:      p.tasks.filter((t) => t.status === "DONE").length,
    tasksTotal:     p.tasks.length,
    activeBlockers: p.blockers.length,
    updatedAt:      p.updatedAt,
  }));

  const avgMomentum =
    activeBuilds.length > 0
      ? Math.round(activeBuilds.reduce((s, b) => s + b.momentumScore, 0) / activeBuilds.length)
      : 0;

  return {
    activeBuilds,
    blockers: allBlockers.map((b) => ({
      id:           b.id,
      title:        b.title,
      projectId:    b.project.id,
      projectTitle: b.project.title,
      daysOld:      Math.floor((now.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    })),
    tasks: focusTasks
      .filter((t) => t.project !== null)
      .map((t) => ({
        id:           t.id,
        title:        t.title,
        priority:     t.priority,
        status:       t.status,
        projectId:    t.project!.id,
        projectTitle: t.project!.title,
        dueDate:      t.dueDate,
        isOverdue:    t.dueDate ? t.dueDate < now : false,
      })),
    decisions: recentDecisions.map((d) => ({
      id:           d.id,
      title:        d.title,
      projectId:    d.project.id,
      projectTitle: d.project.title,
      createdAt:    d.createdAt,
    })),
    insights: insights.map((i) => ({
      id:       i.id,
      title:    i.title,
      body:     i.body,
      severity: i.severity,
      type:     i.type,
    })),
    staleProjects,
    avgMomentum,
    totalActive: projects.length,
  };
}

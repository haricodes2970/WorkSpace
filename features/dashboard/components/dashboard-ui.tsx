"use client";

import { motion } from "framer-motion";
import { FolderKanban, Lightbulb, Zap, Rocket, ArrowRight, Clock } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motionPresets } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href: Route;
  change?: string;
}

function StatCard({ label, value, icon, href, change }: StatCardProps) {
  return (
    <Link href={href}>
      <motion.div
        className="group rounded-lg border border-[--color-border] bg-[--color-card] p-4 cursor-pointer transition-colors hover:border-[--color-border-strong] hover:bg-[--color-card-hover]"
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-start justify-between">
          <div className="text-[--color-text-muted]">{icon}</div>
          <ArrowRight className="h-3.5 w-3.5 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-3">
          <div className="text-2xl font-semibold text-[--color-text-primary] tabular-nums">
            {value}
          </div>
          <div className="mt-0.5 text-[12px] text-[--color-text-muted]">{label}</div>
        </div>
        {change && (
          <div className="mt-2 text-[11px] text-[--color-text-muted]">{change}</div>
        )}
      </motion.div>
    </Link>
  );
}

interface ActivityItem {
  id: string;
  type: "idea_created" | "idea_converted" | "project_shipped" | "task_completed" | "project_created";
  title: string;
  subtitle?: string;
  timestamp: Date;
}

interface DashboardStats {
  activeProjects: number;
  openIdeas: number;
  tasksDueToday: number;
  shipped: number;
}

interface DashboardUIProps {
  userName: string | null;
  stats: DashboardStats;
  recentActivity: ActivityItem[];
}

const activityConfig = {
  idea_created: { icon: <Lightbulb className="h-3.5 w-3.5" />, color: "text-[--color-warning]", label: "Idea captured" },
  idea_converted: { icon: <ArrowRight className="h-3.5 w-3.5" />, color: "text-[--color-primary]", label: "Idea converted" },
  project_shipped: { icon: <Rocket className="h-3.5 w-3.5" />, color: "text-[--color-success]", label: "Shipped" },
  task_completed: { icon: <Zap className="h-3.5 w-3.5" />, color: "text-[--color-accent]", label: "Task done" },
  project_created: { icon: <FolderKanban className="h-3.5 w-3.5" />, color: "text-[--color-primary]", label: "Project started" },
};

export function DashboardUI({ userName, stats, recentActivity }: DashboardUIProps) {
  const greeting = userName ? `${userName.split(" ")[0]}` : "there";
  const statCards: StatCardProps[] = [
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: <FolderKanban className="h-4 w-4" />,
      href: "/projects",
    },
    {
      label: "Open Ideas",
      value: stats.openIdeas,
      icon: <Lightbulb className="h-4 w-4" />,
      href: "/ideas",
    },
    {
      label: "Tasks Due Today",
      value: stats.tasksDueToday,
      icon: <Zap className="h-4 w-4" />,
      href: "/tasks",
    },
    {
      label: "Shipped",
      value: stats.shipped,
      icon: <Rocket className="h-4 w-4" />,
      href: "/projects?status=shipped",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      {/* Header */}
      <motion.div {...motionPresets.fadeUp}>
        <h1 className="text-[20px] font-semibold text-[--color-text-primary]">
          Hey, {greeting}
        </h1>
        <p className="mt-0.5 text-[13px] text-[--color-text-muted]">
          Here&apos;s what needs your attention.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
            }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="rounded-lg border border-[--color-border] bg-[--color-card] overflow-hidden"
        {...motionPresets.fadeUp}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border-subtle]">
          <h2 className="text-[13px] font-medium text-[--color-text-primary]">
            Recent Activity
          </h2>
          <Clock className="h-3.5 w-3.5 text-[--color-text-muted]" />
        </div>

        {recentActivity.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Lightbulb className="h-8 w-8 text-[--color-text-muted] mx-auto mb-3 opacity-40" />
            <p className="text-[13px] text-[--color-text-muted]">
              Start by capturing your first idea.
            </p>
            <Link
              href="/ideas/new"
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[--color-primary] hover:underline"
            >
              Capture an idea <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[--color-border-subtle]">
            {recentActivity.map((item) => {
              const config = activityConfig[item.type];
              return (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[--color-card-hover] transition-colors">
                  <span className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[--color-text-primary] truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[11px] text-[--color-text-muted] truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                    <span className="text-[11px] text-[--color-text-muted] whitespace-nowrap">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

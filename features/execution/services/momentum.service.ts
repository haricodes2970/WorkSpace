import type { ExecutionState } from "@prisma/client";
import { projectRepository } from "@/repositories/project.repository";
import { calculateMomentum, type MomentumState } from "../momentum/calculator";

function momentumStateToExecutionState(
  state: MomentumState,
  projectStatus: string
): ExecutionState {
  if (projectStatus === "SHIPPED") return "MAINTAINING";
  if (projectStatus === "PAUSED") return "PAUSED";
  if (projectStatus === "ARCHIVED") return "ARCHIVED";

  switch (state) {
    case "ACCELERATING":
    case "ACTIVE":
      return "BUILDING";
    case "STABLE":
    case "SLOWING":
      return "VALIDATING";
    case "STALLED":
    case "ABANDONED":
      return "PAUSED";
    default:
      return "BUILDING";
  }
}

export class MomentumService {
  /**
   * Recalculate momentum from live task data and persist to project row.
   */
  async syncProjectMomentum(
    projectId: string,
    tasks: { status: import("@prisma/client").TaskStatus; completedAt: Date | null; updatedAt: Date }[],
    milestones: { status: import("@prisma/client").MilestoneStatus; completedAt: Date | null }[],
    projectCreatedAt: Date,
    currentProjectStatus: string
  ): Promise<import("../momentum/calculator").MomentumResult> {
    const result = calculateMomentum({ tasks, milestones, projectCreatedAt });

    const executionState = momentumStateToExecutionState(
      result.state,
      currentProjectStatus
    );

    await projectRepository.updateMomentum(projectId, result.score, executionState);

    return result;
  }
}

export const momentumService = new MomentumService();

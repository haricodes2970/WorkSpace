import {
  AlertCircle, Users, Layers, TrendingUp,
  ShieldAlert, AlertTriangle, HelpCircle,
  Package, Target, Zap, DollarSign, CheckSquare2,
} from "lucide-react";
import type { BlockType } from "@prisma/client";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  hint: string;
  position: number;
  scoredFactor: boolean; // contributes to readiness score
  requiredForConversion: boolean;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "PROBLEM",
    label: "Problem Statement",
    shortLabel: "Problem",
    icon: AlertCircle,
    placeholder:
      "What specific problem does this solve?\n\nWho experiences it? When? How often?\n\nWhat makes it painful enough to pay for a solution?",
    hint: "The more specific, the stronger the foundation.",
    position: 0,
    scoredFactor: true,
    requiredForConversion: true,
  },
  {
    type: "USER_PAIN",
    label: "User Pain",
    shortLabel: "User Pain",
    icon: Users,
    placeholder:
      "Who is the primary user?\n\n- Job title / context:\n- Current workaround:\n- Frequency of pain:\n- Emotional cost:",
    hint: "Name a real person if you can.",
    position: 1,
    scoredFactor: true,
    requiredForConversion: true,
  },
  {
    type: "EXISTING_ALTERNATIVES",
    label: "Existing Alternatives",
    shortLabel: "Alternatives",
    icon: Layers,
    placeholder:
      "What do people use today?\n\n- Tool / method 1 and why it falls short:\n- Tool / method 2 and why it falls short:\n- Doing nothing — what's the cost?",
    hint: "Knowing what exists forces you to articulate differentiation.",
    position: 2,
    scoredFactor: false,
    requiredForConversion: false,
  },
  {
    type: "MARKET_GAP",
    label: "Market Gap",
    shortLabel: "Gap",
    icon: TrendingUp,
    placeholder:
      "Why now? What changed recently (tech, behavior, regulation) that creates space?\n\nWhy haven't incumbents filled this gap?",
    hint: "Timing is often the hardest question.",
    position: 3,
    scoredFactor: true,
    requiredForConversion: false,
  },
  {
    type: "ASSUMPTIONS",
    label: "Assumptions",
    shortLabel: "Assumptions",
    icon: HelpCircle,
    placeholder:
      "List the beliefs this idea is built on:\n\n- Users are willing to pay $X\n- The integration with Y is feasible\n- Adoption happens through Z channel",
    hint: "Every assumption is a risk if wrong.",
    position: 4,
    scoredFactor: false,
    requiredForConversion: false,
  },
  {
    type: "RISKS",
    label: "Risks",
    shortLabel: "Risks",
    icon: ShieldAlert,
    placeholder:
      "What could kill this idea?\n\n- Technical risk:\n- Market risk:\n- Execution risk:\n- Competition risk:",
    hint: "Named risks can be mitigated. Unknown risks sink projects.",
    position: 5,
    scoredFactor: true,
    requiredForConversion: false,
  },
  {
    type: "CONSTRAINTS",
    label: "Constraints",
    shortLabel: "Constraints",
    icon: AlertTriangle,
    placeholder:
      "What are the hard limits?\n\n- Time: can ship in X weeks solo\n- Budget: no external infrastructure cost > $Y/mo\n- Scope: must work without auth in v1",
    hint: "Constraints are inputs to design, not obstacles.",
    position: 6,
    scoredFactor: false,
    requiredForConversion: false,
  },
  {
    type: "MVP_SCOPE",
    label: "MVP Scope",
    shortLabel: "MVP",
    icon: Package,
    placeholder:
      "What is the minimum that proves the core value?\n\n- [ ] Feature 1\n- [ ] Feature 2\n- [ ] Feature 3\n\nNot in v1:\n- Feature X (Phase 2)\n- Feature Y (if validated)",
    hint: "If you have more than 5 items, cut until you do.",
    position: 7,
    scoredFactor: true,
    requiredForConversion: true,
  },
  {
    type: "SUCCESS_METRICS",
    label: "Success Metrics",
    shortLabel: "Metrics",
    icon: Target,
    placeholder:
      "How will you know this is working?\n\n- Quantitative: X users / $Y ARR / Z% retention\n- Qualitative: users describe it as ___\n- Failure signal: if after 4 weeks we haven't seen ___, we pivot",
    hint: "Define success before you build.",
    position: 8,
    scoredFactor: true,
    requiredForConversion: false,
  },
  {
    type: "EXECUTION_PLAN",
    label: "Execution Plan",
    shortLabel: "Execution",
    icon: Zap,
    placeholder:
      "How will you build and ship this?\n\n- Stack / approach:\n- Week 1:\n- Week 2–4:\n- Launch strategy:\n- Open questions:",
    hint: "Rough is fine. The act of writing it surfaces blockers.",
    position: 9,
    scoredFactor: true,
    requiredForConversion: true,
  },
  {
    type: "MONETIZATION",
    label: "Monetization",
    shortLabel: "Revenue",
    icon: DollarSign,
    placeholder:
      "How does this make money (or justify its existence)?\n\n- Model: SaaS / one-time / freemium / open-source\n- Price point:\n- Why someone pays vs free alternative:",
    hint: "Even internal tools need to justify their cost.",
    position: 10,
    scoredFactor: false,
    requiredForConversion: false,
  },
  {
    type: "VALIDATION_STRATEGY",
    label: "Validation Strategy",
    shortLabel: "Validation",
    icon: CheckSquare2,
    placeholder:
      "How will you validate before/during building?\n\n- Smoke test: landing page + waitlist?\n- User interviews: X conversations this week\n- Prototype: what's the cheapest test?\n- Kill criteria: stop if ___",
    hint: "Validation before building saves weeks.",
    position: 11,
    scoredFactor: false,
    requiredForConversion: false,
  },
] as const;

export const BLOCK_MAP = new Map(
  BLOCK_DEFINITIONS.map((d) => [d.type, d])
);

export function getBlockDef(type: BlockType): BlockDefinition {
  const def = BLOCK_MAP.get(type);
  if (!def) throw new Error(`Unknown block type: ${type}`);
  return def;
}

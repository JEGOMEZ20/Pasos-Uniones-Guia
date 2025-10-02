import { SUBTYPE_RULES, passClassOD } from "../engine/lrShips.js";
import type { Group, PipeClass } from "../engine/lrShips.js";

type Clause = { code: string; section: string; title: string };

type Evaluation = {
  status: "allowed" | "conditional" | "forbidden";
  conditions: string[];
  reasons: string[];
  notesApplied: number[];
  clauses: Clause[];
};

export type CardTone = "success" | "warning" | "danger";

export type SubtypeState = {
  id: string;
  enabled: boolean;
};

export type JointsGroupCardState = {
  tone: CardTone;
  status: Evaluation["status"];
  conditions: string[];
  reasons: string[];
  notes: number[];
  clauses: Clause[];
  subtypes: SubtypeState[];
};

type BuildStateParams = {
  group: Group;
  evaluation: Evaluation;
  pipeClass: PipeClass;
  od_mm?: number;
};

export function buildJointsGroupCardState({
  group,
  evaluation,
  pipeClass,
  od_mm,
}: BuildStateParams): JointsGroupCardState {
  const tone: CardTone = evaluation.status === "forbidden"
    ? "danger"
    : evaluation.status === "conditional" || evaluation.conditions.length > 0
    ? "warning"
    : "success";

  const subtypes = (SUBTYPE_RULES[group] ?? []).map((rule) => ({
    id: rule.id,
    enabled: evaluation.status !== "forbidden" && passClassOD(rule, pipeClass, od_mm),
  }));

  return {
    tone,
    status: evaluation.status,
    conditions: [...evaluation.conditions],
    reasons: [...evaluation.reasons],
    notes: [...evaluation.notesApplied],
    clauses: [...evaluation.clauses],
    subtypes,
  };
}

export function isSubtypeEnabled(state: JointsGroupCardState, subtypeId: string) {
  return state.subtypes.some((item) => item.id === subtypeId && item.enabled);
}

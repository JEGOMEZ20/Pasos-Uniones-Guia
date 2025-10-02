export type EvalStatus = "allowed" | "conditional" | "forbidden";

export type ClauseRef = {
  code: string;
  title: string;
  section: string;
};

export type EvalResult = {
  status: EvalStatus;
  conditions: string[];
  reasons: string[];
  clauses?: ClauseRef[];
  notesApplied?: number[];
};

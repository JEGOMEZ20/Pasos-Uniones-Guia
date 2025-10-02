import { LR_SHIPS_SYSTEMS } from "../data/lr_ships_mech_joints.js";
import type { Group, Joint, LrShipRow, PipeClass, Space } from "../data/lr_ships_mech_joints.js";

export type { Space, PipeClass, Group, Joint } from "../data/lr_ships_mech_joints.js";

type Status = "allowed" | "conditional" | "forbidden";

export type ClauseRef = { code: string; section: string; title: string };

type Eval = {
  status: Status;
  conditions: string[];
  reasons: string[];
  notesApplied: number[];
  clauses: ClauseRef[];
};

type LRShipsDataset = LrShipRow[];

export interface LRShipsContext {
  systemId: string;
  space: Space;
  pipeClass?: PipeClass;
  od_mm?: number;
  accessibility?: "easy" | "not_easy";
  mediumInPipeSameAsTank?: boolean;
  asMainMeans?: boolean;
  directToShipSideBelowLimit?: boolean;
  tankContainsFlammable?: boolean;
  joint?: Joint;
}

export interface LRShipsJointContext extends LRShipsContext {
  joint: Joint;
}

type SubtypeRule = {
  id: string;
  classes: PipeClass[];
  od_max_mm?: Partial<Record<PipeClass, number>>;
};

export const SUBTYPE_RULES: Record<Group, SubtypeRule[]> = {
  pipe_unions: [
    { id: "welded_brazed", classes: ["I", "II", "III"], od_max_mm: { I: 60.3, II: 60.3 } },
  ],
  compression_couplings: [
    { id: "swage", classes: ["I", "II", "III"] },
    { id: "bite", classes: ["I", "II", "III"], od_max_mm: { I: 60.3, II: 60.3 } },
    { id: "typical", classes: ["I", "II", "III"], od_max_mm: { I: 60.3, II: 60.3 } },
    { id: "flared", classes: ["I", "II", "III"], od_max_mm: { I: 60.3, II: 60.3 } },
    { id: "press", classes: ["III"] },
  ],
  slip_on_joints: [
    { id: "machine_grooved", classes: ["I", "II", "III"] },
    { id: "grip", classes: ["II", "III"] },
    { id: "slip_type", classes: ["II", "III"] },
  ],
};

export function passClassOD(rule: SubtypeRule, cls: PipeClass, od_mm?: number) {
  if (!rule.classes.includes(cls)) return false;
  const lim = rule.od_max_mm?.[cls];
  return lim ? (od_mm ?? Infinity) <= lim : true;
}

const JOINT_GROUP_MAP: Record<Joint, Group> = {
  pipe_unions: "pipe_unions",
  compression_couplings: "compression_couplings",
  slip_on_joints: "slip_on_joints",
  pipe_union_welded_brazed: "pipe_unions",
  compression_swage: "compression_couplings",
  compression_bite: "compression_couplings",
  compression_typical: "compression_couplings",
  compression_flared: "compression_couplings",
  compression_press: "compression_couplings",
  slip_on_machine_grooved: "slip_on_joints",
  slip_on_grip: "slip_on_joints",
  slip_on_slip_type: "slip_on_joints",
};

const JOINT_SUBTYPE_IDS: Partial<Record<Joint, string>> = {
  pipe_union_welded_brazed: "welded_brazed",
  compression_swage: "swage",
  compression_bite: "bite",
  compression_typical: "typical",
  compression_flared: "flared",
  compression_press: "press",
  slip_on_machine_grooved: "machine_grooved",
  slip_on_grip: "grip",
  slip_on_slip_type: "slip_type",
};

type GroupEvaluations = Record<Group, Eval>;

export function evaluateLRShips(ctx: LRShipsJointContext, dataset?: LRShipsDataset): Eval;
export function evaluateLRShips(ctx: LRShipsContext, dataset?: LRShipsDataset): GroupEvaluations;
export function evaluateLRShips(
  ctx: LRShipsContext,
  dataset: LRShipsDataset = LR_SHIPS_SYSTEMS,
): Eval | GroupEvaluations {
  const { groups } = evaluateGroupsWithRow(ctx, dataset);

  if (!ctx.joint) {
    return cloneGroups(groups);
  }

  const group = JOINT_GROUP_MAP[ctx.joint];
  if (!group) {
    throw new Error(`Joint no reconocido: ${ctx.joint}`);
  }

  const base = cloneEval(groups[group]);
  if (ctx.joint === group || base.status === "forbidden") {
    return base;
  }

  const subtypeId = JOINT_SUBTYPE_IDS[ctx.joint];
  if (!subtypeId) {
    block(base, "Tabla 12.2.9: subtipo no reconocido");
    return base;
  }

  const cls = ctx.pipeClass;
  if (!cls) {
    block(base, "Tabla 12.2.9: requiere clase/OD");
    return base;
  }

  const rule = (SUBTYPE_RULES[group] ?? []).find((item) => item.id === subtypeId);
  if (!rule) {
    block(base, "Tabla 12.2.9: subtipo no reconocido");
    return base;
  }

  if (!passClassOD(rule, cls, ctx.od_mm)) {
    block(base, "Tabla 12.2.9: subtipo fuera de límite de clase/OD");
  }

  return base;
}

export function evaluateGroups(
  ctx: LRShipsContext,
  dataset: LRShipsDataset = LR_SHIPS_SYSTEMS,
): GroupEvaluations {
  const { groups } = evaluateGroupsWithRow(ctx, dataset);
  return cloneGroups(groups);
}

function evaluateGroupsWithRow(
  ctx: LRShipsContext,
  dataset: LRShipsDataset,
): { groups: GroupEvaluations; row?: LrShipRow } {
  const row = findRow(ctx.systemId, dataset);
  const groups: GroupEvaluations = {
    pipe_unions: base(),
    compression_couplings: base(),
    slip_on_joints: base(),
  };

  if (!row) {
    forbidAll(groups, "Fila 12.2.8 no encontrada");
    return { groups };
  }

  for (const group of Object.keys(groups) as Group[]) {
    if (!row.allowed_joints[group]) {
      block(groups[group], "Tabla 12.2.8: ‘−’ para este tipo de unión");
    }
  }

  const fireLabel = labelFire(row.fire_test);
  if (fireLabel) {
    forEachOpen(groups, (ev) => makeConditional(ev, fireLabel));
  }

  applyRowNotes(ctx, row, groups);
  applyClauses(ctx, groups);
  applySubtypeLimits(ctx, groups);

  return { groups, row };
}

function cloneGroups(groups: GroupEvaluations): GroupEvaluations {
  return {
    pipe_unions: cloneEval(groups.pipe_unions),
    compression_couplings: cloneEval(groups.compression_couplings),
    slip_on_joints: cloneEval(groups.slip_on_joints),
  };
}

function cloneEval(ev: Eval): Eval {
  return {
    status: ev.status,
    conditions: [...ev.conditions],
    reasons: [...ev.reasons],
    notesApplied: [...ev.notesApplied],
    clauses: ev.clauses.map((clause) => ({ ...clause })),
  };
}

function findRow(id: string, dataset: LRShipsDataset): LrShipRow | undefined {
  return dataset.find((row) => row.id === id);
}

function base(): Eval {
  return { status: "allowed", conditions: [], reasons: [], notesApplied: [], clauses: [] };
}

function block(ev: Eval, reason: string) {
  ev.status = "forbidden";
  pushUnique(ev.reasons, reason);
}

function makeConditional(ev: Eval, condition: string) {
  if (ev.status === "forbidden") return;
  if (ev.status !== "conditional") {
    ev.status = "conditional";
  }
  pushUnique(ev.conditions, condition);
}

function pushUnique<T>(arr: T[], value: T) {
  if (!arr.includes(value)) arr.push(value);
}

function note(ev: Eval, n: number) {
  if (!ev.notesApplied.includes(n)) {
    ev.notesApplied.push(n);
  }
}

function noteAll(out: GroupEvaluations, n: number) {
  for (const group of Object.keys(out) as Group[]) {
    note(out[group], n);
  }
}

function forEachOpen(out: GroupEvaluations, fn: (ev: Eval) => void) {
  for (const group of Object.keys(out) as Group[]) {
    const ev = out[group];
    if (ev.status !== "forbidden") {
      fn(ev);
    }
  }
}

function forbidAll(out: GroupEvaluations, reason: string) {
  for (const group of Object.keys(out) as Group[]) {
    block(out[group], reason);
  }
}

function labelFire(test: LrShipRow["fire_test"]): string | null {
  switch (test) {
    case "30min_dry":
      return "30 min seco";
    case "30min_wet":
      return "30 min húmedo";
    case "8+22":
      return "8 min seco + 22 min húmedo";
    default:
      return null;
  }
}

function applyRowNotes(ctx: LRShipsContext, row: LrShipRow, out: GroupEvaluations) {
  if (!row.notes.length) return;

  if (row.notes.includes(2)) {
    const ev = out.slip_on_joints;
    if (ev.status !== "forbidden") {
      if (ctx.space === "machinery_cat_A" || ctx.space === "accommodation") {
        block(ev, "Nota 2: Slip-on no aceptadas en Cat. A / alojamientos");
      } else if (ctx.space === "other_machinery_accessible") {
        makeConditional(ev, "Ubicar en posición visible/accesible (MSC/Circ.734)");
      }
      note(ev, 2);
    }
  }

  if (row.notes.includes(3) && ctx.space !== "open_deck") {
    forEachOpen(out, (ev) => makeConditional(ev, "Junta de tipo resistente al fuego"));
    noteAll(out, 3);
  }

  if (row.notes.includes(4) && ctx.space === "machinery_cat_A") {
    forEachOpen(out, (ev) => makeConditional(ev, "Ensayo adicional en Cat. A (Nota 4)"));
    noteAll(out, 4);
  }
}

function applyClauses(ctx: LRShipsContext, out: GroupEvaluations) {
  const addClause = (
    ev: Eval,
    code: string,
    section: string,
    title: string,
    reason: string,
  ) => {
    block(ev, reason);
    ev.clauses.push({ code, section, title });
  };

  const slip = out.slip_on_joints;
  if (slip.status !== "forbidden") {
    const hardAccess =
      ctx.space === "cargo_hold" || ctx.space === "tank" || ctx.accessibility === "not_easy";
    if (hardAccess) {
      addClause(
        slip,
        "SH-2.12.8",
        "Pt 5, Ch 12, §2.12.8",
        "Accesibilidad Slip-on",
        "Slip-on no permitido en bodegas/tanques/espacios no fácilmente accesibles",
      );
    } else if (ctx.space === "tank" && ctx.mediumInPipeSameAsTank === false) {
      addClause(
        slip,
        "SH-2.12.8.b",
        "Pt 5, Ch 12, §2.12.8",
        "Medio en tanque",
        "Slip-on dentro de tanque: permitido sólo si el medio es el mismo",
      );
    }
  }

  if (ctx.asMainMeans && out.slip_on_joints.status !== "forbidden") {
    addClause(
      out.slip_on_joints,
      "SH-2.12.9",
      "Pt 5, Ch 12, §2.12.9",
      "Slip-type principal",
      "Slip-type no puede ser medio principal",
    );
  }

  const hazard = Boolean(ctx.directToShipSideBelowLimit || ctx.tankContainsFlammable);
  if (hazard) {
    forEachOpen(out, (ev) =>
      addClause(
        ev,
        "SH-2.12.5",
        "Pt 5, Ch 12, §2.12.5",
        "Riesgo de incendio/inundación",
        "Prohibido por riesgo de incendio/inundación",
      ),
    );
  }
}

function applySubtypeLimits(ctx: LRShipsContext, out: GroupEvaluations) {
  const cls = ctx.pipeClass;
  if (!cls) {
    forEachOpen(out, (ev) => block(ev, "Tabla 12.2.9: requiere clase/OD"));
    return;
  }

  for (const group of Object.keys(out) as Group[]) {
    const ev = out[group];
    if (ev.status === "forbidden") continue;
    const rules = SUBTYPE_RULES[group] ?? [];
    const anyOk = rules.some((rule) => passClassOD(rule, cls, ctx.od_mm));
    if (!anyOk) {
      block(ev, "Tabla 12.2.9: ningún subtipo cumple clase/OD");
    }
  }
}

export default evaluateLRShips;

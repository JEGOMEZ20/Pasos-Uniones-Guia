import dataset from "../data/lr_naval_ships_mech_joints.json";
import type { Joint, PipeClass } from "../data/lr_ships_mech_joints.js";

export type Space =
  | "machinery_cat_A"
  | "other_machinery"
  | "accommodation"
  | "munitions_store"
  | "pump_room"
  | "open_deck"
  | "open_deck_low_risk_SOLAS_9_2_3_3_2_2_10"
  | "cargo_hold"
  | "tank"
  | "cofferdam"
  | "void"
  | "intake_uptake";

export type ShipType = "naval" | "oil_tanker" | "chemical_tanker" | "other";

export interface LRNavalShipsContext {
  systemId: string;
  space: Space;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  isSectionDirectlyConnectedToShipSide?: boolean;
  aboveLimitOfWatertightIntegrity?: boolean;
  accessibility?: "easy" | "not_easy";
  location?: "visible_accessible" | "normal";
  mediumInPipeSameAsTank?: boolean;
  lineType?: "fuel_oil" | "thermal_oil" | "other";
  shipType?: ShipType;
  tailoring?: { shock?: boolean; fire?: boolean; watertight?: boolean };
  mainMeansOfConnection?: boolean;
}

export interface LRNavalShipsEvaluation {
  status: EvalStatus;
  conditions: string[];
  reasons: string[];
  normRef: string;
  reason?: string;
  systemId: string;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  trace: string[];
  observations: string[];
  notesApplied: number[];
  generalClauses: string[];
}

const normReference = "LR Naval Ships Vol2 Pt7 Ch1 §5.10, Tablas 1.5.3–1.5.4";

const FIRE_TEST_LABELS: Record<string, string> = {
  "30min_dry": "Ensayo de fuego: 30 min seco",
  "30min_wet": "Ensayo de fuego: 30 min húmedo",
  "8min_dry_plus_22min_wet": "Ensayo de fuego: 8 min seco + 22 min húmedo",
};

const NOTE1_FIRE_CHIP =
  "Tipo resistente al fuego si componentes se deterioran en incendio (Cat. A)";
const NOTE1_BILGE_MATERIAL_CHIP = "Material acople bilge main: acero/CuNi/equiv.";
const NOTE2_LOCATION_CHIP = "Ubicación visible y accesible";
const NOTE3_FIRE_CHIP = "Tipo resistente al fuego";
const NOTE4_FIRE_CHIP = "Tipo resistente al fuego";
const NOTE5_STEAM_CHIP =
  "Restringido a cubierta expuesta ≤10 bar (vapor, petroleros/quimiqueros)";
const NOTE6_WLI_CHIP = "Solo sobre Límite de Integridad Estanca (WLI)";
const NOTE7_INFO_CHIP = "HVAC/intakes: ver secciones específicas de las Reglas";
const SLIP_TYPE_WARNING = "No como medio principal (slip-type)";
const TAILORING_CHIP_PREFIX = "Tailoring Doc: validar";

type Group = "pipe_unions" | "compression_couplings" | "slip_on_joints";
type EvalStatus = "allowed" | "conditional" | "forbidden";

interface GroupEvalResult {
  status: EvalStatus;
  conditions: string[];
  reasons: string[];
  notesApplied: number[];
  generalClauses: string[];
  trace: string[];
  skipGeneralClauses?: boolean;
}

type NavalSystem = {
  id: string;
  label_es: string;
  label_en: string;
  class_of_pipe_system: string;
  fire_test: "30min_dry" | "30min_wet" | "8min_dry_plus_22min_wet" | "not_required";
  notes: number[];
  extra?: string;
  allowed_joints: Partial<Record<Group, boolean>>;
};

type NavalNote =
  | {
      type: "catA_fire_resistant_if_deteriorates_and_material_for_bilge_main";
      catA_requires_fire_resistant: boolean;
      bilge_main_materials: string[];
    }
  | {
      type: "no_slip_on_in_catA_munitions_accommodation";
      prohibit_spaces: Space[];
      allow_other_machinery_if_visible_accessible: boolean;
    }
  | {
      type: "fire_resistant_except_open_deck_low_fire_risk";
      exception: { space: Space };
    }
  | { type: "fire_resistant_required" }
  | {
      type: "restrained_slip_on_steam_open_deck_tankers_le_10bar";
      space: "open_deck";
      ship_types: ShipType[];
      max_pressure_bar: number;
    }
  | { type: "only_above_limit_of_watertight_integrity" }
  | { type: "hvac_trunking_intakes_uptakes_defer"; message: string };

type NavalPipeClassRule = {
  joint: Joint;
  class: PipeClass[];
  od_max_mm?: number;
};

type NavalDataset = {
  standard: "LR_NAVAL_SHIPS";
  version: string;
  systems: NavalSystem[];
  pipe_class_rules: NavalPipeClassRule[];
  notes: Record<string, NavalNote>;
};

const db = dataset as NavalDataset;

type ClassCheckResult =
  | { ok: true; detail?: string }
  | { ok: false; reason: "missing_inputs" | "limit"; detail?: string };

export function evaluateLRNavalShips(
  ctx: LRNavalShipsContext,
  datasetOverride: NavalDataset = db
): LRNavalShipsEvaluation {
  const sys = datasetOverride.systems.find((s) => s.id === ctx.systemId);
  if (!sys) {
    return forbid(ctx, [], "Sistema no reconocido");
  }

  const jointGroup = groupOf(ctx.joint);
  if (!jointGroup) {
    return forbid(ctx, [], "Tipo de junta desconocido");
  }

  const groups = evaluateGroupsForRow(ctx, sys, datasetOverride);
  const groupResult = groups[jointGroup];
  const trace = [...groupResult.trace];
  const conditions = [...groupResult.conditions];
  const notesApplied = [...groupResult.notesApplied];
  const generalClauses = [...groupResult.generalClauses];
  const reasons = [...groupResult.reasons];

  let status: EvalStatus = groupResult.status;
  let reason = reasons.length ? reasons[reasons.length - 1] : undefined;

  if (status !== "forbidden") {
    const classCheck = passClassOD(ctx.joint, ctx.pipeClass, ctx.od_mm, datasetOverride);
    if (!classCheck.ok) {
      if (classCheck.reason === "missing_inputs") {
        reason = "Falta clase/OD (Tabla 1.5.4)";
      } else {
        reason = "Tabla 1.5.4: límite de clase/OD";
      }
      status = "forbidden";
      pushOnce(reasons, reason);
      if (classCheck.detail) {
        trace.push(classCheck.detail);
      }
    } else if (classCheck.detail) {
      trace.push(classCheck.detail);
    }
  }

  if (status !== "forbidden" && ctx.tailoring && (ctx.tailoring.shock || ctx.tailoring.fire || ctx.tailoring.watertight)) {
    const requirements = [
      ctx.tailoring.shock ? "Shock" : null,
      ctx.tailoring.fire ? "Fire" : null,
      ctx.tailoring.watertight ? "WT" : null,
    ].filter(Boolean);
    const label = `${TAILORING_CHIP_PREFIX} ${requirements.join("/") || "Shock/Fire/WT"}`;
    pushOnce(conditions, label);
    trace.push("§5.10.2: Verificar requisitos de Tailoring Doc (autoridad naval).");
  }

  const observations = Array.from(new Set([...conditions, ...reasons]));

  return {
    status,
    conditions,
    reasons,
    normRef: normReference,
    reason,
    systemId: sys.id,
    joint: ctx.joint,
    pipeClass: ctx.pipeClass,
    od_mm: ctx.od_mm,
    designPressure_bar: ctx.designPressure_bar,
    trace,
    observations,
    notesApplied,
    generalClauses,
  };
}

export function evaluateGroups(
  ctx: LRNavalShipsContext,
  datasetOverride: NavalDataset = db
): Record<Group, GroupEvalResult> {
  const sys = datasetOverride.systems.find((s) => s.id === ctx.systemId);
  if (!sys) {
    throw new Error("Sistema no reconocido");
  }
  return evaluateGroupsForRow(ctx, sys, datasetOverride);
}

function evaluateGroupsForRow(
  ctx: LRNavalShipsContext,
  row: NavalSystem,
  datasetOverride: NavalDataset
): Record<Group, GroupEvalResult> {
  const groups: Record<Group, GroupEvalResult> = {
    pipe_unions: base(Boolean(row.allowed_joints.pipe_unions), row, "pipe_unions"),
    compression_couplings: base(Boolean(row.allowed_joints.compression_couplings), row, "compression_couplings"),
    slip_on_joints: base(Boolean(row.allowed_joints.slip_on_joints), row, "slip_on_joints"),
  };

  const rowNotes = new Set<number>(row?.notes ?? []);
  const fireLabel =
    row.fire_test && row.fire_test !== "not_required"
      ? FIRE_TEST_LABELS[row.fire_test] ?? row.fire_test
      : null;

  for (const [groupName, result] of Object.entries(groups) as [Group, GroupEvalResult][]) {
    if (!Boolean(row.allowed_joints[groupName])) {
      continue;
    }

    if (fireLabel) {
      if (result.status === "allowed") {
        result.status = "conditional";
      }
      pushOnce(result.conditions, fireLabel);
      result.trace.push(`Tabla 1.5.3: Ensayo base ${fireLabel}.`);
    }

    for (const noteId of rowNotes) {
      applyNoteScoped_LRNavalShips(noteId, ctx, row, datasetOverride, groupName, result);
    }

    if (!result.skipGeneralClauses) {
      applyGeneralClauses(ctx, groupName, result);
    }
  }

  return groups;
}

function base(allowed: boolean, row: NavalSystem, group: Group): GroupEvalResult {
  const result: GroupEvalResult = {
    status: allowed ? "allowed" : "forbidden",
    conditions: [],
    reasons: [],
    notesApplied: [],
    generalClauses: [],
    trace: [],
  };
  const message = `Tabla 1.5.3 (${row.label_es}): ${allowed ? "+" : "–"} para ${describeJointGroup(
    group
  )}; clase '${row.class_of_pipe_system}'.`;
  result.trace.push(message);
  if (!allowed) {
    result.reasons.push("Tabla de sistema: ‘-’");
  }
  return result;
}

function applyNoteScoped_LRNavalShips(
  noteId: number,
  ctx: LRNavalShipsContext,
  row: NavalSystem,
  datasetOverride: NavalDataset,
  group: Group,
  out: GroupEvalResult
) {
  if (out.status === "forbidden") {
    return;
  }

  switch (noteId) {
    case 1: {
      if (ctx.space === "machinery_cat_A") {
        if (out.status === "allowed") {
          out.status = "conditional";
        }
        pushOnce(out.conditions, NOTE1_FIRE_CHIP);
        pushOnce(out.notesApplied, noteId);
        out.trace.push("Nota 1: Cat. A ⇒ juntas resistentes al fuego.");
        if (row.id === "bilge_lines") {
          pushOnce(out.conditions, NOTE1_BILGE_MATERIAL_CHIP);
        }
      }
      break;
    }
    case 2: {
      if (group === "slip_on_joints") {
        if (
          ctx.space === "machinery_cat_A" ||
          ctx.space === "munitions_store" ||
          ctx.space === "accommodation"
        ) {
          out.status = "forbidden";
          const message = "Nota 2: Slip-on no aceptadas en Cat. A/municiones/aloj.";
          pushOnce(out.reasons, message);
          pushOnce(out.notesApplied, noteId);
          out.trace.push(`Nota 2: Slip-on prohibidas en ${ctx.space}.`);
        } else if (ctx.space === "other_machinery" && ctx.location !== "visible_accessible") {
          out.status = "conditional";
          pushOnce(out.conditions, NOTE2_LOCATION_CHIP);
          pushOnce(out.notesApplied, noteId);
          out.trace.push("Nota 2: otras máquinas ⇒ visibles/accesibles.");
        }
      }
      break;
    }
    case 3: {
      if (ctx.space !== "open_deck_low_risk_SOLAS_9_2_3_3_2_2_10") {
        if (out.status === "allowed") {
          out.status = "conditional";
        }
        pushOnce(out.conditions, NOTE3_FIRE_CHIP);
        pushOnce(out.notesApplied, noteId);
        out.trace.push("Nota 3: exigir juntas resistentes al fuego.");
      }
      break;
    }
    case 4: {
      if (out.status === "allowed") {
        out.status = "conditional";
      }
      pushOnce(out.conditions, NOTE4_FIRE_CHIP);
      pushOnce(out.notesApplied, noteId);
      out.trace.push("Nota 4: tipo resistente al fuego obligatorio.");
      break;
    }
    case 5: {
      if (group === "slip_on_joints" && row.id === "steam") {
        const isRestrained = ctx.joint === "slip_on_machine_grooved";
        const onOpenDeck = ctx.space === "open_deck";
        const allowedShip = ["oil_tanker", "chemical_tanker"].includes(ctx.shipType ?? "");
        const pressureOk = (ctx.designPressure_bar ?? Number.POSITIVE_INFINITY) <= 10;
        if (isRestrained && onOpenDeck && allowedShip && pressureOk) {
          if (out.status === "allowed") {
            out.status = "conditional";
          }
          pushOnce(out.conditions, NOTE5_STEAM_CHIP);
          pushOnce(out.notesApplied, noteId);
          out.trace.push("Nota 5: Condiciones satisfechas para restrained slip-on.");
        } else {
          out.status = "forbidden";
          const message =
            "Nota 5: sólo restrained slip-on ≤10 bar en cubierta expuesta (petroleros/quimiqueros)";
          pushOnce(out.reasons, message);
          pushOnce(out.notesApplied, noteId);
          out.trace.push("Nota 5: Condiciones para restrained slip-on no satisfechas.");
        }
      }
      break;
    }
    case 6: {
      if (ctx.aboveLimitOfWatertightIntegrity === false) {
        out.status = "forbidden";
        const message = "Nota 6: Sólo sobre el Límite de Integridad Estanca";
        pushOnce(out.reasons, message);
        pushOnce(out.notesApplied, noteId);
        out.trace.push("Nota 6: Ubicación bajo el WLI ⇒ prohibido.");
      }
      break;
    }
    case 7: {
      pushOnce(out.conditions, NOTE7_INFO_CHIP);
      pushOnce(out.notesApplied, noteId);
      const note = datasetOverride.notes[String(noteId)];
      if (note && "message" in note) {
        out.trace.push(`Nota 7: ${note.message}`);
      } else {
        out.trace.push("Nota 7: verificar requisitos adicionales (HVAC/intakes/uprakes).");
      }
      out.skipGeneralClauses = true;
      break;
    }
  }
}

function applyGeneralClauses(ctx: LRNavalShipsContext, group: Group, out: GroupEvalResult) {
  const mediumSame = ctx.mediumInPipeSameAsTank;

  if (
    ctx.isSectionDirectlyConnectedToShipSide &&
    ctx.aboveLimitOfWatertightIntegrity === false
  ) {
    const message = "§5.10.6: tramo conectado al costado bajo el WLI ⇒ juntas prohibidas";
    out.status = "forbidden";
    pushOnce(out.generalClauses, message);
    pushOnce(out.reasons, message);
    out.trace.push(message);
    return;
  }

  if (ctx.space === "tank" && (ctx.lineType === "fuel_oil" || ctx.lineType === "thermal_oil")) {
    const message = "§5.10.6: juntas prohibidas en tanques con fluidos inflamables";
    out.status = "forbidden";
    pushOnce(out.generalClauses, message);
    pushOnce(out.reasons, message);
    out.trace.push(message);
    return;
  }

  if (group === "slip_on_joints") {
    if (ctx.accessibility === "not_easy") {
      const message = "§5.10.9: slip-on prohibidas en ubicaciones de difícil acceso";
      out.status = "forbidden";
      pushOnce(out.generalClauses, message);
      pushOnce(out.reasons, message);
      out.trace.push(message);
      return;
    }

    if (ctx.space === "tank") {
      if (mediumSame === false) {
        const message = "§5.10.9: slip-on en tanques solo si el medio es el mismo";
        out.status = "forbidden";
        pushOnce(out.generalClauses, message);
        pushOnce(out.reasons, message);
        out.trace.push(message);
        return;
      }
    }

    if (["cargo_hold", "cofferdam", "void"].includes(ctx.space)) {
      const message = "§5.10.9: slip-on prohibidas en bodegas/cofferdams/voids";
      out.status = "forbidden";
      pushOnce(out.generalClauses, message);
      pushOnce(out.reasons, message);
      out.trace.push(message);
      return;
    }
  }

  if (ctx.joint === "slip_on_slip_type") {
    pushOnce(out.conditions, SLIP_TYPE_WARNING);
    out.trace.push("§5.10.10: Slip-type solo para compensación axial.");
    if (ctx.mainMeansOfConnection) {
      const message = "§5.10.10: slip-type no puede ser medio principal";
      out.status = "forbidden";
      pushOnce(out.generalClauses, message);
      pushOnce(out.reasons, message);
      out.trace.push(message);
    }
  }
}

function passClassOD(
  joint: Joint,
  pipeClass: PipeClass | undefined,
  odMM: number | undefined,
  datasetOverride: NavalDataset
): ClassCheckResult {
  const rules = datasetOverride.pipe_class_rules.filter((rule) => rule.joint === joint);
  const effectiveRules = rules.length
    ? rules
    : datasetOverride.pipe_class_rules.filter((rule) => groupOf(rule.joint) === joint);
  if (!effectiveRules.length) {
    return { ok: true };
  }

  if (!pipeClass) {
    return { ok: false, reason: "missing_inputs" };
  }

  const match = effectiveRules.find((rule) => rule.class.includes(pipeClass));
  if (!match) {
    return { ok: false, reason: "limit" };
  }

  if (match.od_max_mm != null) {
    if (typeof odMM !== "number") {
      return { ok: false, reason: "missing_inputs" };
    }
    if (odMM > match.od_max_mm + 1e-6) {
      return { ok: false, reason: "limit" };
    }
  }

  const detail =
    match.od_max_mm != null
      ? `Tabla 1.5.4: Clase ${pipeClass} con OD ≤ ${match.od_max_mm} mm`
      : `Tabla 1.5.4: Clase ${pipeClass}`;

  return { ok: true, detail };
}

function forbid(
  ctx: LRNavalShipsContext,
  trace: string[],
  message: string
): LRNavalShipsEvaluation {
  return {
    status: "forbidden",
    conditions: [],
    reasons: [message],
    normRef: normReference,
    reason: message,
    systemId: ctx.systemId,
    joint: ctx.joint,
    pipeClass: ctx.pipeClass,
    od_mm: ctx.od_mm,
    designPressure_bar: ctx.designPressure_bar,
    trace: [...trace],
    observations: [message],
    notesApplied: [],
    generalClauses: [],
  };
}

function groupOf(joint: Joint): Group | null {
  if (joint === "pipe_unions" || joint === "compression_couplings" || joint === "slip_on_joints") {
    return joint;
  }
  if (joint === "pipe_union_welded_brazed") return "pipe_unions";
  if (
    joint === "compression_swage" ||
    joint === "compression_typical" ||
    joint === "compression_bite" ||
    joint === "compression_flared" ||
    joint === "compression_press"
  ) {
    return "compression_couplings";
  }
  if (
    joint === "slip_on_machine_grooved" ||
    joint === "slip_on_grip" ||
    joint === "slip_on_slip_type"
  ) {
    return "slip_on_joints";
  }
  return null;
}

function describeJointGroup(group: Group): string {
  switch (group) {
    case "pipe_unions":
      return "pipe unions";
    case "compression_couplings":
      return "compression couplings";
    case "slip_on_joints":
      return "slip-on joints";
  }
}

function pushOnce<T>(arr: T[], value: T | null | undefined) {
  if (value === undefined || value === null) return;
  if (!arr.includes(value)) {
    arr.push(value);
  }
}

export default evaluateLRNavalShips;

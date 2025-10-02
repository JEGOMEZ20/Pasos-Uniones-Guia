import dataset, {
  LRShipsJointGroup,
  LRShipsDataset,
  Space,
  Joint,
  PipeClass,
} from "../data/lr_ships_mech_joints.js";

export type { Space, Joint, PipeClass } from "../data/lr_ships_mech_joints.js";

export interface LRShipsContext {
  systemId: string;
  space: Space;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  lineType?: "fuel_oil" | "thermal_oil" | "other";
  location?: "visible_accessible" | "normal";
  sameMediumInTank?: boolean;
}

export interface LRShipsEvaluation {
  status: "allowed" | "conditional" | "forbidden";
  conditions: string[];
  normRef: string;
  reason?: string;
  systemId: string;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  trace: string[];
}

const normReference = "LR Ships Pt5 Ch12 §2.12, Tablas 12.2.8–12.2.9";

export function evaluateLRShips(ctx: LRShipsContext, db: LRShipsDataset = dataset): LRShipsEvaluation {
  const trace: string[] = [];
  const sys = db.systems.find((s) => s.id === ctx.systemId);
  if (!sys) {
    return forbid(ctx, trace, "Sistema no reconocido");
  }

  const jointGroup = groupOf(ctx.joint);
  if (!jointGroup) {
    return forbid(ctx, trace, "Tipo de junta desconocido");
  }

  const baseAllowed = Boolean(sys.allowed_joints[jointGroup]);
  trace.push(
    `Tabla 12.2.8 (${sys.label_es}): ${baseAllowed ? "+" : "–"} para ${describeJointGroup(jointGroup)}; clasificación '${sys.class_of_pipe_system}'.`
  );
  if (!baseAllowed) {
    return forbid(ctx, trace, "Tabla 12.2.8: '-' para este tipo de junta");
  }

  const classResult = passClassOD(ctx.joint, ctx.pipeClass, ctx.od_mm, db);
  if (!classResult.ok) {
    if (classResult.reason === "missing_inputs") {
      return forbid(ctx, trace, "Falta clase/OD para aplicar Tabla 12.2.9");
    }
    return forbid(ctx, trace, "Tabla 12.2.9: límite de clase/OD", classResult.detail);
  }
  if (classResult.detail) {
    trace.push(classResult.detail);
  }

  let status: "allowed" | "conditional" | "forbidden" = "allowed";
  let forbiddenReason: string | null = null;
  const conditions: string[] = [];

  const addCondition = (msg: string) => {
    if (!conditions.includes(msg)) {
      conditions.push(msg);
    }
    status = status === "forbidden" ? status : "conditional";
  };

  const addTrace = (msg: string) => {
    trace.push(msg);
  };

  if (sys.fire_test) {
    const label = labelTest(sys.fire_test);
    addCondition(label);
    addTrace(`Tabla 12.2.8: Ensayo de fuego base ${label}.`);
  }

  for (const noteId of sys.notes) {
    const note = db.notes[String(noteId)];
    if (!note || forbiddenReason) continue;
    switch (note.type) {
      case "fire_test_if_space": {
        if (note.spaces.includes(ctx.space)) {
          const test = note.test === "from_row" ? sys.fire_test : note.test;
          if (test) {
            const label = labelTest(test);
            addCondition(label);
            addTrace(`Nota ${noteId}: espacio = ${ctx.space} ⇒ ${label}.`);
          }
        }
        break;
      }
      case "prohibit_slip_on_in_spaces": {
        if (isSlipOn(ctx.joint)) {
          if (note.prohibit.includes(ctx.space)) {
            addTrace(`Nota ${noteId}: Slip-on no aceptadas en ${ctx.space}.`);
            forbiddenReason = `Nota ${noteId}: slip-on no aceptadas en este espacio`;
          } else if (
            ctx.space === "other_machinery" &&
            note.allow_if === "other_machinery_visible_accessible" &&
            ctx.location !== "visible_accessible"
          ) {
            addCondition("Instalar en posiciones visibles y accesibles (MSC/Circ.734)");
            addTrace(`Nota ${noteId}: En otros espacios de maquinaria deben quedar visibles/accesibles.`);
          }
        }
        break;
      }
      case "require_fire_resistant_type_except": {
        if (!(ctx.space === note.except.space && ctx.lineType !== note.except.not_for)) {
          addCondition("Usar tipo resistente al fuego");
          addTrace(`Nota ${noteId}: exigir tipo resistente al fuego.`);
        }
        break;
      }
      case "only_above_bulkhead_deck_passenger_ships": {
        addCondition("Solo sobre cubierta de francobordo en buques de pasaje");
        addTrace(`Nota ${noteId}: limitada a cubierta superior en buques de pasaje.`);
        break;
      }
      case "allow_slip_type_on_open_deck_max_pressure_bar": {
        if (
          isSlipType(ctx.joint) &&
          ctx.space === "open_deck" &&
          (ctx.designPressure_bar ?? Number.POSITIVE_INFINITY) <= note.max_bar
        ) {
          addTrace(`Nota ${noteId}: Slip-type permitido en cubierta hasta ${note.max_bar} bar.`);
        } else if (isSlipType(ctx.joint) && ctx.space === "open_deck") {
          addTrace(`Nota ${noteId}: P > ${note.max_bar} bar ⇒ Slip-type no permitido.`);
          forbiddenReason = `Nota ${noteId}: presión de diseño supera ${note.max_bar} bar`;
        }
        break;
      }
      case "test_equivalence": {
        addTrace(`Nota ${noteId}: equivalencias de ensayo disponibles.`);
        break;
      }
      case "reference_only": {
        addTrace(`Nota ${noteId}: ${note.ref}.`);
        break;
      }
    }
  }

  if (forbiddenReason) {
    return forbid(ctx, trace, forbiddenReason);
  }

  const generalReason = applyGeneralClauses(ctx, addCondition, addTrace);
  if (generalReason) {
    return forbid(ctx, trace, generalReason);
  }

  return {
    status,
    conditions,
    normRef: normReference,
    systemId: sys.id,
    joint: ctx.joint,
    pipeClass: ctx.pipeClass,
    od_mm: ctx.od_mm,
    designPressure_bar: ctx.designPressure_bar,
    trace,
  };
}

function applyGeneralClauses(
  ctx: LRShipsContext,
  addCondition: (msg: string) => void,
  addTrace: (msg: string) => void
): string | null {
  if (isSlipOn(ctx.joint)) {
    if (["cargo_hold", "cofferdam", "void"].includes(ctx.space)) {
      addTrace("§2.12.8: Slip-on prohibidas en bodegas/cofferdams/voids no accesibles.");
      return "§2.12.8: slip-on prohibidas en espacios no accesibles";
    }
    if (ctx.space === "tank") {
      if (ctx.sameMediumInTank) {
        addCondition("Solo dentro de tanques cuando contienen el mismo medio");
        addTrace("§2.12.8: En tanques solo si el medio es el mismo.");
      } else {
        addTrace("§2.12.8: Slip-on no permitidas en tanques con medio distinto.");
        return "§2.12.8: slip-on solo dentro de tanques con el mismo medio";
      }
    }
  }

  if (ctx.joint === "slip_on_slip_type") {
    addCondition("No usar como medio principal salvo compensación axial (§2.12.9)");
    addTrace("§2.12.9: Slip-type limitado a compensación axial.");
  }

  return null;
}

function forbid(
  ctx: LRShipsContext,
  trace: string[],
  message: string,
  detail?: string
): LRShipsEvaluation {
  if (detail) {
    trace.push(detail);
  }
  return {
    status: "forbidden",
    conditions: [],
    normRef: normReference,
    reason: message,
    systemId: ctx.systemId,
    joint: ctx.joint,
    pipeClass: ctx.pipeClass,
    od_mm: ctx.od_mm,
    designPressure_bar: ctx.designPressure_bar,
    trace: [...trace],
  };
}

function groupOf(joint: Joint): LRShipsJointGroup | null {
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

function isSlipOn(joint: Joint): boolean {
  return groupOf(joint) === "slip_on_joints";
}

function isSlipType(joint: Joint): boolean {
  return joint === "slip_on_slip_type";
}

function labelTest(value: NonNullable<LRShipsDataset["systems"][number]["fire_test"]>) {
  switch (value) {
    case "30min_dry":
      return "Ensayo fuego 30 min seco";
    case "30min_wet":
      return "Ensayo fuego 30 min húmedo";
    case "8min_dry_plus_22min_wet":
      return "Ensayo fuego 8 min seco + 22 min húmedo";
    default:
      return value;
  }
}

function describeJointGroup(group: LRShipsJointGroup) {
  switch (group) {
    case "pipe_unions":
      return "pipe unions";
    case "compression_couplings":
      return "compression couplings";
    case "slip_on_joints":
      return "slip-on joints";
  }
}

function passClassOD(
  joint: Joint,
  pipeClass: PipeClass | undefined,
  odMM: number | undefined,
  db: LRShipsDataset
): { ok: boolean; reason?: string; detail?: string } {
  const rules = db.pipe_class_rules.filter((rule) => rule.joint === joint);
  const targetRules = rules.length ? rules : db.pipe_class_rules.filter((rule) => groupOf(rule.joint) === joint);
  if (!targetRules.length) {
    return { ok: true };
  }

  if (!pipeClass) {
    return { ok: false, reason: "missing_inputs" };
  }

  const matchingRule = targetRules.find((rule) => rule.class.includes(pipeClass));
  if (!matchingRule) {
    return { ok: false };
  }

  if (matchingRule.od_max_mm != null) {
    if (typeof odMM !== "number") {
      return { ok: false, reason: "missing_inputs" };
    }
    if (odMM > matchingRule.od_max_mm + 1e-6) {
      return { ok: false };
    }
  }

  const detail = matchingRule.od_max_mm
    ? `Tabla 12.2.9: Clase ${pipeClass} con OD ≤ ${matchingRule.od_max_mm} mm`
    : `Tabla 12.2.9: Clase ${pipeClass}`;
  return { ok: true, detail };
}

export default evaluateLRShips;

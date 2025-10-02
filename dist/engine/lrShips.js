import dataset from "../data/lr_ships_mech_joints.js";
const normReference = "LR Ships Pt5 Ch12 §2.12, Tablas 12.2.8–12.2.9";
function normalizeLRShipsContext(ctx) {
    const mediumSame = ctx.mediumInPipeSameAsTank ?? ctx.sameMediumInTank ?? true;
    return {
        ...ctx,
        accessibility: ctx.accessibility ?? "easy",
        mediumInPipeSameAsTank: mediumSame,
        sameMediumInTank: ctx.sameMediumInTank ?? mediumSame,
        directToShipSideBelowLimit: ctx.directToShipSideBelowLimit ?? false,
        asMainMeans: ctx.asMainMeans ?? false,
    };
}
export function evaluateLRShips(ctx, db = dataset) {
    const normalizedCtx = normalizeLRShipsContext(ctx);
    const sys = db.systems.find((s) => s.id === normalizedCtx.systemId);
    if (!sys) {
        return forbid(normalizedCtx, [], "Sistema no reconocido");
    }
    const jointGroup = groupOf(normalizedCtx.joint);
    if (!jointGroup) {
        return forbid(normalizedCtx, [], "Tipo de junta desconocido");
    }
    const groups = evaluateGroupsForRow(normalizedCtx, sys, db);
    const groupResult = groups[jointGroup];
    const trace = [...groupResult.trace];
    const conditions = [...groupResult.conditions];
    const notesApplied = [...groupResult.notesApplied];
    const generalClauses = [...groupResult.generalClauses];
    const reasons = [...groupResult.reasons];
    let status = groupResult.status;
    let reason = reasons.length ? reasons[reasons.length - 1] : undefined;
    if (status !== "forbidden") {
        const classResult = passClassOD(normalizedCtx.joint, normalizedCtx.pipeClass, normalizedCtx.od_mm, db);
        if (!classResult.ok) {
            if (classResult.reason === "missing_inputs") {
                reason = "Falta clase/OD para aplicar Tabla 12.2.9";
            }
            else {
                reason = "Tabla 12.2.9: límite de clase/OD";
            }
            status = "forbidden";
            pushOnce(reasons, reason);
            if (classResult.detail) {
                trace.push(classResult.detail);
            }
        }
        else if (classResult.detail) {
            trace.push(classResult.detail);
        }
    }
    const observations = Array.from(new Set([...conditions, ...reasons]));
    return {
        status,
        conditions,
        reasons,
        normRef: normReference,
        reason,
        systemId: sys.id,
        joint: normalizedCtx.joint,
        pipeClass: normalizedCtx.pipeClass,
        od_mm: normalizedCtx.od_mm,
        designPressure_bar: normalizedCtx.designPressure_bar,
        trace,
        observations,
        notesApplied,
        generalClauses,
    };
}
export function evaluateGroups(ctx, db = dataset) {
    const normalizedCtx = normalizeLRShipsContext(ctx);
    const row = db.systems.find((s) => s.id === normalizedCtx.systemId);
    if (!row) {
        throw new Error("Sistema no reconocido");
    }
    return evaluateGroupsForRow(normalizedCtx, row, db);
}
function evaluateGroupsForRow(ctx, row, _db) {
    const groups = {
        pipe_unions: base(Boolean(row.allowed_joints.pipe_unions), row, "pipe_unions"),
        compression_couplings: base(Boolean(row.allowed_joints.compression_couplings), row, "compression_couplings"),
        slip_on_joints: base(Boolean(row.allowed_joints.slip_on_joints), row, "slip_on_joints"),
    };
    const rowNotes = new Set(row?.notes ?? []);
    const fireTestLabel = row?.fire_test ? labelFire(row.fire_test) : null;
    for (const [groupName, result] of Object.entries(groups)) {
        if (!Boolean(row.allowed_joints[groupName])) {
            continue;
        }
        if (fireTestLabel) {
            if (result.status === "allowed") {
                result.status = "conditional";
            }
            pushOnce(result.conditions, fireTestLabel);
            result.trace.push(`Tabla 12.2.8: Ensayo base ${fireTestLabel}.`);
        }
        for (const note of rowNotes) {
            applyNoteScoped_LRShips(note, ctx, row, groupName, result);
        }
        applyGeneralClauses(ctx, groupName, result);
    }
    return groups;
}
function base(allowed, row, group) {
    const result = {
        status: allowed ? "allowed" : "forbidden",
        conditions: [],
        reasons: [],
        notesApplied: [],
        generalClauses: [],
        trace: [],
    };
    const baseMessage = `Tabla 12.2.8 (${row.label_es}): ${allowed ? "+" : "–"} para ${describeJointGroup(group)}; clasificación '${row.class_of_pipe_system}'.`;
    result.trace.push(baseMessage);
    if (!allowed) {
        result.reasons.push("Tabla de sistema: ‘-’");
    }
    return result;
}
function pushOnce(arr, value) {
    if (value === undefined || value === null)
        return;
    if (!arr.includes(value)) {
        arr.push(value);
    }
}
function applyNoteScoped_LRShips(note, ctx, row, group, out) {
    if (out.status === "forbidden") {
        // Mantener primer motivo que bloqueó la evaluación.
        return;
    }
    switch (note) {
        case 1: {
            if (ctx.space === "pump_room" || ctx.space === "open_deck") {
                const label = row.fire_test ? labelFire(row.fire_test) : null;
                if (label) {
                    if (out.status === "allowed") {
                        out.status = "conditional";
                    }
                    pushOnce(out.conditions, label);
                    pushOnce(out.notesApplied, note);
                    out.trace.push(`Nota 1: espacio ${ctx.space} ⇒ ${label}.`);
                }
            }
            break;
        }
        case 2: {
            if (group === "slip_on_joints") {
                if (ctx.space === "machinery_cat_A" || ctx.space === "accommodation") {
                    out.status = "forbidden";
                    const message = "Nota 2: Slip-on no aceptadas en Cat. A/aloj.";
                    pushOnce(out.reasons, message);
                    pushOnce(out.notesApplied, note);
                    out.trace.push(`Nota 2: Slip-on prohibidas en ${ctx.space}.`);
                }
                else if (ctx.space === "other_machinery" && ctx.location !== "visible_accessible") {
                    out.status = "conditional";
                    const condition = "Ubicación visible y accesible (MSC/Circ.734)";
                    pushOnce(out.conditions, condition);
                    pushOnce(out.notesApplied, note);
                    out.trace.push("Nota 2: otras máquinas ⇒ visibles/accesibles.");
                }
            }
            break;
        }
        case 3: {
            if (ctx.space !== "open_deck") {
                if (out.status === "allowed") {
                    out.status = "conditional";
                }
                const condition = "Tipo resistente al fuego";
                pushOnce(out.conditions, condition);
                pushOnce(out.notesApplied, note);
                out.trace.push("Nota 3: exigir tipo resistente al fuego.");
            }
            break;
        }
        case 4: {
            if (ctx.space === "machinery_cat_A") {
                const label = row.fire_test ? labelFire(row.fire_test) : null;
                if (label) {
                    if (out.status === "allowed") {
                        out.status = "conditional";
                    }
                    pushOnce(out.conditions, label);
                    pushOnce(out.notesApplied, note);
                    out.trace.push(`Nota 4: Cat. A ⇒ ${label}.`);
                }
            }
            break;
        }
        case 5: {
            if (ctx.space !== "open_deck") {
                if (out.status === "allowed") {
                    out.status = "conditional";
                }
                const condition = "Sólo sobre cubierta de francobordo (buques de pasaje)";
                pushOnce(out.conditions, condition);
                pushOnce(out.notesApplied, note);
                out.trace.push("Nota 5: limitar a cubierta de francobordo.");
            }
            break;
        }
        case 6: {
            if (ctx.joint === "slip_on_slip_type" && ctx.space === "open_deck") {
                const maxPressure = ctx.designPressure_bar ?? Number.POSITIVE_INFINITY;
                if (maxPressure <= 10) {
                    if (out.status === "allowed") {
                        out.status = "conditional";
                    }
                    const condition = "Slip-type ≤10 bar en cubierta expuesta";
                    pushOnce(out.conditions, condition);
                    pushOnce(out.notesApplied, note);
                    out.trace.push("Nota 6: Slip-type permitido ≤10 bar.");
                }
                else {
                    out.status = "forbidden";
                    const message = "Nota 6: Slip-type >10 bar prohibido";
                    pushOnce(out.reasons, message);
                    pushOnce(out.notesApplied, note);
                    out.trace.push("Nota 6: presión excede 10 bar ⇒ prohibido.");
                }
            }
            break;
        }
        case 7: {
            out.trace.push("Nota 7: revisar equivalencias de ensayo.");
            break;
        }
        case 8: {
            out.trace.push("Nota 8: ver §2.12.10 para slip-on restringidas.");
            break;
        }
    }
}
function applyGeneralClauses(ctx, group, out) {
    const mediumSame = ctx.mediumInPipeSameAsTank ?? ctx.sameMediumInTank;
    if (ctx.directToShipSideBelowLimit) {
        const message = "§2.12.5: prohibido conectar directamente al costado bajo el límite";
        out.status = "forbidden";
        pushOnce(out.generalClauses, message);
        pushOnce(out.reasons, message);
        out.trace.push(message);
        return;
    }
    if (ctx.tankContainsFlammable) {
        const message = "§2.12.5: prohibido en tanques con fluidos inflamables";
        out.status = "forbidden";
        pushOnce(out.generalClauses, message);
        pushOnce(out.reasons, message);
        out.trace.push(message);
        return;
    }
    if (group === "slip_on_joints") {
        const isCargoOrTank = ctx.space === "cargo_hold" || ctx.space === "tank";
        const isHardAccessSpace = ctx.accessibility === "not_easy";
        if (isCargoOrTank || isHardAccessSpace) {
            const message = "§2.12.8: Slip-on no en bodegas/tanques/espacios no fácilmente accesibles (2.12.8 / 5.10.9)";
            out.status = "forbidden";
            pushOnce(out.generalClauses, message);
            pushOnce(out.reasons, message);
            out.trace.push(message);
            return;
        }
        if (ctx.space === "tank" && mediumSame === false) {
            const message = "§2.12.8: slip-on en tanques sólo si el medio es el mismo";
            out.status = "forbidden";
            pushOnce(out.generalClauses, message);
            pushOnce(out.reasons, message);
            out.trace.push(message);
            return;
        }
    }
    if (ctx.joint === "slip_on_slip_type" && ctx.asMainMeans) {
        const message = "§2.12.9: Slip-type no como medio principal (sólo compensación axial)";
        out.status = "forbidden";
        pushOnce(out.generalClauses, message);
        pushOnce(out.reasons, message);
        out.trace.push(message);
    }
}
function forbid(ctx, trace, message) {
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
function groupOf(joint) {
    if (joint === "pipe_unions" || joint === "compression_couplings" || joint === "slip_on_joints") {
        return joint;
    }
    if (joint === "pipe_union_welded_brazed")
        return "pipe_unions";
    if (joint === "compression_swage" ||
        joint === "compression_typical" ||
        joint === "compression_bite" ||
        joint === "compression_flared" ||
        joint === "compression_press") {
        return "compression_couplings";
    }
    if (joint === "slip_on_machine_grooved" ||
        joint === "slip_on_grip" ||
        joint === "slip_on_slip_type") {
        return "slip_on_joints";
    }
    return null;
}
function labelFire(value) {
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
function describeJointGroup(group) {
    switch (group) {
        case "pipe_unions":
            return "pipe unions";
        case "compression_couplings":
            return "compression couplings";
        case "slip_on_joints":
            return "slip-on joints";
    }
}
function passClassOD(joint, pipeClass, odMM, db) {
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

import dataset from "../data/lr_naval_ships_mech_joints.json";
const normReference = "LR Naval Ships Vol2 Pt7 Ch1 §5.10, Tablas 1.5.3–1.5.4";
const FIRE_TEST_LABELS = {
    "30min_dry": "Ensayo de fuego: 30 min seco",
    "30min_wet": "Ensayo de fuego: 30 min húmedo",
    "8min_dry_plus_22min_wet": "Ensayo de fuego: 8 min seco + 22 min húmedo",
};
const NOTE1_FIRE_CHIP = "Tipo resistente al fuego si componentes se deterioran en incendio (Cat. A)";
const NOTE1_BILGE_MATERIAL_CHIP = "Material acople bilge main: acero/CuNi/equiv.";
const NOTE2_LOCATION_CHIP = "Ubicación visible y accesible";
const NOTE3_FIRE_CHIP = "Tipo resistente al fuego";
const NOTE4_FIRE_CHIP = "Tipo resistente al fuego";
const NOTE5_STEAM_CHIP = "Restringido a cubierta expuesta ≤10 bar (vapor, petroleros/quimiqueros)";
const NOTE6_WLI_CHIP = "Solo sobre Límite de Integridad Estanca (WLI)";
const NOTE7_INFO_CHIP = "HVAC/intakes: ver secciones específicas de las Reglas";
const SLIP_TYPE_WARNING = "No como medio principal (slip-type)";
const TAILORING_CHIP_PREFIX = "Tailoring Doc: validar";
const db = dataset;
export function evaluateLRNavalShips(ctx, datasetOverride = db) {
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
    const observations = [...groupResult.observations];
    const notesApplied = [...groupResult.notesApplied];
    const generalClauses = [...groupResult.generalClauses];
    const reasons = [...groupResult.reasons];
    let status = groupResult.status;
    let reason = reasons.length ? reasons[reasons.length - 1] : undefined;
    if (status !== "forbidden") {
        const classCheck = passClassOD(ctx.joint, ctx.pipeClass, ctx.od_mm, datasetOverride);
        if (!classCheck.ok) {
            if (classCheck.reason === "missing_inputs") {
                reason = "Falta clase/OD (Tabla 1.5.4)";
            }
            else {
                reason = "Tabla 1.5.4: límite de clase/OD";
            }
            status = "forbidden";
            if (classCheck.detail) {
                pushOnce(observations, classCheck.detail);
            }
        }
        else if (classCheck.detail) {
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
    return {
        status,
        conditions,
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
export function evaluateGroups(ctx, datasetOverride = db) {
    const sys = datasetOverride.systems.find((s) => s.id === ctx.systemId);
    if (!sys) {
        throw new Error("Sistema no reconocido");
    }
    return evaluateGroupsForRow(ctx, sys, datasetOverride);
}
function evaluateGroupsForRow(ctx, row, datasetOverride) {
    const groups = {
        pipe_unions: base(Boolean(row.allowed_joints.pipe_unions), row, "pipe_unions"),
        compression_couplings: base(Boolean(row.allowed_joints.compression_couplings), row, "compression_couplings"),
        slip_on_joints: base(Boolean(row.allowed_joints.slip_on_joints), row, "slip_on_joints"),
    };
    const fireLabel = row.fire_test !== "not_required" ? FIRE_TEST_LABELS[row.fire_test] ?? row.fire_test : null;
    if (fireLabel) {
        for (const result of Object.values(groups)) {
            if (result.status === "forbidden")
                continue;
            if (result.status === "allowed") {
                result.status = "conditional";
            }
            pushOnce(result.conditions, fireLabel);
            result.trace.push(`Tabla 1.5.3: Ensayo base ${fireLabel}.`);
        }
    }
    const rowNotes = new Set(row.notes);
    for (const noteId of rowNotes) {
        for (const [groupName, result] of Object.entries(groups)) {
            if (result.status === "forbidden")
                continue;
            applyNote_LRNS(ctx, row, datasetOverride, noteId, groupName, result);
        }
    }
    for (const [groupName, result] of Object.entries(groups)) {
        if (result.status === "forbidden" || result.skipGeneralClauses)
            continue;
        applyGeneralClauses(ctx, groupName, result);
    }
    return groups;
}
function base(allowed, row, group) {
    const result = {
        status: allowed ? "allowed" : "forbidden",
        conditions: [],
        reasons: [],
        observations: [],
        notesApplied: [],
        generalClauses: [],
        trace: [],
    };
    const message = `Tabla 1.5.3 (${row.label_es}): ${allowed ? "+" : "–"} para ${describeJointGroup(group)}; clase '${row.class_of_pipe_system}'.`;
    result.trace.push(message);
    if (!allowed) {
        result.reasons.push("Tabla de sistema: ‘-’");
    }
    return result;
}
function applyNote_LRNS(ctx, row, datasetOverride, noteId, group, out) {
    const note = datasetOverride.notes[String(noteId)];
    if (!note)
        return;
    switch (note.type) {
        case "catA_fire_resistant_if_deteriorates_and_material_for_bilge_main": {
            if (ctx.space === "machinery_cat_A" && note.catA_requires_fire_resistant) {
                if (out.status === "allowed") {
                    out.status = "conditional";
                }
                pushOnce(out.conditions, NOTE1_FIRE_CHIP);
                pushOnce(out.notesApplied, noteId);
                pushOnce(out.observations, "Nota 1: Cat. A requiere juntas resistentes al fuego si hay componentes que se deterioran.");
                out.trace.push("Nota 1: Cat. A ⇒ tipo resistente al fuego.");
            }
            if (ctx.space === "machinery_cat_A" && row.id === "bilge_lines") {
                if (out.status === "allowed") {
                    out.status = "conditional";
                }
                pushOnce(out.conditions, NOTE1_BILGE_MATERIAL_CHIP);
                pushOnce(out.notesApplied, noteId);
                pushOnce(out.observations, "Nota 1: Acoples del bilge main en Cat. A deben ser acero/CuNi/equiv.");
                out.trace.push("Nota 1: Bilge main ⇒ material acero/CuNi/equiv.");
            }
            break;
        }
        case "no_slip_on_in_catA_munitions_accommodation": {
            if (group === "slip_on_joints") {
                if (note.prohibit_spaces.includes(ctx.space)) {
                    out.status = "forbidden";
                    const message = "Nota 2: slip-on no aceptadas en Cat. A/municiones/aloj.";
                    pushOnce(out.reasons, message);
                    pushOnce(out.observations, message);
                    pushOnce(out.notesApplied, noteId);
                    out.trace.push(`Nota 2: Slip-on prohibidas en ${ctx.space}.`);
                }
                else if (ctx.space === "other_machinery" &&
                    note.allow_other_machinery_if_visible_accessible &&
                    ctx.location !== "visible_accessible") {
                    if (out.status !== "forbidden") {
                        out.status = "conditional";
                    }
                    pushOnce(out.conditions, NOTE2_LOCATION_CHIP);
                    pushOnce(out.notesApplied, noteId);
                    pushOnce(out.observations, "Nota 2: ubicar en posiciones visibles y accesibles.");
                    out.trace.push("Nota 2: otras máquinas ⇒ visibles/accesibles.");
                }
            }
            break;
        }
        case "fire_resistant_except_open_deck_low_fire_risk": {
            if (ctx.space !== note.exception.space) {
                if (out.status === "allowed") {
                    out.status = "conditional";
                }
                pushOnce(out.conditions, NOTE3_FIRE_CHIP);
                pushOnce(out.notesApplied, noteId);
                pushOnce(out.observations, "Nota 3: requiere juntas de tipo resistente al fuego.");
                out.trace.push("Nota 3: exigir tipo resistente al fuego.");
            }
            break;
        }
        case "fire_resistant_required": {
            if (out.status === "allowed") {
                out.status = "conditional";
            }
            pushOnce(out.conditions, NOTE4_FIRE_CHIP);
            pushOnce(out.notesApplied, noteId);
            pushOnce(out.observations, "Nota 4: requiere juntas de tipo resistente al fuego.");
            out.trace.push("Nota 4: tipo resistente al fuego obligatorio.");
            break;
        }
        case "restrained_slip_on_steam_open_deck_tankers_le_10bar": {
            if (group === "slip_on_joints" && ctx.space === note.space) {
                const okPressure = (ctx.designPressure_bar ?? Number.POSITIVE_INFINITY) <= note.max_pressure_bar;
                const okShipType = note.ship_types.includes(ctx.shipType ?? "other");
                const isRestrained = ctx.joint === "slip_on_machine_grooved";
                if (okPressure && okShipType && isRestrained) {
                    pushOnce(out.conditions, NOTE5_STEAM_CHIP);
                    pushOnce(out.notesApplied, noteId);
                    pushOnce(out.observations, "Nota 5: solo restrained slip-on en cubierta expuesta para vapor ≤10 bar (petroleros/quimiqueros).");
                    out.trace.push("Nota 5: Condiciones satisfechas para restrained slip-on.");
                }
                else {
                    out.status = "forbidden";
                    const message = "Nota 5: solo se permiten restrained slip-on en cubierta expuesta de petroleros/quimiqueros con P ≤10 bar";
                    pushOnce(out.reasons, message);
                    pushOnce(out.observations, message);
                    pushOnce(out.notesApplied, noteId);
                    out.trace.push("Nota 5: Condiciones para restrained slip-on no satisfechas.");
                }
            }
            break;
        }
        case "only_above_limit_of_watertight_integrity": {
            if (ctx.aboveLimitOfWatertightIntegrity === false) {
                out.status = "forbidden";
                const message = "Nota 6: solo permitido sobre el Límite de Integridad Estanca";
                pushOnce(out.reasons, message);
                pushOnce(out.observations, message);
                pushOnce(out.notesApplied, noteId);
                out.trace.push("Nota 6: Sección bajo el Límite de Integridad Estanca ⇒ prohibido.");
            }
            else {
                if (out.status === "allowed") {
                    out.status = "conditional";
                }
                pushOnce(out.conditions, NOTE6_WLI_CHIP);
                pushOnce(out.notesApplied, noteId);
                pushOnce(out.observations, "Nota 6: confirmar ubicación sobre el Límite de Integridad Estanca.");
                out.trace.push("Nota 6: Requiere confirmar ubicación sobre el WLI.");
            }
            break;
        }
        case "hvac_trunking_intakes_uptakes_defer": {
            pushOnce(out.conditions, NOTE7_INFO_CHIP);
            pushOnce(out.notesApplied, noteId);
            pushOnce(out.observations, `Nota 7: ${note.message}`);
            out.trace.push(`Nota 7: ${note.message}`);
            out.skipGeneralClauses = true;
            break;
        }
    }
}
function applyGeneralClauses(ctx, group, out) {
    const mediumSame = ctx.mediumInPipeSameAsTank;
    if (ctx.isSectionDirectlyConnectedToShipSide &&
        ctx.aboveLimitOfWatertightIntegrity === false) {
        const message = "§5.10.6: tramo conectado al costado bajo el WLI ⇒ juntas prohibidas";
        out.status = "forbidden";
        pushOnce(out.generalClauses, message);
        pushOnce(out.reasons, message);
        pushOnce(out.observations, message);
        out.trace.push(message);
        return;
    }
    if (ctx.space === "tank" && (ctx.lineType === "fuel_oil" || ctx.lineType === "thermal_oil")) {
        const message = "§5.10.6: juntas prohibidas en tanques con fluidos inflamables";
        out.status = "forbidden";
        pushOnce(out.generalClauses, message);
        pushOnce(out.reasons, message);
        pushOnce(out.observations, message);
        out.trace.push(message);
        return;
    }
    if (group === "slip_on_joints") {
        if (ctx.accessibility === "not_easy") {
            const message = "§5.10.9: slip-on prohibidas en ubicaciones de difícil acceso";
            out.status = "forbidden";
            pushOnce(out.generalClauses, message);
            pushOnce(out.reasons, message);
            pushOnce(out.observations, message);
            out.trace.push(message);
            return;
        }
        if (ctx.space === "tank") {
            if (mediumSame === false) {
                const message = "§5.10.9: slip-on en tanques solo si el medio es el mismo";
                out.status = "forbidden";
                pushOnce(out.generalClauses, message);
                pushOnce(out.reasons, message);
                pushOnce(out.observations, message);
                out.trace.push(message);
                return;
            }
            if (mediumSame === true) {
                const message = "§5.10.9: confirmar medio en tanque igual al de la tubería";
                pushOnce(out.generalClauses, message);
                pushOnce(out.observations, message);
                out.trace.push(message);
            }
        }
        if (["cargo_hold", "cofferdam", "void"].includes(ctx.space)) {
            const message = "§5.10.9: slip-on prohibidas en bodegas/cofferdams/voids";
            out.status = "forbidden";
            pushOnce(out.generalClauses, message);
            pushOnce(out.reasons, message);
            pushOnce(out.observations, message);
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
            pushOnce(out.observations, message);
            out.trace.push(message);
        }
    }
}
function passClassOD(joint, pipeClass, odMM, datasetOverride) {
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
    const detail = match.od_max_mm != null
        ? `Tabla 1.5.4: Clase ${pipeClass} con OD ≤ ${match.od_max_mm} mm`
        : `Tabla 1.5.4: Clase ${pipeClass}`;
    return { ok: true, detail };
}
function forbid(ctx, trace, message) {
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
        observations: [],
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
function pushOnce(arr, value) {
    if (value === undefined || value === null)
        return;
    if (!arr.includes(value)) {
        arr.push(value);
    }
}
export default evaluateLRNavalShips;

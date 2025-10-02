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
    const trace = [];
    const sys = datasetOverride.systems.find((s) => s.id === ctx.systemId);
    if (!sys) {
        return forbid(ctx, trace, "Sistema no reconocido");
    }
    const jointGroup = groupOf(ctx.joint);
    if (!jointGroup) {
        return forbid(ctx, trace, "Tipo de junta desconocido");
    }
    const allowedByRow = Boolean(sys.allowed_joints[jointGroup]);
    trace.push(`Tabla 1.5.3 (${sys.label_es}): ${allowedByRow ? "+" : "–"} para ${describeJointGroup(jointGroup)}; clase '${sys.class_of_pipe_system}'.`);
    if (!allowedByRow) {
        return forbid(ctx, trace, "Tabla 1.5.3: '-' para este tipo de junta");
    }
    const classCheck = passClassOD(ctx.joint, ctx.pipeClass, ctx.od_mm, datasetOverride);
    if (!classCheck.ok) {
        if (classCheck.reason === "missing_inputs") {
            return forbid(ctx, trace, "Falta clase/OD (Tabla 1.5.4)");
        }
        return forbid(ctx, trace, "Tabla 1.5.4: límite de clase/OD", classCheck.detail);
    }
    if (classCheck.detail) {
        trace.push(classCheck.detail);
    }
    let status = sys.fire_test !== "not_required" ? "conditional" : "allowed";
    let reason;
    const conditions = [];
    let skipGeneralClauses = false;
    const addCondition = (msg, forceConditional = true) => {
        if (!conditions.includes(msg)) {
            conditions.push(msg);
        }
        if (forceConditional && status !== "forbidden") {
            status = "conditional";
        }
    };
    const addTrace = (msg) => {
        trace.push(msg);
    };
    if (sys.fire_test !== "not_required") {
        const label = FIRE_TEST_LABELS[sys.fire_test] ?? sys.fire_test;
        addCondition(label, true);
        addTrace(`Tabla 1.5.3: Ensayo base ${label}.`);
    }
    for (const noteId of sys.notes) {
        if (reason)
            break;
        const note = datasetOverride.notes[String(noteId)];
        if (!note)
            continue;
        switch (note.type) {
            case "catA_fire_resistant_if_deteriorates_and_material_for_bilge_main": {
                if (ctx.space === "machinery_cat_A" && note.catA_requires_fire_resistant) {
                    addCondition(NOTE1_FIRE_CHIP);
                    addTrace(`Nota ${noteId}: En Cat. A usar juntas resistentes al fuego si hay componentes que se deterioran.`);
                }
                if (ctx.space === "machinery_cat_A" && sys.id === "bilge_lines") {
                    addCondition(NOTE1_BILGE_MATERIAL_CHIP);
                    addTrace(`Nota ${noteId}: Acoples del bilge main en Cat. A deben ser acero/CuNi/equiv.`);
                }
                break;
            }
            case "no_slip_on_in_catA_munitions_accommodation": {
                if (isSlipOn(ctx.joint)) {
                    if (note.prohibit_spaces.includes(ctx.space)) {
                        addTrace(`Nota ${noteId}: Slip-on prohibidas en ${ctx.space}.`);
                        reason = `Nota ${noteId}: slip-on no aceptadas en este espacio`;
                    }
                    else if (ctx.space === "other_machinery" &&
                        note.allow_other_machinery_if_visible_accessible &&
                        ctx.location !== "visible_accessible") {
                        addCondition(NOTE2_LOCATION_CHIP);
                        addTrace(`Nota ${noteId}: En otros espacios de maquinaria deben quedar visibles y accesibles.`);
                    }
                }
                break;
            }
            case "fire_resistant_except_open_deck_low_fire_risk": {
                if (ctx.space !== note.exception.space) {
                    addCondition(NOTE3_FIRE_CHIP);
                    addTrace(`Nota ${noteId}: Exigir tipo resistente al fuego salvo en cubierta abierta de bajo riesgo.`);
                }
                break;
            }
            case "fire_resistant_required": {
                addCondition(NOTE4_FIRE_CHIP);
                addTrace(`Nota ${noteId}: Requiere tipo resistente al fuego.`);
                break;
            }
            case "restrained_slip_on_steam_open_deck_tankers_le_10bar": {
                if (isSlipOn(ctx.joint)) {
                    const okPressure = (ctx.designPressure_bar ?? Number.POSITIVE_INFINITY) <= note.max_pressure_bar;
                    const okLocation = ctx.space === note.space;
                    const okShipType = note.ship_types.includes(ctx.shipType ?? "other");
                    const isRestrained = ctx.joint === "slip_on_machine_grooved";
                    if (okPressure && okLocation && okShipType && isRestrained) {
                        addCondition(NOTE5_STEAM_CHIP, false);
                        addTrace(`Nota ${noteId}: Slip-on restringida permitida en cubierta expuesta para vapor ≤ ${note.max_pressure_bar} bar en petroleros/quimiqueros.`);
                    }
                    else {
                        addTrace(`Nota ${noteId}: Condiciones para restrained slip-on en vapor no satisfechas.`);
                        reason =
                            "Nota 5: solo se permiten restrained slip-on en cubierta expuesta de petroleros/quimiqueros con P ≤ 10 bar";
                    }
                }
                break;
            }
            case "only_above_limit_of_watertight_integrity": {
                if (ctx.aboveLimitOfWatertightIntegrity === false) {
                    addTrace(`Nota ${noteId}: Aplicable solo sobre el límite de integridad estanca.`);
                    addCondition(NOTE6_WLI_CHIP);
                    reason = "Nota 6: solo permitido sobre el Límite de Integridad Estanca";
                }
                else if (ctx.aboveLimitOfWatertightIntegrity !== undefined) {
                    addCondition(NOTE6_WLI_CHIP, false);
                    addTrace(`Nota ${noteId}: Confirmado sobre el límite de integridad estanca.`);
                }
                break;
            }
            case "hvac_trunking_intakes_uptakes_defer": {
                addCondition(NOTE7_INFO_CHIP, false);
                addTrace(`Nota ${noteId}: ${note.message}`);
                skipGeneralClauses = true;
                break;
            }
        }
    }
    if (reason) {
        return forbid(ctx, trace, reason, undefined, conditions);
    }
    if (!skipGeneralClauses) {
        const generalReason = applyGeneralClauses(ctx, sys, addCondition, addTrace);
        if (generalReason) {
            return forbid(ctx, trace, generalReason, undefined, conditions);
        }
    }
    if (ctx.tailoring && (ctx.tailoring.shock || ctx.tailoring.fire || ctx.tailoring.watertight)) {
        const requirements = [
            ctx.tailoring.shock ? "Shock" : null,
            ctx.tailoring.fire ? "Fire" : null,
            ctx.tailoring.watertight ? "WT" : null,
        ].filter(Boolean);
        addCondition(`${TAILORING_CHIP_PREFIX} ${requirements.join("/") || "Shock/Fire/WT"}`);
        addTrace("§5.10.2: Verificar requisitos de Tailoring Doc (autoridad naval).");
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
function applyGeneralClauses(ctx, sys, addCondition, addTrace) {
    if (ctx.isSectionDirectlyConnectedToShipSide && ctx.aboveLimitOfWatertightIntegrity === false) {
        addTrace("§5.10.6: Tramo conectado al costado bajo WLI → juntas mecánicas prohibidas.");
        return "§5.10.6: no se permiten juntas si el tramo conectado al costado está bajo el WLI";
    }
    if (ctx.space === "tank" && (ctx.lineType === "fuel_oil" || ctx.lineType === "thermal_oil")) {
        addTrace("§5.10.6: Tanques con fluidos inflamables → juntas mecánicas prohibidas.");
        return "§5.10.6: juntas prohibidas en tanques con fluidos inflamables";
    }
    if (isSlipOn(ctx.joint)) {
        if (ctx.accessibility === "not_easy") {
            addTrace("§5.10.9: Slip-on prohibidas en ubicaciones de difícil acceso.");
            return "§5.10.9: slip-on no permitidas si no hay acceso fácil";
        }
        if (ctx.space === "tank") {
            if (ctx.mediumInPipeSameAsTank === true) {
                addTrace("§5.10.9: Slip-on dentro de tanques solo si el medio es el mismo.");
            }
            else {
                addTrace("§5.10.9: Slip-on en tanques con medio diferente están prohibidas.");
                return "§5.10.9: slip-on solo dentro de tanques con el mismo medio";
            }
        }
        if (["cargo_hold", "cofferdam", "void"].includes(ctx.space)) {
            addTrace("§5.10.9: Slip-on prohibidas en espacios no accesibles.");
            return "§5.10.9: slip-on prohibidas en bodegas, cofferdams o voids";
        }
    }
    if (ctx.joint === "slip_on_slip_type") {
        if (ctx.mainMeansOfConnection) {
            addCondition(SLIP_TYPE_WARNING, false);
            addTrace("§5.10.10: Slip type no debe ser medio principal de conexión.");
            return "§5.10.10: slip type no puede usarse como medio principal";
        }
        addCondition(SLIP_TYPE_WARNING, false);
        addTrace("§5.10.10: Recordatorio – slip type solo para compensación axial.");
    }
    return null;
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
function isSlipOn(joint) {
    return groupOf(joint) === "slip_on_joints";
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
function forbid(ctx, trace, message, detail, conditions) {
    if (detail) {
        trace.push(detail);
    }
    return {
        status: "forbidden",
        conditions: conditions ? [...conditions] : [],
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
export default evaluateLRNavalShips;

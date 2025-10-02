import dataset from "../data/lr_naval_ships_mech_joints.js";
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
function markConditional(result, condition) {
    if (result.status === "allowed") {
        result.status = "conditional";
    }
    if (condition) {
        pushOnce(result.conditions, condition);
    }
}
function forbidByClause(out, msg, clause) {
    out.status = "forbidden";
    pushOnce(out.reasons, msg);
    if (!out.clauses) {
        out.clauses = [];
    }
    out.clauses.push(clause);
}
function normalizeNavalContext(ctx) {
    const mediumSame = ctx.mediumInPipeSameAsTank ?? true;
    return {
        ...ctx,
        accessibility: ctx.accessibility ?? "easy",
        mediumInPipeSameAsTank: mediumSame,
        mainMeansOfConnection: ctx.mainMeansOfConnection ?? false,
    };
}
export function evaluateLRNavalShips(ctx, datasetOverride = db) {
    const normalizedCtx = normalizeNavalContext(ctx);
    const sys = datasetOverride.systems.find((s) => s.id === normalizedCtx.systemId);
    if (!sys) {
        return forbid(normalizedCtx, [], "Sistema no reconocido");
    }
    const jointGroup = groupOf(normalizedCtx.joint);
    if (!jointGroup) {
        return forbid(normalizedCtx, [], "Tipo de junta desconocido");
    }
    const groups = evaluateGroupsForRow(normalizedCtx, sys, datasetOverride);
    const groupResult = groups[jointGroup];
    const trace = [...groupResult.trace];
    const conditions = [...groupResult.conditions];
    const notesApplied = [...groupResult.notesApplied];
    const clauses = [...groupResult.clauses];
    const reasons = [...groupResult.reasons];
    let status = groupResult.status;
    let reason = reasons.length ? reasons[reasons.length - 1] : undefined;
    if (status !== "forbidden") {
        const classCheck = passClassOD(normalizedCtx.joint, normalizedCtx.pipeClass, normalizedCtx.od_mm, datasetOverride);
        if (!classCheck.ok) {
            if (classCheck.reason === "missing_inputs") {
                reason = "Falta clase/OD (Tabla 1.5.4)";
            }
            else {
                reason = "Tabla 1.5.4: límite de clase/OD";
            }
            status = "forbidden";
            pushOnce(reasons, reason);
            if (classCheck.detail) {
                trace.push(classCheck.detail);
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
        clauses,
    };
}
export function evaluateGroups(ctx, datasetOverride = db) {
    const normalizedCtx = normalizeNavalContext(ctx);
    const sys = datasetOverride.systems.find((s) => s.id === normalizedCtx.systemId);
    if (!sys) {
        throw new Error("Sistema no reconocido");
    }
    return evaluateGroupsForRow(normalizedCtx, sys, datasetOverride);
}
function evaluateGroupsForRow(ctx, row, datasetOverride) {
    const groups = {
        pipe_unions: base(Boolean(row.allowed_joints.pipe_unions), row, "pipe_unions"),
        compression_couplings: base(Boolean(row.allowed_joints.compression_couplings), row, "compression_couplings"),
        slip_on_joints: base(Boolean(row.allowed_joints.slip_on_joints), row, "slip_on_joints"),
    };
    const rowNotes = new Set(row?.notes ?? []);
    const fireLabel = row.fire_test && row.fire_test !== "not_required"
        ? FIRE_TEST_LABELS[row.fire_test] ?? row.fire_test
        : null;
    for (const [groupName, result] of Object.entries(groups)) {
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
function base(allowed, row, group) {
    const result = {
        status: allowed ? "allowed" : "forbidden",
        conditions: [],
        reasons: [],
        notesApplied: [],
        clauses: [],
        trace: [],
    };
    const message = `Tabla 1.5.3 (${row.label_es}): ${allowed ? "+" : "–"} para ${describeJointGroup(group)}; clase '${row.class_of_pipe_system}'.`;
    result.trace.push(message);
    if (!allowed) {
        result.reasons.push("Tabla de sistema: ‘-’");
    }
    return result;
}
function applyNoteScoped_LRNavalShips(noteId, ctx, row, datasetOverride, group, out) {
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
            if (group !== "slip_on_joints") {
                break;
            }
            const note = datasetOverride.notes[String(noteId)];
            if (!note || note.type !== "no_slip_on_in_catA_munitions_accommodation") {
                break;
            }
            const prohibitedSpaces = new Set(note.prohibit_spaces ?? []);
            if (prohibitedSpaces.has(ctx.space)) {
                out.status = "forbidden";
                const message = "Nota 2: Slip-on no aceptadas en espacios restringidos.";
                pushOnce(out.reasons, message);
                pushOnce(out.notesApplied, noteId);
                out.trace.push(`Nota 2: Slip-on prohibidas en ${ctx.space}.`);
                break;
            }
            const requireVisible = new Set(note.require_visible_accessible_spaces ?? []);
            if (requireVisible.has(ctx.space)) {
                markConditional(out, NOTE2_LOCATION_CHIP);
                pushOnce(out.notesApplied, noteId);
                if (ctx.location === "visible_accessible") {
                    out.trace.push("Nota 2: Condición de visibilidad/acceso satisfecha.");
                }
                else {
                    out.trace.push("Nota 2: Exigir ubicación visible y accesible.");
                }
            }
            break;
        }
        case 3: {
            const rowNotes = new Set(row?.notes ?? []);
            if (rowNotes.has(3)) {
                if (ctx.space !== "open_deck_low_risk_SOLAS_9_2_3_3_2_2_10") {
                    markConditional(out, NOTE3_FIRE_CHIP);
                    pushOnce(out.notesApplied, noteId);
                    out.trace.push("Nota 3: exigir juntas resistentes al fuego.");
                }
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
                }
                else {
                    out.status = "forbidden";
                    const message = "Nota 5: sólo restrained slip-on ≤10 bar en cubierta expuesta (petroleros/quimiqueros)";
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
            }
            else {
                out.trace.push("Nota 7: verificar requisitos adicionales (HVAC/intakes/uprakes).");
            }
            out.skipGeneralClauses = true;
            break;
        }
    }
}
function applyGeneralClauses(ctx, group, out) {
    const mediumSame = ctx.mediumInPipeSameAsTank;
    if (ctx.isSectionDirectlyConnectedToShipSide &&
        ctx.aboveLimitOfWatertightIntegrity === false) {
        const clause = {
            code: "NS-5.10.6",
            title: "Sin juntas bajo el WLI conectadas al costado",
            section: "Vol 2, Pt 7, Ch 1, §5.10.6",
        };
        const message = "Tramo conectado al costado por debajo del WLI: juntas prohibidas para cualquier tipo";
        forbidByClause(out, message, clause);
        out.trace.push("§5.10.6: tramo conectado al costado bajo el WLI ⇒ juntas prohibidas.");
        return;
    }
    if (ctx.space === "tank" && (ctx.lineType === "fuel_oil" || ctx.lineType === "thermal_oil")) {
        const clause = {
            code: "NS-5.10.6.flammable",
            title: "En tanques de fluidos inflamables no se admiten juntas mecánicas",
            section: "Vol 2, Pt 7, Ch 1, §5.10.6",
        };
        const message = "Tanques con fluidos inflamables: juntas mecánicas no permitidas";
        forbidByClause(out, message, clause);
        out.trace.push("§5.10.6: juntas prohibidas en tanques con fluidos inflamables.");
        return;
    }
    const isCargoOrTank = ctx.space === "cargo_hold" || ctx.space === "tank";
    const isHardAccess = ctx.accessibility === "not_easy";
    if (group === "slip_on_joints" && (isCargoOrTank || isHardAccess)) {
        const clause = {
            code: "NS-5.10.9",
            title: "Slip-on no en bodegas/tanques/espacios no fácilmente accesibles",
            section: "Vol 2, Pt 7, Ch 1, §5.10.9",
        };
        forbidByClause(out, "Slip-on no permitido en bodegas/tanques/espacios no fácilmente accesibles", clause);
        out.trace.push("§5.10.9: Slip-on no en bodegas/tanques/espacios no fácilmente accesibles.");
    }
    if (group === "slip_on_joints" && ctx.space === "tank" && mediumSame === false) {
        const clause = {
            code: "NS-5.10.9.b",
            title: "Dentro de tanques sólo si el medio es el mismo",
            section: "Vol 2, Pt 7, Ch 1, §5.10.9",
        };
        forbidByClause(out, "Slip-on dentro de tanque: permitido sólo si el medio es el mismo", clause);
        out.trace.push("§5.10.9: Slip-on en tanque sólo si el medio es el mismo.");
    }
    if (ctx.joint === "slip_on_slip_type") {
        pushOnce(out.conditions, SLIP_TYPE_WARNING);
        out.trace.push("§5.10.10: Slip-type solo para compensación axial.");
        if (ctx.mainMeansOfConnection) {
            const clause = {
                code: "NS-5.10.10",
                title: "Slip-type no puede ser medio principal de unión",
                section: "Vol 2, Pt 7, Ch 1, §5.10.10",
            };
            forbidByClause(out, "Slip-type no puede ser medio principal", clause);
            out.trace.push("§5.10.10: slip-type no puede ser medio principal.");
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
        clauses: [],
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

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
    const clauses = [...groupResult.clauses];
    const reasons = [...groupResult.reasons];
    let status = groupResult.status;
    let reason = reasons.length ? reasons[reasons.length - 1] : undefined;
    if (status !== "forbidden") {
        const rulesForJoint = collectRulesForJoint(normalizedCtx.joint, db);
        if (rulesForJoint.length) {
            const pipeClass = normalizedCtx.pipeClass;
            const odValue = typeof normalizedCtx.od_mm === "number" ? normalizedCtx.od_mm : undefined;
            if (!pipeClass) {
                reason = "Falta clase/OD para aplicar Tabla 12.2.9";
                status = "forbidden";
                pushOnce(reasons, reason);
            }
            else {
                let detail = null;
                let anySubtypeOk = false;
                let missingInputs = false;
                for (const rule of rulesForJoint) {
                    const limit = rule.od_max_mm?.[pipeClass];
                    if (limit != null && odValue === undefined) {
                        missingInputs = true;
                        continue;
                    }
                    if (passClassOD(rule, pipeClass, odValue)) {
                        anySubtypeOk = true;
                        detail = formatRuleDetail(rule, pipeClass);
                        break;
                    }
                }
                if (!anySubtypeOk) {
                    reason = missingInputs
                        ? "Falta clase/OD para aplicar Tabla 12.2.9"
                        : "Tabla 12.2.9: límite de clase/OD";
                    status = "forbidden";
                    pushOnce(reasons, reason);
                }
                if (detail) {
                    trace.push(detail);
                }
            }
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
        clauses,
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
function evaluateGroupsForRow(ctx, row, db) {
    const groups = {
        pipe_unions: base(Boolean(row.allowed_joints.pipe_unions), row, "pipe_unions"),
        compression_couplings: base(Boolean(row.allowed_joints.compression_couplings), row, "compression_couplings"),
        slip_on_joints: base(Boolean(row.allowed_joints.slip_on_joints), row, "slip_on_joints"),
    };
    const rowNotes = new Set(row?.notes ?? []);
    const fireTestLabel = row?.fire_test ? labelFire(row.fire_test) : null;
    if (fireTestLabel) {
        for (const result of Object.values(groups)) {
            if (result.status === "forbidden")
                continue;
            result.status = "conditional";
            pushOnce(result.conditions, fireTestLabel);
            pushOnce(result.trace, `Tabla 12.2.8: Ensayo base ${fireTestLabel}.`);
        }
    }
    for (const note of rowNotes) {
        for (const [groupName, result] of Object.entries(groups)) {
            if (result.status === "forbidden")
                continue;
            if (!Boolean(row.allowed_joints[groupName]))
                continue;
            if (note === 1) {
                if (ctx.space === "pump_room" || ctx.space === "open_deck") {
                    if (fireTestLabel) {
                        result.status = "conditional";
                        pushOnce(result.conditions, fireTestLabel);
                        pushOnce(result.notesApplied, note);
                        pushOnce(result.trace, `Nota 1: espacio ${ctx.space} ⇒ ${fireTestLabel}.`);
                    }
                }
                continue;
            }
            applyNote_LRShips(ctx, note, groupName, result);
        }
    }
    for (const [groupName, result] of Object.entries(groups)) {
        if (result.status === "forbidden")
            continue;
        applyGeneralClauses(ctx, groupName, result);
    }
    const pipeClass = ctx.pipeClass;
    const odValue = typeof ctx.od_mm === "number" ? ctx.od_mm : undefined;
    if (pipeClass) {
        for (const [groupName, result] of Object.entries(groups)) {
            const subtypeRules = db.pipe_class_rules.filter((rule) => groupOf(rule.joint) === groupName);
            if (!subtypeRules.length)
                continue;
            let anySubtypeOk = false;
            let missingInputs = false;
            for (const rule of subtypeRules) {
                const limit = rule.od_max_mm?.[pipeClass];
                if (limit != null && odValue === undefined) {
                    missingInputs = true;
                    continue;
                }
                if (passClassOD(rule, pipeClass, odValue)) {
                    anySubtypeOk = true;
                    break;
                }
            }
            if (!anySubtypeOk && !missingInputs) {
                result.status = "forbidden";
                pushOnce(result.reasons, "Tabla 12.2.9: ningún subtipo cumple clase/OD");
            }
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
function forbidByClause(out, msg, clause) {
    out.status = "forbidden";
    pushOnce(out.reasons, msg);
    if (!out.clauses) {
        out.clauses = [];
    }
    out.clauses.push(clause);
}
function applyNote_LRShips(ctx, note, group, out) {
    switch (note) {
        case 2: {
            if (group !== "slip_on_joints")
                break;
            if (ctx.space === "machinery_cat_A" || ctx.space === "accommodation") {
                out.status = "forbidden";
                pushOnce(out.reasons, "Nota 2: Slip-on no aceptadas en Cat. A / alojamientos");
                pushOnce(out.notesApplied, note);
                pushOnce(out.trace, `Nota 2: Slip-on prohibidas en ${ctx.space}.`);
            }
            else if (ctx.space === "other_machinery" && ctx.location !== "visible_accessible") {
                out.status = out.status === "forbidden" ? "forbidden" : "conditional";
                pushOnce(out.conditions, "Ubicar en posición visible/accesible (MSC/Circ.734)");
                pushOnce(out.notesApplied, note);
                pushOnce(out.trace, "Nota 2: exigir ubicación visible/accesible en otras máquinas.");
            }
            break;
        }
        case 4: {
            if (ctx.space === "machinery_cat_A") {
                out.status = out.status === "forbidden" ? "forbidden" : "conditional";
                pushOnce(out.conditions, "Ensayo de fuego en Cat. A (Nota 4)");
                pushOnce(out.notesApplied, note);
                pushOnce(out.trace, "Nota 4: Cat. A ⇒ ensayo de fuego específico.");
            }
            break;
        }
        case 3: {
            if (ctx.space !== "open_deck") {
                out.status = out.status === "forbidden" ? "forbidden" : "conditional";
                pushOnce(out.conditions, "Junta de tipo resistente al fuego");
                pushOnce(out.notesApplied, note);
                pushOnce(out.trace, "Nota 3: exigir junta de tipo resistente al fuego.");
            }
            break;
        }
        case 5: {
            if (ctx.space !== "open_deck") {
                out.status = out.status === "forbidden" ? "forbidden" : "conditional";
                pushOnce(out.conditions, "Sólo sobre cubierta de francobordo (buques de pasaje)");
                pushOnce(out.notesApplied, note);
                pushOnce(out.trace, "Nota 5: restringir a cubierta de francobordo en buques de pasaje.");
            }
            break;
        }
        case 6: {
            if (ctx.joint === "slip_on_slip_type" && ctx.space === "open_deck") {
                const maxPressure = ctx.designPressure_bar ?? Number.POSITIVE_INFINITY;
                if (maxPressure <= 10) {
                    out.status = out.status === "forbidden" ? "forbidden" : "conditional";
                    pushOnce(out.conditions, "Slip-type ≤10 bar en cubierta expuesta");
                    pushOnce(out.trace, "Nota 6: Slip-type permitido ≤10 bar en cubierta expuesta.");
                }
                else {
                    out.status = "forbidden";
                    pushOnce(out.reasons, "Nota 6: Slip-type >10 bar prohibido");
                    pushOnce(out.trace, "Nota 6: Slip-type excede 10 bar ⇒ prohibido.");
                }
                pushOnce(out.notesApplied, note);
            }
            break;
        }
        case 7: {
            pushOnce(out.trace, "Nota 7: revisar equivalencias de ensayo.");
            break;
        }
        case 8: {
            pushOnce(out.trace, "Nota 8: ver §2.12.10 para slip-on restringidas.");
            break;
        }
    }
}
function applyGeneralClauses(ctx, group, out) {
    if (out.status === "forbidden") {
        return;
    }
    const isCargoOrTank = ctx.space === "cargo_hold" || ctx.space === "tank";
    const isHardAccess = ctx.accessibility === "not_easy";
    if (group === "slip_on_joints" && (isCargoOrTank || isHardAccess)) {
        forbidByClause(out, "Slip-on no permitido en bodegas/tanques/espacios no fácilmente accesibles", {
            code: "SH-2.12.8",
            title: "Slip-on no en bodegas/tanques/espacios no fácilmente accesibles",
            section: "Pt 5, Ch 12, §2.12.8",
        });
    }
    if (ctx.joint === "slip_on_slip_type" && ctx.asMainMeans) {
        forbidByClause(out, "Slip-type no como medio principal (sólo compensación axial)", {
            code: "SH-2.12.9",
            title: "Slip type: no como medio principal",
            section: "Pt 5, Ch 12, §2.12.9",
        });
    }
    if (ctx.directToShipSideBelowLimit || ctx.tankContainsFlammable) {
        forbidByClause(out, "Prohibido en conexión directa al costado bajo el límite / tanques con fluidos inflamables", {
            code: "SH-2.12.5",
            title: "Riesgo de incendio/inundación",
            section: "Pt 5, Ch 12, §2.12.5",
        });
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
function collectRulesForJoint(joint, db) {
    const direct = db.pipe_class_rules.filter((rule) => rule.joint === joint);
    if (direct.length) {
        return direct;
    }
    const group = groupOf(joint);
    if (!group) {
        return [];
    }
    return db.pipe_class_rules.filter((rule) => groupOf(rule.joint) === group);
}
function passClassOD(rule, pipeClass, odMM) {
    if (!rule.class.includes(pipeClass)) {
        return false;
    }
    const limit = rule.od_max_mm?.[pipeClass];
    if (limit == null) {
        return true;
    }
    if (odMM === undefined) {
        return false;
    }
    return odMM <= limit + 1e-6;
}
function formatRuleDetail(rule, pipeClass) {
    const limit = rule.od_max_mm?.[pipeClass];
    if (limit == null) {
        return `Tabla 12.2.9: Clase ${pipeClass}`;
    }
    return `Tabla 12.2.9: Clase ${pipeClass} con OD ≤ ${limit} mm`;
}
export default evaluateLRShips;

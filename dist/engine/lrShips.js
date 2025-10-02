import { LR_SHIPS_SYSTEMS } from "../data/lr_ships_mech_joints.js";
export const SUBTYPE_RULES = {
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
export function passClassOD(rule, cls, od_mm) {
    if (!rule.classes.includes(cls))
        return false;
    const lim = rule.od_max_mm?.[cls];
    return lim ? (od_mm ?? Infinity) <= lim : true;
}
const JOINT_GROUP_MAP = {
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
const JOINT_SUBTYPE_IDS = {
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
export function evaluateLRShips(ctx, dataset = LR_SHIPS_SYSTEMS) {
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
export function evaluateGroups(ctx, dataset = LR_SHIPS_SYSTEMS) {
    const { groups } = evaluateGroupsWithRow(ctx, dataset);
    return cloneGroups(groups);
}
function evaluateGroupsWithRow(ctx, dataset) {
    const row = findRow(ctx.systemId, dataset);
    const groups = {
        pipe_unions: base(),
        compression_couplings: base(),
        slip_on_joints: base(),
    };
    if (!row) {
        forbidAll(groups, "Fila 12.2.8 no encontrada");
        return { groups };
    }
    for (const group of Object.keys(groups)) {
        if (!row.allowed_joints[group]) {
            block(groups[group], "Tabla 12.2.8: ‘−’ para este tipo de unión");
        }
    }
    const fireLabel = labelFire(row.fire_test);
    if (fireLabel) {
        forEachOpen(groups, (ev) => makeConditional(ev, fireLabel));
    }
    applySlipOnSpaceRestrictions(ctx, groups);
    applyRowNotes(ctx, row, groups);
    applyClauses(ctx, groups);
    applySubtypeLimits(ctx, groups);
    return { groups, row };
}
function cloneGroups(groups) {
    return {
        pipe_unions: cloneEval(groups.pipe_unions),
        compression_couplings: cloneEval(groups.compression_couplings),
        slip_on_joints: cloneEval(groups.slip_on_joints),
    };
}
function cloneEval(ev) {
    return {
        status: ev.status,
        conditions: [...ev.conditions],
        reasons: [...ev.reasons],
        notesApplied: [...ev.notesApplied],
        clauses: ev.clauses.map((clause) => ({ ...clause })),
    };
}
function findRow(id, dataset) {
    return dataset.find((row) => row.id === id);
}
function base() {
    return { status: "allowed", conditions: [], reasons: [], notesApplied: [], clauses: [] };
}
function block(ev, reason) {
    ev.status = "forbidden";
    pushUnique(ev.reasons, reason);
}
function makeConditional(ev, condition) {
    if (ev.status === "forbidden")
        return;
    if (ev.status !== "conditional") {
        ev.status = "conditional";
    }
    pushUnique(ev.conditions, condition);
}
function pushUnique(arr, value) {
    if (!arr.includes(value))
        arr.push(value);
}
function note(ev, n) {
    if (!ev.notesApplied.includes(n)) {
        ev.notesApplied.push(n);
    }
}
function noteAll(out, n) {
    for (const group of Object.keys(out)) {
        note(out[group], n);
    }
}
function forEachOpen(out, fn) {
    for (const group of Object.keys(out)) {
        const ev = out[group];
        if (ev.status !== "forbidden") {
            fn(ev);
        }
    }
}
function forbidAll(out, reason) {
    for (const group of Object.keys(out)) {
        block(out[group], reason);
    }
}
function labelFire(test) {
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
function applyRowNotes(ctx, row, out) {
    if (!row.notes.length)
        return;
    if (row.notes.includes(3) && ctx.space !== "open_deck") {
        forEachOpen(out, (ev) => makeConditional(ev, "Junta de tipo resistente al fuego"));
        noteAll(out, 3);
    }
    if (row.notes.includes(4) && ctx.space === "machinery_cat_A") {
        forEachOpen(out, (ev) => makeConditional(ev, "Ensayo adicional en Cat. A (Nota 4)"));
        noteAll(out, 4);
    }
}
function applySlipOnSpaceRestrictions(ctx, out) {
    const ev = out.slip_on_joints;
    if (ev.status === "forbidden") {
        return;
    }
    if (ctx.space === "machinery_cat_A" || ctx.space === "accommodation") {
        block(ev, "Slip-on no aceptadas en espacios de máquinas de categoría A ni alojamientos.");
        note(ev, 2);
        return;
    }
    if (ctx.space === "other_machinery") {
        block(ev, "Slip-on en espacios de máquinas sólo si están visibles y accesibles (MSC/Circ.734).");
        note(ev, 2);
        return;
    }
    if (ctx.space === "other_machinery_accessible") {
        makeConditional(ev, "Ubicar en posición visible/accesible (MSC/Circ.734)");
        note(ev, 2);
    }
}
function applyClauses(ctx, out) {
    const addClause = (ev, code, section, title, reason) => {
        block(ev, reason);
        ev.clauses.push({ code, section, title });
    };
    const slip = out.slip_on_joints;
    if (slip.status !== "forbidden") {
        const hardAccess = ctx.space === "cargo_hold" || ctx.space === "tank" || ctx.accessibility === "not_easy";
        if (hardAccess) {
            addClause(slip, "SH-2.12.8", "Pt 5, Ch 12, §2.12.8", "Accesibilidad Slip-on", "Slip-on no permitido en bodegas/tanques/espacios no fácilmente accesibles");
        }
        else if (ctx.space === "tank" && ctx.mediumInPipeSameAsTank === false) {
            addClause(slip, "SH-2.12.8.b", "Pt 5, Ch 12, §2.12.8", "Medio en tanque", "Slip-on dentro de tanque: permitido sólo si el medio es el mismo");
        }
    }
    if (ctx.asMainMeans && out.slip_on_joints.status !== "forbidden") {
        addClause(out.slip_on_joints, "SH-2.12.9", "Pt 5, Ch 12, §2.12.9", "Slip-type principal", "Slip-type no puede ser medio principal");
    }
    const hazard = Boolean(ctx.directToShipSideBelowLimit || ctx.tankContainsFlammable);
    if (hazard) {
        forEachOpen(out, (ev) => addClause(ev, "SH-2.12.5", "Pt 5, Ch 12, §2.12.5", "Riesgo de incendio/inundación", "Prohibido por riesgo de incendio/inundación"));
    }
}
function applySubtypeLimits(ctx, out) {
    const cls = ctx.pipeClass;
    if (!cls) {
        forEachOpen(out, (ev) => block(ev, "Tabla 12.2.9: requiere clase/OD"));
        return;
    }
    for (const group of Object.keys(out)) {
        const ev = out[group];
        if (ev.status === "forbidden")
            continue;
        const rules = SUBTYPE_RULES[group] ?? [];
        const anyOk = rules.some((rule) => passClassOD(rule, cls, ctx.od_mm));
        if (!anyOk) {
            block(ev, "Tabla 12.2.9: ningún subtipo cumple clase/OD");
        }
    }
}
export default evaluateLRShips;

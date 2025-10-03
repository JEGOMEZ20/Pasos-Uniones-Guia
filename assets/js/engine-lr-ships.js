import { LR_SHIPS_SYSTEMS, SUBTYPE_RULES, NOTES_TEXT, CLAUSES } from "./data-lr-ships.js";

export function passClassOD(rule, cls, od) {
  if (!rule.classes.includes(cls)) return false;
  const lim = rule.od_max_mm?.[cls];
  return lim ? od <= lim : true;
}

function baseEval(){ return { status:"allowed", conditions:[], reasons:[], notes:[], clauses:[], subtypes:[] }; }
function setForbidden(ev, reason){ ev.status="forbidden"; if(!ev.reasons.includes(reason)) ev.reasons.push(reason); }
function setConditional(ev, cond){ if (ev.status!=="forbidden"){ ev.status="conditional"; if(!ev.conditions.includes(cond)) ev.conditions.push(cond); } }
function note(ev, n){ if(!ev.notes.includes(n)) ev.notes.push(n); }

export function evaluateLRShips(ctx){
  // ctx = { systemId, pipeClass:"I"|"II"|"III", od_mm:number, space:string, accessibility?:"easy"|"not_easy",
  //         mediumSameAsTank?:boolean, asMainMeans?:boolean,
  //         directToShipSideBelowLimit?:boolean, tankContainsFlammable?:boolean, isPumpRoom?:boolean, isOpenDeck?:boolean, isSteam?:boolean, designPressureBar?:number }
  const row = LR_SHIPS_SYSTEMS.find(s => s.id===ctx.systemId);
  const out = {
    pipe_unions: baseEval(),
    compression_couplings: baseEval(),
    slip_on_joints: baseEval()
  };
  if(!row){ for(const k in out) setForbidden(out[k], "Tabla 12.2.8: fila no encontrada"); return { row:null, result:out, fire: null, class_of_pipe: null, notes:[] }; }

  // 1) Permisividad 12.2.8
  for (const g of ["pipe_unions","compression_couplings","slip_on_joints"]) {
    if (!row.allowed_joints[g]) setForbidden(out[g], "Tabla 12.2.8: ‘−’ para este tipo de unión");
  }

  // 2) Ensayo de la fila
  const fireMap = { "30min_dry":"30 min seco", "30min_wet":"30 min húmedo", "8+22":"8 min seco + 22 min húmedo" };
  if (row.fire_test !== "not_required") {
    const label = fireMap[row.fire_test];
    for (const g of ["pipe_unions","compression_couplings","slip_on_joints"]) setConditional(out[g], label);
  }

  // 3) Notas de la FILA (no globalizar)
  const has = n => row.notes.includes(n);
  if (has(1) && (ctx.isOpenDeck || ctx.isPumpRoom)) {
    for (const g of ["pipe_unions","compression_couplings","slip_on_joints"]) { setConditional(out[g], "Ensayo de fuego (Nota 1)"); note(out[g],1); }
  }
  if (has(2)) {
    // Solo Slip-on
    if (ctx.space==="machinery_cat_A" || ctx.space==="accommodation") {
      setForbidden(out.slip_on_joints, "Nota 2: Slip-on no aceptadas en Cat. A / alojamientos");
    } else if (ctx.space==="other_machinery_accessible") {
      setConditional(out.slip_on_joints, "Visibles y accesibles (Nota 2)");
    }
    note(out.slip_on_joints,2);
  }
  if (has(3) && !ctx.isOpenDeck) {
    for (const g of ["pipe_unions","compression_couplings","slip_on_joints"]) { setConditional(out[g], "Tipo resistente al fuego (Nota 3)"); note(out[g],3); }
  }
  if (has(4) && ctx.space==="machinery_cat_A") {
    for (const g of ["pipe_unions","compression_couplings","slip_on_joints"]) { setConditional(out[g], "Ensayo Cat. A (Nota 4)"); note(out[g],4); }
  }
  // Nota 5 / 6 / 7 / 8 se pueden añadir igual según contexto si deseas chips informativos

  // 4) Cláusulas generales 2.12.x
  if (ctx.directToShipSideBelowLimit || ctx.tankContainsFlammable) {
    for (const g of ["pipe_unions","compression_couplings","slip_on_joints"]) {
      setForbidden(out[g], "2.12.5: " + CLAUSES["2.12.5"]);
      out[g].clauses.push("2.12.5");
    }
  }
  if (out.slip_on_joints.status!=="forbidden"){
    if (ctx.space==="cargo_hold" || ctx.space==="tank" || ctx.accessibility==="not_easy") {
      setForbidden(out.slip_on_joints, "2.12.8: " + CLAUSES["2.12.8"]);
      out.slip_on_joints.clauses.push("2.12.8");
    }
    if (ctx.space==="tank" && ctx.mediumSameAsTank===false){
      setForbidden(out.slip_on_joints, "2.12.8: Dentro de tanque, el medio debe ser el mismo");
      out.slip_on_joints.clauses.push("2.12.8");
    }
  }
  if (ctx.asMainMeans && out.slip_on_joints.status!=="forbidden") {
    setForbidden(out.slip_on_joints, "2.12.9: " + CLAUSES["2.12.9"]);
    out.slip_on_joints.clauses.push("2.12.9");
  }
  if (ctx.isSteam && ctx.isOpenDeck && (ctx.designPressureBar ?? 0) <= 10) {
    setConditional(out.slip_on_joints, "2.12.10: Slip-on restringidos en vapor ≤1 MPa en cubierta");
    out.slip_on_joints.clauses.push("2.12.10");
  }

  // 5) 12.2.9 por subtipos (si ningún subtipo calza, bloquear grupo)
  const checkGroup = (g) => {
    const rules = SUBTYPE_RULES[g] || [];
    const valid = rules.filter(r => passClassOD(r, ctx.pipeClass, ctx.od_mm));
    out[g].subtypes = rules.map(r => ({ id:r.id, name:r.name, valid: valid.some(v => v.id===r.id) }));
    if (out[g].status!=="forbidden" && valid.length===0) {
      setForbidden(out[g], "Tabla 12.2.9: ningún subtipo cumple clase/OD");
    }
  };
  checkGroup("pipe_unions");
  checkGroup("compression_couplings");
  checkGroup("slip_on_joints");

  return {
    row: {
      label: row.label,
      class_of_pipe_system: row.class_of_pipe_system,
      fire_test: row.fire_test,
      notes: row.notes.map(n => ({ n, text: NOTES_TEXT[n] || "" }))
    },
    result: out
  };
}

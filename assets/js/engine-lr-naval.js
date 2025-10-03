import {
  LR_NAVAL_SYSTEMS, SUBTYPE_RULES_NAVAL, NOTES_NAVAL, CLAUSES_NAVAL
} from "./data-lr-naval.js";

function base(){ return { status:"allowed", conditions:[], reasons:[], notes:[], clauses:[], subtypes:[] }; }
function forbid(ev, why){ ev.status="forbidden"; if(!ev.reasons.includes(why)) ev.reasons.push(why); }
function conditional(ev, cond){ if(ev.status!=="forbidden"){ ev.status="conditional"; if(!ev.conditions.includes(cond)) ev.conditions.push(cond); } }
function addNote(ev,n){ if(!ev.notes.includes(n)) ev.notes.push(n); }
function passClassOD(rule, cls, od){ if(!rule.classes.includes(cls)) return false; const L=rule.od_max_mm?.[cls]; return L ? od<=L : true; }

export function evaluateLRNaval(ctx){
  // ctx: { systemId, pipeClass, od_mm,
  //        space,               // "machinery_cat_A"|"accommodation"|"munition_store"|"other_machinery_accessible"|"cargo_hold"|"tank"|"open_deck"
  //        isOpenDeck, isPumpRoom,
  //        accessibility,       // "easy"|"not_easy"
  //        asMainMeans,         // slip-type como unión principal
  //        directToShipSideBelowLimit, tankContainsFlammable,
  //        isSteam, designPressureBar,
  //        bilgeMainInCatA, mediumSameAsTank
  // }
  const row = LR_NAVAL_SYSTEMS.find(r=>r.id===ctx.systemId);
  const out = {
    pipe_unions: base(),
    compression_couplings: base(),
    slip_on_joints: base(),
  };
  if(!row){
    for(const k in out) forbid(out[k],"Tabla 1.5.3: fila no encontrada");
    return { row:null, result:out };
  }

  // 1) Permisividad de la fila (1.5.3)
  ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=>{
    if(!row.allowed_joints[g]) forbid(out[g], "Tabla 1.5.3: ‘−’ para este grupo");
  });

  // 2) Ensayo de fuego de la fila
  const fireMap = { "30min_dry":"30 min seco", "30min_wet":"30 min húmedo", "8+22":"8 min seco + 22 min húmedo" };
  if(row.fire_test!=="not_required"){
    const tag = fireMap[row.fire_test];
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=> conditional(out[g], tag));
  }

  // 3) Notas de la FILA (aplicar solo si la fila las trae)
  const has = n => row.notes.includes(n);

  // Nota 1
  if(has(1) && ctx.space==="machinery_cat_A"){
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=>{ conditional(out[g], "Tipo resistente al fuego (Nota 1)"); addNote(out[g],1); });
    if (ctx.bilgeMainInCatA) {
      ["pipe_unions","compression_couplings"].forEach(g=> conditional(out[g], "Material: acero/CuNi o equivalente (bilge main Cat. A)"));
    }
  }

  // Nota 2 (solo Slip-on)
  if(has(2)){
    addNote(out.slip_on_joints,2);
    if (["machinery_cat_A","accommodation","munition_store"].includes(ctx.space)) {
      forbid(out.slip_on_joints, "Nota 2: Slip-on prohibidas en Cat. A / alojamientos / pañoles de munición");
    } else if (ctx.space==="other_machinery_accessible") {
      conditional(out.slip_on_joints, "Visibles y accesibles (Nota 2)");
    }
  }

  // Nota 3 (fire-resistant except open deck de bajo riesgo)
  if(has(3) && !ctx.isOpenDeck){
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=>{ conditional(out[g], "Tipo resistente al fuego (Nota 3)"); addNote(out[g],3); });
  }

  // Nota 4 (fire-resistant sin excepción)
  if(has(4)){
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=>{ conditional(out[g], "Tipo resistente al fuego (Nota 4)"); addNote(out[g],4); });
  }

  // Nota 5 (steam slip-on restringidas) — la aplicamos en cláusula 5.10.11 abajo
  if(has(6) && row.id==="deck_drains_internal"){
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=>{ conditional(out[g], "Solo por encima del Límite de Integridad Estanca (Nota 6)"); addNote(out[g],6); });
  }
  if(has(7)){
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=> addNote(out[g],7));
  }

  // 4) Cláusulas generales 5.10.x
  if (ctx.directToShipSideBelowLimit || ctx.tankContainsFlammable){
    ["pipe_unions","compression_couplings","slip_on_joints"].forEach(g=>{
      forbid(out[g], "5.10.6: "+CLAUSES_NAVAL["5.10.6"]); out[g].clauses.push("5.10.6");
    });
  }

  // Slip-on restricciones de accesibilidad/bodegas/tanques
  if (out.slip_on_joints.status!=="forbidden") {
    if (ctx.space==="cargo_hold" || ctx.space==="tank" || ctx.accessibility==="not_easy"){
      forbid(out.slip_on_joints, "5.10.9: "+CLAUSES_NAVAL["5.10.9"]); out.slip_on_joints.clauses.push("5.10.9");
    }
    if (ctx.space==="tank" && ctx.mediumSameAsTank===false){
      forbid(out.slip_on_joints, "5.10.9: En tanque solo si el medio es el mismo"); out.slip_on_joints.clauses.push("5.10.9");
    }
  }

  // Slip-type como unión principal
  if (ctx.asMainMeans && out.slip_on_joints.status!=="forbidden"){
    forbid(out.slip_on_joints, "5.10.10: "+CLAUSES_NAVAL["5.10.10"]); out.slip_on_joints.clauses.push("5.10.10");
  }

  // Vapor (restrained slip-on ≤10 bar en cubierta)
  if (row.id==="steam" || ctx.isSteam){
    if (ctx.isOpenDeck && (ctx.designPressureBar??0) <= 10){
      conditional(out.slip_on_joints, "5.10.11: Slip-on restringidas en vapor ≤10 bar en cubierta"); out.slip_on_joints.clauses.push("5.10.11");
    } else {
      forbid(out.slip_on_joints, "5.10.11: Condiciones para vapor no cumplidas"); out.slip_on_joints.clauses.push("5.10.11");
    }
  }

  // 5) Tabla 1.5.4 — subtipos
  const check = (g)=>{
    const rules = SUBTYPE_RULES_NAVAL[g]||[];
    const valid = rules.filter(r=> passClassOD(r, ctx.pipeClass, ctx.od_mm));
    out[g].subtypes = rules.map(r=>({ id:r.id, name:r.name, valid: valid.some(x=>x.id===r.id) }));
    if(out[g].status!=="forbidden" && valid.length===0){
      forbid(out[g], "Tabla 1.5.4: ningún subtipo cumple clase/OD");
    }
  };
  check("pipe_unions"); check("compression_couplings"); check("slip_on_joints");

  return {
    row: { label: row.label, class_of_pipe_system: row.class_of_pipe_system, fire_test: row.fire_test, notes: row.notes.map(n=>({n, text:NOTES_NAVAL[n]})) },
    result: out
  };
}

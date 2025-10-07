// rules-lr-ships.js

// Carga JSON (ajusta rutas si usas bundler)
const SERVICE = await (await fetch('./lr_ships.table_service.json')).json();
const CLASS   = await (await fetch('./lr_ships.table_class.json')).json();
const NOTES   = await (await fetch('./lr_ships.notes.json')).json();

export function evaluateLRShips({ systemKey, spaceKey, klass, od_mm }) {
  const row = findRow(systemKey);
  if (!row) return { cards: [], debug: ["Row not found"] };

  let joints = new Set(row.allowed_joints);
  const appliedNotes = new Set();
  const flags = { fireTest: null, fireTestCovers: [], fireResistantType: false };
  const debug = [];

  // 1) Filtro por clase/OD (Tabla 12.2.9)
  joints = new Set([...joints].filter(j => {
    const rule = CLASS[j]?.[klass];
    if (!rule) { debug.push(`No class rule for ${j}/${klass}`); return false; }
    if (rule.allowed === false) { debug.push(`Class deny ${j}`); return false; }
    if (typeof rule.od_mm_max === 'number' && od_mm > rule.od_mm_max) {
      debug.push(`OD limit ${j} ${od_mm} > ${rule.od_mm_max}`);
      return false;
    }
    return true;
  }));

  // 2) Notas por espacio (prohibiciones primero)
  for (const sr of NOTES.space_rules) {
    if (!sr.applies_if_space_in?.includes(spaceKey)) continue;

    let touched = false;

    if (sr.forbid_joints) {
      for (const j of sr.forbid_joints) {
        if (joints.delete(j)) {
          debug.push(`Forbidden by N${sr.note_ids?.[0] ?? '?'}: ${j}`);
          touched = true;
        }
      }
    }
    if (sr.require_installation_fire_test) {
      const prev = flags.fireTest;
      flags.fireTest = flags.fireTest || row.type_fire_test;
      if (flags.fireTest && flags.fireTest !== prev) touched = true;
    }
    if (sr.require_fire_resistant_type === true) {
      if (!flags.fireResistantType) touched = true;
      flags.fireResistantType = true;
    }

    if (touched) sr.note_ids?.forEach(n => appliedNotes.add(n));
  }

  // 3) Notas de la fila (aplicar SOLO si procede)
  for (const n of (row.notes || [])) {
    switch (n) {
      case 1:
        if (["pump_room","open_deck","weather_deck"].includes(spaceKey)) {
          flags.fireTest = flags.fireTest || row.type_fire_test;
          appliedNotes.add(1);
        }
        break;
      case 2:
        if (["machinery_category_A","accommodation"].includes(spaceKey)) {
          ["slip_on.machine_grooved","slip_on.grip","slip_on.slip"].forEach(j => joints.delete(j));
          appliedNotes.add(2);
        }
        break;
      case 3:
        // UI: solo indicador; la excepción de cubierta abierta ya se manejó en space_rules
        if (["open_deck","weather_deck"].includes(spaceKey)) appliedNotes.add(3);
        break;
      case 4:
        if (spaceKey === "machinery_category_A") {
          flags.fireTest = flags.fireTest || row.type_fire_test;
          appliedNotes.add(4);
        }
        break;
      case 5: appliedNotes.add(5); break;
      case 6: appliedNotes.add(6); break;
      case 7: appliedNotes.add(7); break;
      case 8:
        if (spaceKey === "weather_deck") appliedNotes.add(8);
        break;
      default:
        break;
    }
  }

  // 4) Equivalencias de ensayo (Nota 7)
  if (flags.fireTest) {
    const eq = NOTES.test_equivalence?.[flags.fireTest] || [];
    flags.fireTestCovers = eq;
    appliedNotes.add(7);
  }

  // 5) Construcción de tarjetas
  const cards = buildCards([...joints], { row, flags, appliedNotes: [...appliedNotes] });

  return { cards, debug };
}

function findRow(systemKey) {
  if (Array.isArray(SERVICE)) return SERVICE.find(r => r.key === systemKey);
  return SERVICE[systemKey]; // si viene como objeto
}

function buildCards(joints, ctx) {
  const all = [
    { key: "pipe_union", label: "Unión roscada/soldada" },
    { key: "compression", label: "Acople de compresión" },
    { key: "slip_on.machine_grooved", label: "Ranurado mecánico" },
    { key: "slip_on.grip", label: "Grip (ranurado)" },
    { key: "slip_on.slip", label: "Slip (tipo slip-on)" }
  ];

  return all.map(item => {
    const allowed = joints.includes ? joints.includes(item.key) : joints.has(item.key);
    // Razón de no permitido
    let reason = allowed ? null : reasonFor(item.key, ctx);

    return {
      joint_key: item.key,
      title: item.label,
      status: allowed ? "PERMITIDO" : "NO PERMITIDO",
      reason,
      fire_test: allowed ? formatFireTest(ctx.flags) : null,
      notes: ctx.appliedNotes.sort((a,b)=>a-b)
    };
  });
}

function reasonFor(jointKey, { appliedNotes }) {
  // Si hay N2 y el joint es slip-on, razón por nota 2
  const isSlip = jointKey.startsWith("slip_on");
  if (isSlip && appliedNotes.includes(2)) return "Prohibido por Nota 2";
  // Si no pasó por clase/OD, ya no aparece como permitido — la UI puede mostrar “Límite de clase/OD (12.2.9)”
  return "Restringido por clase/OD (12.2.9) o nota aplicable";
}

function formatFireTest(flags) {
  if (!flags.fireTest) return null;
  const map = {
    "30min_dry": "Ensayo requerido: 30 min seco (cubre 8+22 y 30 min húmedo)",
    "8dry_22wet": "Ensayo requerido: 8 min seco + 22 min húmedo (cubre 30 min húmedo)",
    "30min_wet": "Ensayo requerido: 30 min húmedo"
  };
  return map[flags.fireTest] || null;
}

// Utilidad para mostrar texto ES/EN en tooltips
export function getNoteText(noteId, lang = "es") {
  const n = NOTES.notes_text?.[String(noteId)];
  if (!n) return { es: "", en: "" };
  return { es: n.es, en: n.en };
}

export async function runLRShipsTests() {
  const tests = await (await fetch('./lr_ships.tests.json')).json();
  const out = [];
  for (const t of tests) {
    const { cards } = evaluateLRShips(t.input);
    const map = Object.fromEntries(cards.map(c => [c.joint_key, c.status==='PERMITIDO' ? 'SI' : 'NO']));
    const notes = [...new Set(cards.flatMap(c => c.notes))].sort((a,b)=>a-b);
    const fire = cards.find(c => c.fire_test)?.fire_test ? cards.find(c => c.fire_test).fire_test : null;
    out.push({ name:t.name, pass:
      map["slip_on.machine_grooved"]===t.expect["slip_on.machine_grooved"] &&
      map["slip_on.grip"]===t.expect["slip_on.grip"] &&
      map["slip_on.slip"]===t.expect["slip_on.slip"] &&
      JSON.stringify(notes)===JSON.stringify(t.expect.notes) &&
      (!!fire) === (!!t.expect.fire_test)
    , got:{ map, notes, fire }, expect:t.expect });
  }
  console.table(out.map(x=>({name:x.name, pass:x.pass})));
  return out;
}

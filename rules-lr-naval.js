// rules-lr-naval.js

const SERVICE = await (await fetch('./lr_naval.table_service.json')).json();
const CLASS   = await (await fetch('./lr_naval.table_class.json')).json();
const NOTES   = await (await fetch('./lr_naval.notes.json')).json();

/**
 * params:
 *  - systemKey: clave de fila 1.5.3
 *  - spaceKey: clave de espacio (ver lista)
 *  - klass: 'I' | 'II' | 'III'
 *  - od_mm: número
 *  - inside_tank_medium_same?: boolean (opcional; por defecto false)
 */
export function evaluateLRNaval({ systemKey, spaceKey, klass, od_mm, inside_tank_medium_same = false }) {
  const row = findRow(systemKey);
  if (!row) return { cards: [], debug: ["Row not found"] };

  let joints = new Set(row.allowed_joints);
  const appliedNotes = new Set();
  const flags = { fireTest: null, fireResistantType: false };
  const debug = [];

  // 1) Clase/OD (Tabla 1.5.4)
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

  // 2) Reglas por espacio (prohibiciones / flags)
  for (const sr of NOTES.space_rules) {
    if (!sr.applies_if_space_in?.includes(spaceKey)) continue;

    // §5.10.9 excepción: tanque con mismo medio
    if (sr.note_ids?.includes(9) && spaceKey.startsWith('tank') && inside_tank_medium_same) {
      debug.push('5.10.9: mismo medio en tanque -> no se prohíbe slip-on');
    } else {
      if (sr.forbid_joints) {
        for (const j of sr.forbid_joints) {
          if (joints.delete(j)) debug.push(`Forbidden by N${sr.note_ids[0]}: ${j}`);
        }
      }
    }

    if (sr.require_fire_resistant_type) flags.fireResistantType = true;
    if (sr.require_installation_fire_test) {
      if (!flags.fireTest && row.type_fire_test && row.type_fire_test !== 'none') {
        flags.fireTest = row.type_fire_test;
      }
    }
    sr.note_ids?.forEach(n => appliedNotes.add(n));
  }

  // 3) Notas declaradas en la fila (1.5.3)
  for (const n of (row.notes || [])) {
    switch (n) {
      case 1:
        if (spaceKey === 'machinery_category_A') {
          flags.fireResistantType = true;
          appliedNotes.add(1);
        }
        break;
      case 2:
        if (['machinery_category_A','accommodation','munition_store'].includes(spaceKey)) {
          ['slip_on.machine_grooved','slip_on.grip','slip_on.slip'].forEach(j => joints.delete(j));
          appliedNotes.add(2);
        }
        break;
      case 3:
        appliedNotes.add(3);
        if (spaceKey !== 'open_deck_low_fire_risk') {
          flags.fireResistantType = true;
        }
        break;
      case 4:
        appliedNotes.add(4);
        flags.fireResistantType = true;
        break;
      case 5:
        appliedNotes.add(5);
        break;
      case 6:
        if (spaceKey === 'above_limit_watertight_integrity_only') appliedNotes.add(6);
        break;
      case 7:
        appliedNotes.add(7);
        break;
      default:
        break;
    }
  }

  // 4) Ensayo (sin equivalencias en Naval)
  if (!flags.fireTest && row.type_fire_test && row.type_fire_test !== 'none') {
    flags.fireTest = row.type_fire_test;
  }

  // 5) Tarjetas
  const cards = buildCards([...joints], { row, flags, appliedNotes: [...appliedNotes] });
  return { cards, debug };
}

function findRow(systemKey){
  if (Array.isArray(SERVICE)) return SERVICE.find(r => r.key === systemKey);
  return SERVICE[systemKey];
}

function buildCards(joints, ctx){
  const all = [
    { key: 'pipe_union', label: 'Unión roscada/soldada' },
    { key: 'compression', label: 'Acople de compresión' },
    { key: 'slip_on.machine_grooved', label: 'Ranurado mecánico' },
    { key: 'slip_on.grip', label: 'Grip (ranurado)' },
    { key: 'slip_on.slip', label: 'Slip (tipo slip-on)' }
  ];
  return all.map(item => {
    const allowed = joints.includes ? joints.includes(item.key) : joints.has(item.key);
    let reason = allowed ? null : reasonFor(item.key, ctx);
    return {
      joint_key: item.key,
      title: item.label,
      status: allowed ? 'PERMITIDO' : 'NO PERMITIDO',
      reason,
      fire_test: allowed ? formatFireTest(ctx.flags) : null,
      fire_resistant_tag: ctx.flags.fireResistantType ? 'Tipo resistente al fuego requerido' : null,
      notes: ctx.appliedNotes.sort((a,b)=>a-b)
    };
  });
}

function reasonFor(jointKey, { appliedNotes }){
  const isSlip = jointKey.startsWith('slip_on');
  if (isSlip && appliedNotes.includes(2)) return 'Prohibido por Nota 2';
  if (isSlip && appliedNotes.includes(9)) return 'Prohibido por §5.10.9';
  return 'Restringido por clase/OD (1.5.4) o nota aplicable';
}

function formatFireTest(flags){
  if (!flags.fireTest) return null;
  const map = {
    '30min_dry': 'Ensayo (fila): 30 min seco',
    '8dry_22wet': 'Ensayo (fila): 8 min seco + 22 min húmedo',
    '30min_wet': 'Ensayo (fila): 30 min húmedo'
  };
  return map[flags.fireTest] || null;
}

export function getNavalNoteText(noteId, lang='es'){
  const n = NOTES.notes_text?.[String(noteId)];
  if (!n) return { es: '', en: '' };
  return { es: n.es, en: n.en };
}

export async function runLRNavalTests() {
  const tests = await (await fetch('./lr_naval.tests.json')).json();
  const out = [];
  for (const t of tests) {
    const { cards } = evaluateLRNaval(t.input);
    const map = Object.fromEntries(cards.map(c => [c.joint_key, c.status==='PERMITIDO' ? 'SI' : 'NO']));
    const notes = [...new Set(cards.flatMap(c => c.notes))].sort((a,b)=>a-b);
    const fire = cards.find(c => c.fire_test)?.fire_test || null;
    out.push({ name:t.name, pass:
      map['slip_on.machine_grooved']===t.expect['slip_on.machine_grooved'] &&
      map['slip_on.grip']===t.expect['slip_on.grip'] &&
      map['slip_on.slip']===t.expect['slip_on.slip'] &&
      JSON.stringify(notes)===JSON.stringify(t.expect.notes) &&
      (!!fire) === (!!t.expect.fire_test)
    , got:{ map, notes, fire }, expect:t.expect });
  }
  console.table(out.map(x=>({name:x.name, pass:x.pass})));
  return out;
}

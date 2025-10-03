import dataset from '../data/lr_ships_mech_joints.js';

const GROUP_KEYS = ['pipe_unions', 'compression_couplings', 'slip_on_joints'];

const NOTE_CONDITIONS = new Set([1, 2, 3, 4, 5, 6]);

const JOINT_TO_RULE = {
  pipe_union_welded_brazed: { group: 'pipe_unions', ruleId: 'welded_brazed' },
  compression_swage: { group: 'compression_couplings', ruleId: 'swage' },
  compression_press: { group: 'compression_couplings', ruleId: 'press' },
  compression_typical: { group: 'compression_couplings', ruleId: 'typical' },
  compression_bite: { group: 'compression_couplings', ruleId: 'bite' },
  compression_flared: { group: 'compression_couplings', ruleId: 'flared' },
  slip_machine_grooved: { group: 'slip_on_joints', ruleId: 'machine_grooved' },
  slip_grip: { group: 'slip_on_joints', ruleId: 'grip' },
  slip_slip: { group: 'slip_on_joints', ruleId: 'slip_type' },
};

function findSystem(systemId, data) {
  if (!systemId) return null;
  return data.systemsById?.[systemId] || data.systems?.find((item) => item.id === systemId) || null;
}

function cloneDetail() {
  return {
    status: 'allowed',
    conditions: [],
    reasons: [],
    notesApplied: [],
    clauses: [],
    trace: [],
  };
}

function addClause(detail, clauseId, data) {
  if (!clauseId) return;
  const title = data.clauses?.[clauseId];
  detail.clauses.push({ section: clauseId, title: title || clauseId });
}

export function evaluateGroups(input, data = dataset) {
  const result = {};
  const system = findSystem(input.systemId, data);

  for (const groupId of GROUP_KEYS) {
    const detail = cloneDetail();

    if (!system) {
      detail.status = 'forbidden';
      detail.reasons.push('Sistema no encontrado en la tabla base.');
      result[groupId] = detail;
      continue;
    }

    const allowed = Boolean(system.allowedJoints?.[groupId]);
    if (!allowed) {
      detail.status = 'forbidden';
      detail.reasons.push('Tabla base: “−” para este grupo de juntas.');
      detail.trace.push('Tabla 12.2.8: grupo no permitido.');
      result[groupId] = detail;
      continue;
    }

    detail.trace.push('Tabla 12.2.8: grupo permitido en la fila seleccionada.');
    const conditionalNotes = (system.notes || []).filter((note) => NOTE_CONDITIONS.has(note));
    for (const noteId of conditionalNotes) {
      detail.status = detail.status === 'allowed' ? 'conditional' : detail.status;
      const noteText = data.notes?.[noteId];
      if (noteText) {
        detail.conditions.push(noteText);
      }
      detail.notesApplied.push(noteId);
    }

    result[groupId] = detail;
  }

  return result;
}

export default function evaluateLRShips(input, data = dataset) {
  const detail = cloneDetail();
  const { joint } = input || {};
  const system = findSystem(input?.systemId, data);

  if (!joint) {
    detail.status = 'forbidden';
    detail.reasons.push('No se especificó el subtipo de junta.');
    return detail;
  }

  const config = JOINT_TO_RULE[joint];
  if (!config) {
    detail.status = 'forbidden';
    detail.reasons.push('Subtipo de junta no reconocido.');
    return detail;
  }

  if (!system) {
    detail.status = 'forbidden';
    detail.reasons.push('Sistema no encontrado en la tabla base.');
    return detail;
  }

  const allowed = Boolean(system.allowedJoints?.[config.group]);
  if (!allowed) {
    detail.status = 'forbidden';
    detail.reasons.push('Tabla base: “−” para este grupo de juntas.');
    detail.trace.push('Tabla 12.2.8: grupo no permitido.');
    return detail;
  }

  const ruleList = data.subtypes?.[config.group] || [];
  const rule = ruleList.find((item) => item.id === config.ruleId) || null;
  if (!rule) {
    detail.status = 'forbidden';
    detail.reasons.push('No se encontró la regla de subtipo correspondiente.');
    return detail;
  }

  const pipeClass = (input.pipeClass || input.manualClass || 'II').toString().trim().toUpperCase();
  const od = Number.isFinite(input.od_mm) ? input.od_mm : Number(input.od_mm || 0);
  detail.trace.push(`Clase evaluada: ${pipeClass}.`);

  if (!rule.classes.includes(pipeClass)) {
    detail.status = 'forbidden';
    detail.reasons.push(`Tabla 12.2.9: Clase ${pipeClass} no aplicable a ${rule.name}.`);
    detail.trace.push('Clase fuera de los valores aceptados.');
    return detail;
  }

  const limit = rule.od_max_mm?.[pipeClass];
  if (typeof limit === 'number' && Number.isFinite(od) && od > limit) {
    detail.status = 'forbidden';
    detail.reasons.push(`Tabla 12.2.9: OD ${od.toFixed(1)} mm excede ${limit} mm para la clase ${pipeClass}.`);
    detail.trace.push('Diámetro exterior supera el límite permitido.');
    return detail;
  }

  // Condiciones por ubicación/aplicación específicas para Slip-on.
  if (config.group === 'slip_on_joints') {
    const clause208 = '2.12.8';
    if (['cargo_hold', 'tank'].includes(input.space) || input.accessibility === 'not_easy') {
      detail.status = 'forbidden';
      detail.reasons.push(data.clauses?.[clause208] || 'Slip-on no permitidas en bodegas, tanques o espacios no accesibles.');
      addClause(detail, clause208, data);
      detail.trace.push('Restricción de ubicación aplicada (2.12.8).');
      return detail;
    }

    if (input.asMainMeans) {
      const clause209 = '2.12.9';
      detail.status = 'forbidden';
      detail.reasons.push(data.clauses?.[clause209] || 'Slip-type no puede utilizarse como medio principal de unión.');
      addClause(detail, clause209, data);
      detail.trace.push('Restricción por uso como medio principal (2.12.9).');
      return detail;
    }

    if (system.id === 'steam' && input.space === 'open_deck') {
      const clause210 = '2.12.10';
      if ((input.designPressure_bar ?? 0) <= 10) {
        detail.status = 'conditional';
        detail.conditions.push(data.clauses?.[clause210] || 'Slip-on restringidos en líneas de vapor ≤1 MPa en cubierta expuesta.');
        addClause(detail, clause210, data);
        detail.trace.push('Condición de presión aplicada para vapor en cubierta.');
      } else {
        detail.status = 'forbidden';
        detail.reasons.push(data.clauses?.[clause210] || 'Condiciones de vapor en cubierta no cumplen los requisitos.');
        addClause(detail, clause210, data);
        detail.trace.push('Condición de vapor en cubierta incumplida.');
        return detail;
      }
    }
  }

  detail.trace.push('Clase/OD válidos para el subtipo evaluado.');
  detail.notesApplied = [...(system.notes || [])];
  return detail;
}

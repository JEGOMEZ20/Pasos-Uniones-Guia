import lrShipsDataset from './dist/data/lr_ships_mech_joints.js';
import lrNavalDataset from './dist/data/lr_naval_ships_mech_joints.js';
import evaluateLRShips, { evaluateGroups as evaluateLRShipsGroups } from './dist/engine/lrShips.js';
import evaluateLRNavalShips, { evaluateGroups as evaluateLRNavalGroups } from './dist/engine/evaluateLRNavalShips.js';

function pushUnique(list, value) {
  if (!value) return;
  if (!list.includes(value)) {
    list.push(value);
  }
}

function pushAllUnique(list, values = []) {
  for (const value of values) {
    pushUnique(list, value);
  }
}

class BaseRegulationEngine {
  constructor(rule, dataset, evaluators) {
    this.rule = rule;
    this.dataset = dataset;
    this.evaluateSubType = evaluators.evaluateSubType;
    this.evaluateGroups = evaluators.evaluateGroups;
  }

  static use(rule) {
    return new this(rule);
  }

  initContext(input) {
    const dataset = this.dataset;
    const system = dataset.systemsById?.[input.systemId] || dataset.systems?.find((item) => item.id === input.systemId) || null;
    const selectedClass = (input.manualClass || input.clazz || input.pipeClass || 'II').toString().trim().toUpperCase();

    return {
      systemId: input.systemId,
      system,
      dataset,
      pipeClass: selectedClass,
      usedClass: `Class ${selectedClass}`,
      odMM: input.odMM ?? null,
      designPressureBar: input.designPressureBar ?? null,
      designTemperatureC: input.designTemperatureC ?? null,
      space: input.space ?? null,
      accessibility: input.accessibility ?? 'easy',
      asMainMeans: Boolean(input.asMainMeans),
      evaluation: {
        allowed: { pipeUnions: true, compression: true, slipOn: true },
        details: {},
        systemNotes: [],
        conditions: [],
        reasons: [],
        observations: [],
        notesApplied: [],
        clauses: [],
      },
    };
  }

  baseFromSystemRow(context) {
    const { system, evaluation } = context;
    if (!system) {
      evaluation.allowed = { pipeUnions: false, compression: false, slipOn: false };
      evaluation.reasons.push('Sistema no encontrado en el dataset.');
      return;
    }

    evaluation.system = system;
    evaluation.pipeSystemClass = system.pipeSystemClass;
    evaluation.fireTest = system.fireTest;
    evaluation.allowed = {
      pipeUnions: Boolean(system.allowedJoints?.pipe_unions),
      compression: Boolean(system.allowedJoints?.compression_couplings),
      slipOn: Boolean(system.allowedJoints?.slip_on_joints),
    };

    evaluation.systemNotes = (system.notes || []).map((noteId) => {
      const text = this.dataset.notes?.[noteId];
      return text ? `Nota ${noteId}: ${text}` : `Nota ${noteId}`;
    });
  }

  applyLocationConstraints(context) {
    const { system, evaluation } = context;
    if (!system) return;
    if (!system.allowedJoints?.slip_on_joints) {
      pushUnique(evaluation.reasons, 'La fila seleccionada marca “−” para juntas Slip-on.');
    }
  }

  applyClassAndODLimits(context) {
    const { evaluation } = context;
    const baseInput = {
      systemId: context.system?.id,
      pipeClass: context.pipeClass,
      od_mm: context.odMM,
      space: context.space,
      accessibility: context.accessibility,
      asMainMeans: context.asMainMeans,
      designPressure_bar: context.designPressureBar,
    };

    const pipeUnionRes = this.evaluateSubType({ ...baseInput, joint: 'pipe_union_welded_brazed' }, this.dataset);
    evaluation.details.pipeUnionsRule = {
      id: 'pipe_union_welded_brazed',
      status: pipeUnionRes.status,
      reason: pipeUnionRes.reasons?.[0] || null,
    };
    if (pipeUnionRes.status === 'forbidden') {
      evaluation.allowed.pipeUnions = false;
      pushAllUnique(evaluation.reasons, pipeUnionRes.reasons);
    }

    const compressionSubs = {};
    const compressionMap = {
      swage: 'compression_swage',
      press: 'compression_press',
      typical: 'compression_typical',
      bite: 'compression_bite',
      flared: 'compression_flared',
    };
    for (const [key, joint] of Object.entries(compressionMap)) {
      const res = this.evaluateSubType({ ...baseInput, joint }, this.dataset);
      compressionSubs[key] = res.status !== 'forbidden';
      if (res.status === 'forbidden') {
        pushAllUnique(evaluation.reasons, res.reasons);
      }
      if (res.status === 'conditional') {
        pushAllUnique(evaluation.conditions, res.conditions);
      }
    }
    evaluation.details.compressionSubs = compressionSubs;

    const slipSubs = {};
    const slipMap = {
      machine_grooved: 'slip_machine_grooved',
      grip: 'slip_grip',
      slip: 'slip_slip',
    };
    for (const [key, joint] of Object.entries(slipMap)) {
      const res = this.evaluateSubType({ ...baseInput, joint }, this.dataset);
      slipSubs[key] = res.status !== 'forbidden';
      if (res.status === 'forbidden') {
        evaluation.allowed.slipOn = false;
        pushAllUnique(evaluation.reasons, res.reasons);
      }
      if (res.status === 'conditional') {
        pushAllUnique(evaluation.conditions, res.conditions);
      }
    }
    evaluation.details.slipOnSubs = slipSubs;
  }

  applyGlobalConstraints(context) {
    const { evaluation } = context;
    const groupsResult = this.evaluateGroups(
      {
        systemId: context.system?.id,
        pipeClass: context.pipeClass,
        od_mm: context.odMM,
        space: context.space,
        accessibility: context.accessibility,
        asMainMeans: context.asMainMeans,
        designPressure_bar: context.designPressureBar,
      },
      this.dataset,
    );

    const mapKeys = {
      pipeUnions: 'pipe_unions',
      compression: 'compression_couplings',
      slipOn: 'slip_on_joints',
    };

    for (const [key, groupKey] of Object.entries(mapKeys)) {
      const detail = groupsResult[groupKey];
      if (!detail) continue;
      if (detail.status === 'forbidden') {
        evaluation.allowed[key] = false;
        pushAllUnique(evaluation.reasons, detail.reasons);
      }
      if (detail.status === 'conditional') {
        pushAllUnique(evaluation.conditions, detail.conditions);
      }
      pushAllUnique(evaluation.notesApplied, detail.notesApplied);
      for (const clause of detail.clauses || []) {
        if (!evaluation.clauses.some((item) => item.section === clause.section)) {
          evaluation.clauses.push(clause);
        }
      }
    }
  }

  collectSystemNotes(context) {
    // Already handled in baseFromSystemRow.
  }

  collectObservations(context) {
    const { evaluation } = context;
    const merged = new Set([
      ...(evaluation.reasons || []),
      ...(evaluation.conditions || []),
    ].filter(Boolean));
    evaluation.observations = Array.from(merged);
    evaluation.reasons = Array.from(new Set((evaluation.reasons || []).filter(Boolean)));
    evaluation.conditions = Array.from(new Set((evaluation.conditions || []).filter(Boolean)));
    evaluation.notesApplied = Array.from(new Set(evaluation.notesApplied || []));
  }

  finalize(context) {
    const { evaluation } = context;
    return {
      ruleId: this.rule.id,
      system: context.system || null,
      pipeSystemClass: evaluation.pipeSystemClass || context.system?.pipeSystemClass || null,
      fireTest: evaluation.fireTest || context.system?.fireTest || null,
      usedClass: context.usedClass,
      odMM: context.odMM,
      designPressureBar: context.designPressureBar,
      designTemperatureC: context.designTemperatureC,
      space: context.space,
      allowed: {
        pipeUnions: Boolean(evaluation.allowed.pipeUnions),
        compression: Boolean(evaluation.allowed.compression),
        slipOn: Boolean(evaluation.allowed.slipOn),
      },
      details: {
        pipeUnionsRule: evaluation.details.pipeUnionsRule,
        compressionSubs: evaluation.details.compressionSubs,
        slipOnSubs: evaluation.details.slipOnSubs,
      },
      conditions: evaluation.conditions || [],
      reasons: evaluation.reasons || [],
      observations: evaluation.observations || [],
      systemNotes: evaluation.systemNotes || [],
      notesApplied: evaluation.notesApplied || [],
      clauses: evaluation.clauses || [],
    };
  }
}

class LRShipsEngine extends BaseRegulationEngine {
  constructor(rule) {
    super(rule, lrShipsDataset, {
      evaluateSubType: evaluateLRShips,
      evaluateGroups: evaluateLRShipsGroups,
    });
  }
}

class LRNavalEngine extends BaseRegulationEngine {
  constructor(rule) {
    super(rule, lrNavalDataset, {
      evaluateSubType: evaluateLRNavalShips,
      evaluateGroups: evaluateLRNavalGroups,
    });
  }
}

export const RegulationEngines = {
  ships: LRShipsEngine,
  naval: LRNavalEngine,
};

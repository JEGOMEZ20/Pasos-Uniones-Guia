import lrShipsDataset from '../dist/data/lr_ships_mech_joints.js';
import lrNavalDataset from '../dist/data/lr_naval_ships_mech_joints.js';

function buildSystems(dataset) {
  return dataset.systems.map((system) => ({
    id: system.id,
    group: system.group,
    pipeSystemClass: system.pipeSystemClass,
    fireTest: system.fireTest,
    notes: [...(system.notes || [])],
  }));
}

export const RULESETS = {
  ships: {
    id: 'ships',
    title: 'LR · Buques mercantes',
    subtitle: 'Tabla 12.2.8 / 12.2.9 — Juntas Grip-Type / Slip-on',
    SYSTEMS: buildSystems(lrShipsDataset),
    LR_REQUIREMENTS_ES: lrShipsDataset.requirements,
    dataset: lrShipsDataset,
  },
  naval: {
    id: 'naval',
    title: 'LR · Buques navales',
    subtitle: 'Tabla 1.5.3 / 1.5.4 — Juntas Grip-Type / Slip-on',
    SYSTEMS: buildSystems(lrNavalDataset),
    LR_REQUIREMENTS_ES: lrNavalDataset.requirements,
    dataset: lrNavalDataset,
  },
};

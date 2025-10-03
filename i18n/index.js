import lrShipsDataset from '../dist/data/lr_ships_mech_joints.js';
import lrNavalDataset from '../dist/data/lr_naval_ships_mech_joints.js';

const CONDITION_LABELS = {
  dry: 'Sistema seco',
  wet: 'Sistema húmedo',
  'dry/wet': 'Sistema seco / húmedo',
  '-': 'No aplica',
};

const FIRE_TEST_LABELS = {
  '30min_dry': 'Ensayo de fuego 30 min (seco)',
  '30min_wet': 'Ensayo de fuego 30 min (húmedo)',
  '8+22': 'Ensayo 8 min seco + 22 min húmedo',
  not_required: 'Ensayo de fuego no requerido',
};

function buildGroupLabels(dataset) {
  const dict = {};
  for (const [key, value] of Object.entries(dataset.groups || {})) {
    dict[key] = value.label_es || key;
  }
  return dict;
}

function buildSystemLabels(dataset) {
  const dict = {};
  for (const system of dataset.systems || []) {
    dict[system.id] = system.label_es || system.id;
  }
  return dict;
}

export const I18N = {
  ships: {
    groups: buildGroupLabels(lrShipsDataset),
    systems: buildSystemLabels(lrShipsDataset),
    conditions: CONDITION_LABELS,
    fireTest: FIRE_TEST_LABELS,
  },
  naval: {
    groups: buildGroupLabels(lrNavalDataset),
    systems: buildSystemLabels(lrNavalDataset),
    conditions: CONDITION_LABELS,
    fireTest: FIRE_TEST_LABELS,
  },
};

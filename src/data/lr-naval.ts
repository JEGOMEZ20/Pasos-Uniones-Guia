import { Dataset, JointKey } from '../core/types';

const JOINT_TYPES = [
  { key:'pipe_union_welded_brazed', group:'Pipe unions', label:'Unión roscada soldada / soldadura fuerte' },
  { key:'comp_swage', group:'Compression couplings', label:'Acoplamiento de compresión tipo swage' },
  { key:'comp_bite', group:'Compression couplings', label:'Acoplamiento de compresión tipo bite' },
  { key:'comp_typical', group:'Compression couplings', label:'Acoplamiento de compresión típico' },
  { key:'comp_flared', group:'Compression couplings', label:'Acoplamiento de compresión tipo flare' },
  { key:'comp_press', group:'Compression couplings', label:'Acoplamiento de compresión tipo press' },
  { key:'slip_mgrooved', group:'Slip-on joints', label:'Slip-on ranurado a máquina' },
  { key:'slip_grip', group:'Slip-on joints', label:'Slip-on tipo grip' },
  { key:'slip_type', group:'Slip-on joints', label:'Slip-on tipo slip' },
];

const SPACES = [
  { key:'mach_cat_a', label:'Espacio de máquinas Cat. A' },
  { key:'other_mach_service', label:'Otros espacios de máquinas / servicio' },
  { key:'accommodation', label:'Acomodaciones' },
  { key:'open_deck', label:'Cubierta abierta' },
  { key:'cargo_hold', label:'Bodega / espacio de carga' },
  { key:'inside_tank', label:'Dentro de tanque' },
  { key:'munitions', label:'Pañoles de municiones' },
];

const NOTES = {
  n1: { id:'1', es:'Las juntas deben ser de tipo resistente al fuego en espacios de máquinas Cat. A. En bilge main: acero, CuNi o equivalente.', en:'Mechanical joints are to be of fire-resistant type within Category A machinery spaces. Bilge main joints to be steel, CuNi or equivalent.' },
  n2: { id:'2', es:'Slip-on no aceptados en espacios Cat. A, acomodaciones ni pañoles de munición. Permitidos en otros espacios de máquinas/servicio si visibles y accesibles.', en:'Slip-on joints not accepted in Category A machinery spaces, accommodation spaces, or munition stores. Accepted in other machinery/service spaces when visible and accessible.' },
  n3: { id:'3', es:'Tipo resistente al fuego excepto en cubiertas abiertas con poco o nulo riesgo de fuego.', en:'Fire-resistant type except on open decks with little or no fire risk.' },
  n4: { id:'4', es:'Requisito adicional: juntas de tipo resistente al fuego según la fila correspondiente.', en:'Additional requirement: fire-resistant type of joints as defined by the service row.' },
  n5: { id:'5', es:'Ver referencias adicionales de vapor / expansión axial.', en:'See additional steam / axial expansion references.' },
  n6: { id:'6', es:'Sólo por encima del límite de estanqueidad.', en:'Only above the limit of watertight integrity.' },
  n7: { id:'7', es:'HVAC y tomas/descargas de turbinas de gas se abordan en sus secciones respectivas.', en:'HVAC trunking and gas turbine uptakes/intakes are addressed in their respective sections.' },
  n9: { id:'9', es:'Slip-on generalmente no en bodegas, tanques u otros espacios no fácilmente accesibles. Dentro de tanques sólo si el medio coincide.', en:'Slip-on joints generally not to be used in cargo holds, tanks or spaces not easily accessible. Inside tanks only where the medium matches the tank contents.' },
  n10:{ id:'10',es:'Slip type como medio principal sólo para compensar deformación axial (p.ej., restrained slip-on).', en:'Slip type slip-on joints as the main means only when compensating axial deformation (e.g., restrained slip-on).' },
};

const GENERAL = {
  g1: { id:'Gen-1', es:'Slip-on generalmente no se usan en bodegas, tanques y espacios poco accesibles; dentro de tanques sólo si el medio coincide.', en:'Slip-on joints are generally not used in cargo holds, tanks or spaces not easily accessible; inside tanks only when the medium matches.' },
  g2: { id:'Gen-2', es:'Slip type como unión principal sólo para compensar deformación axial.', en:'Slip type slip-on joints may be the main means only when compensating axial deformation.' },
};

const JOINT_KEY_MAP: Record<string, JointKey> = {
  pipe_union: 'pipe_union_welded_brazed',
  'pipe_unions.welded_brazed': 'pipe_union_welded_brazed',
  compression: 'comp_typical',
  'compression.swage': 'comp_swage',
  'compression.bite': 'comp_bite',
  'compression.typical_compression': 'comp_typical',
  'compression.flared': 'comp_flared',
  'compression.press': 'comp_press',
  'slip_on.machine_grooved': 'slip_mgrooved',
  'slip_on.grip': 'slip_grip',
  'slip_on.slip': 'slip_type',
};

const JOINT_KEYS: JointKey[] = [
  'pipe_union_welded_brazed',
  'comp_swage',
  'comp_bite',
  'comp_typical',
  'comp_flared',
  'comp_press',
  'slip_mgrooved',
  'slip_grip',
  'slip_type',
];

function allowFrom(keys: string[]): Record<JointKey, boolean> {
  const allow = Object.fromEntries(JOINT_KEYS.map(k => [k, false])) as Record<JointKey, boolean>;
  for (const key of keys) {
    const mapped = JOINT_KEY_MAP[key];
    if (mapped) allow[mapped] = true;
  }
  return allow;
}

const CLASS_RULES = {
  pipe_union_welded_brazed: {
    I:   { allowed: true, odLE: 60.3 },
    II:  { allowed: true, odLE: 60.3 },
    III: { allowed: true },
  },
  comp_swage: {
    I:   { allowed: false },
    II:  { allowed: false },
    III: { allowed: true },
  },
  comp_bite: {
    I:   { allowed: true, odLE: 60.3 },
    II:  { allowed: true, odLE: 60.3 },
    III: { allowed: true },
  },
  comp_typical: {
    I:   { allowed: true, odLE: 60.3 },
    II:  { allowed: true, odLE: 60.3 },
    III: { allowed: true },
  },
  comp_flared: {
    I:   { allowed: true, odLE: 60.3 },
    II:  { allowed: true, odLE: 60.3 },
    III: { allowed: true },
  },
  comp_press: {
    I:   { allowed: false },
    II:  { allowed: false },
    III: { allowed: true },
  },
  slip_mgrooved: {
    I:   { allowed: true },
    II:  { allowed: true },
    III: { allowed: true },
  },
  slip_grip: {
    I:   { allowed: false },
    II:  { allowed: true },
    III: { allowed: true },
  },
  slip_type: {
    I:   { allowed: false },
    II:  { allowed: true },
    III: { allowed: true },
  },
};

const SYSTEM_GROUPS = [
  {
    key:'flamm_lt60',
    label:'Fluidos inflamables (fp < 60°C)',
    systems:[
      {
        key:'cargo_oil_lt60',
        label:'Cargo oil lines (fp < 60°C)',
        allow: allowFrom(['pipe_union','compression','slip_on.machine_grooved','slip_on.grip','slip_on.slip']),
        notes:[],
        fire:'30 min dry',
      },
    ],
  },
  {
    key:'inert_gas',
    label:'Gas inerte',
    systems:[
      {
        key:'inert_main_lines',
        label:'Líneas principales',
        allow: allowFrom(['pipe_union','compression','slip_on.machine_grooved','slip_on.grip','slip_on.slip']),
        notes:[],
        fire:'30 min dry',
      },
    ],
  },
  {
    key:'machinery',
    label:'Maquinaria del buque',
    systems:[
      {
        key:'fuel_oil_lines',
        label:'Fuel oil lines',
        allow: allowFrom(['pipe_union','compression','slip_on.machine_grooved','slip_on.grip','slip_on.slip']),
        notes:['n2','n3'],
        fire:'30 min wet',
      },
    ],
  },
  {
    key:'sanitary',
    label:'Sanitarios / drenajes',
    systems:[
      {
        key:'deck_drains_internal',
        label:'Drenajes de cubierta (internos)',
        allow: allowFrom(['pipe_union','compression','slip_on.machine_grooved']),
        notes:['n6'],
        fire:'No requerido',
      },
    ],
  },
];

export const datasetNaval: Dataset = {
  id: 'naval',
  title: 'LR Naval',
  JOINT_TYPES,
  SPACES,
  NOTES,
  GENERAL,
  CLASS_RULES,
  SYSTEM_GROUPS,
  EXTRA: {
    n2_forbiddenSpaces: ['mach_cat_a','accommodation','munitions'],
    n2_visibleOnlySpaces: ['other_mach_service'],
  },
};

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

const allTrue = (): Record<JointKey, boolean> => (
  Object.fromEntries(JOINT_KEYS.map(k => [k, true])) as Record<JointKey, boolean>
);

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
    key: 'flamm_lt60',
    label: 'Fluidos inflamables (fp < 60°C)',
    systems: [
      {
        key: 'veh_aircraft_fuel_lt60',
        label: 'Líneas de combustible (vehículos / aeronaves)',
        allow: allTrue(),
        notes: ['n2', 'n4'],
        fire: '30 min dry',
      },
      {
        key: 'vent_lt60',
        label: 'Líneas de venteo',
        allow: allTrue(),
        notes: ['n3'],
        fire: '30 min dry',
      },
    ],
  },
  {
    key: 'flamm_gt60',
    label: 'Fluidos inflamables (fp > 60°C)',
    systems: [
      {
        key: 'veh_aircraft_fuel_gt60',
        label: 'Líneas de combustible (vehículos / aeronaves)',
        allow: allTrue(),
        notes: ['n2', 'n4'],
        fire: '30 min dry',
      },
      {
        key: 'machinery_fuel',
        label: 'Líneas de combustible – maquinaria de a bordo',
        allow: allTrue(),
        notes: ['n2', 'n3'],
        fire: '30 min wet',
      },
      {
        key: 'lube_oil',
        label: 'Líneas de aceite lubricante',
        allow: allTrue(),
        notes: ['n2', 'n3'],
        fire: '30 min wet',
      },
      {
        key: 'hydraulic_oil',
        label: 'Aceite hidráulico',
        allow: allTrue(),
        notes: ['n2', 'n3'],
        fire: '30 min wet',
      },
    ],
  },
  {
    key: 'seawater',
    label: 'Agua de mar',
    systems: [
      {
        key: 'bilge',
        label: 'Líneas de achique (bilge)',
        allow: allTrue(),
        notes: ['n1'],
        fire: '8 dry + 22 wet',
      },
      {
        key: 'hp_seawater',
        label: 'Agua de mar HP / spray (no llenado permanente)',
        allow: allTrue(),
        notes: [],
        fire: '8 dry + 22 wet',
      },
      {
        key: 'fire_perm',
        label: 'Contra-incendios (llenado permanente)',
        allow: allTrue(),
        notes: ['n3'],
        fire: '30 min wet',
      },
      {
        key: 'fire_nonperm',
        label: 'Contra-incendios (no permanente) / espuma / drencher',
        allow: allTrue(),
        notes: ['n3'],
        fire: '8 dry + 22 wet',
      },
      {
        key: 'ballast',
        label: 'Lastre',
        allow: allTrue(),
        notes: ['n1'],
        fire: '8 dry + 22 wet',
      },
      {
        key: 'cooling_sw',
        label: 'Refrigeración – agua de mar',
        allow: allTrue(),
        notes: ['n1'],
        fire: '8 dry + 22 wet',
      },
      {
        key: 'tank_cleaning_services',
        label: 'Servicios de limpieza de tanques',
        allow: allTrue(),
        notes: [],
        fire: 'Fire endurance test not required',
      },
      {
        key: 'non_essential_systems',
        label: 'Sistemas no esenciales',
        allow: allTrue(),
        notes: [],
        fire: 'Fire endurance test not required',
      },
    ],
  },
  {
    key: 'freshwater',
    label: 'Agua dulce',
    systems: [
      {
        key: 'cooling_fw',
        label: 'Refrigeración – agua dulce',
        allow: allTrue(),
        notes: ['n1'],
        fire: '(no aplica)',
      },
      {
        key: 'chilled',
        label: 'Agua helada (chilled)',
        allow: allTrue(),
        notes: ['n1'],
        fire: '30 min wet',
      },
      {
        key: 'cond_return',
        label: 'Retorno de condensado',
        allow: allTrue(),
        notes: ['n1'],
        fire: '(dry)',
      },
      {
        key: 'demin',
        label: 'Agua tratada / desmineralizada',
        allow: allTrue(),
        notes: [],
        fire: '(wet)',
      },
      {
        key: 'ancillary',
        label: 'Sistemas auxiliares (FW)',
        allow: allTrue(),
        notes: [],
        fire: '(dry)',
      },
    ],
  },
  {
    key: 'sanitary',
    label: 'Sanitarios / drenajes / escuppers',
    systems: [
      {
        key: 'deck_drains_internal',
        label: 'Drenajes de cubierta (internos)',
        allow: allTrue(),
        notes: ['n6'],
        fire: '(no aplica)',
      },
      {
        key: 'sanitary_drains',
        label: 'Drenajes sanitarios',
        allow: allTrue(),
        notes: [],
        fire: '(dry)',
      },
      {
        key: 'scuppers_overboard',
        label: 'Scuppers y descarga (sobre costado)',
        allow: { ...allTrue(), slip_mgrooved: false, slip_grip: false, slip_type: false },
        notes: [],
        fire: '(dry)',
      },
    ],
  },
  {
    key: 'sounding_vent',
    label: 'Sondajes / venteos',
    systems: [
      {
        key: 'water_tanks_dry_spaces',
        label: 'Tanques de agua / espacios secos',
        allow: allTrue(),
        notes: [],
        fire: 'Fire endurance test not required',
      },
      {
        key: 'oil_tanks_fp_gt60',
        label: 'Tanques de aceite (fp > 60°C)',
        allow: allTrue(),
        notes: ['n2', 'n3'],
        fire: 'Fire endurance test not required',
      },
    ],
  },
  {
    key: 'misc',
    label: 'Misceláneos / gases / vapor',
    systems: [
      {
        key: 'air_hp',
        label: 'Aire alta presión (HP)',
        allow: allTrue(),
        notes: ['n1'],
        fire: '30 min dry',
      },
      {
        key: 'air_mp',
        label: 'Aire media presión (MP)',
        allow: allTrue(),
        notes: ['n1'],
        fire: '30 min dry',
      },
      {
        key: 'air_lp',
        label: 'Aire baja presión (LP)',
        allow: allTrue(),
        notes: ['n1'],
        fire: '(no aplica)',
      },
      {
        key: 'service_air',
        label: 'Aire de servicio (no esencial)',
        allow: allTrue(),
        notes: [],
        fire: '(no aplica)',
      },
      {
        key: 'brine',
        label: 'Salmuera (brine)',
        allow: allTrue(),
        notes: [],
        fire: '(wet)',
      },
      {
        key: 'co2_outside',
        label: 'CO₂ (fuera del espacio protegido)',
        allow: { ...allTrue(), slip_mgrooved: false, slip_grip: false, slip_type: false },
        notes: ['n1'],
        fire: '30 min dry',
      },
      {
        key: 'co2_inside',
        label: 'CO₂ (dentro del espacio protegido)',
        allow: { ...allTrue(), slip_mgrooved: false, slip_grip: false, slip_type: false },
        notes: [],
        fire: '(dry)',
      },
      {
        key: 'steam',
        label: 'Vapor',
        allow: {
          pipe_union_welded_brazed: true,
          comp_swage: true,
          comp_bite: true,
          comp_typical: true,
          comp_flared: true,
          comp_press: true,
          slip_mgrooved: false,
          slip_grip: false,
          slip_type: true,
        },
        notes: ['n5'],
        fire: '(no aplica)',
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

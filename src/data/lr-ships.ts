import { Dataset, JointKey } from '../core/types';

const JOINT_TYPES = [
  { key:'pipe_union_welded_brazed', group:'Pipe unions', label:'Unión roscada soldada/soldadura fuerte' },
  { key:'comp_swage', group:'Compression couplings', label:'Compresión tipo swage' },
  { key:'comp_bite', group:'Compression couplings', label:'Compresión tipo bite' },
  { key:'comp_typical', group:'Compression couplings', label:'Compresión típica' },
  { key:'comp_flared', group:'Compression couplings', label:'Compresión tipo flare' },
  { key:'comp_press', group:'Compression couplings', label:'Compresión tipo press' },
  { key:'slip_mgrooved', group:'Slip-on joints', label:'Slip-on ranurado a máquina' },
  { key:'slip_grip', group:'Slip-on joints', label:'Slip-on tipo grip' },
  { key:'slip_type', group:'Slip-on joints', label:'Slip-on tipo slip' },
];

const SPACES = [
  { key:'mach_cat_a', label:'Espacio de máquinas Cat. A' },
  { key:'accommodation', label:'Acomodaciones' },
  { key:'other_mach_service', label:'Otros esp. de máquinas/servicio' },
  { key:'open_deck', label:'Cubierta abierta' },
  { key:'cargo_hold', label:'Bodega de carga' },
  { key:'inside_tank', label:'Dentro de tanque' },
];

const NOTES = {
  n1: { id:'1', es:'(Ships) Ensayo de resistencia al fuego según fila (p.ej., 30 min dry, ver especificación).', en:'(Ships) Fire endurance test per row (e.g., 30 min dry, see spec).' },
  n2: { id:'2', es:'(Ships) Slip-on no aceptado en Cat. A ni en acomodaciones. En otros esp. de máquinas/servicio: sólo si visible y accesible.', en:'(Ships) Slip-on joints not accepted inside Category A machinery spaces or accommodation spaces. In other machinery/service spaces only where joints are in easily visible and accessible positions.' },
  n3: { id:'3', es:'(Ships) Requiere tipo resistente al fuego salvo cubierta abierta (riesgo bajo).', en:'(Ships) Fire-resistant type required except on open decks (low/no fire risk).' },
  n4: { id:'4', es:'Ensayo de resistencia al fuego cuando las juntas se instalan en esp. Cat. A.', en:'Fire endurance test required when mechanical joints are installed inside Category A machinery spaces.' },
  n5: { id:'5', es:'Sólo por encima de la cubierta límite de estanqueidad.', en:'Only above the limit of watertight integrity.' },
  n6: { id:'6', es:'Slip type en cubierta para p ≤ 10 bar.', en:'Slip type slip-on joints may be used on deck for design pressure ≤10 bar.' },
  n7: { id:'7', es:'Equivalencias de ensayo: 30 dry cubre 8+22 y 30 wet; 8+22 cubre 30 wet.', en:'Test equivalence: 30 min dry covers 8+22 and 30 min wet; 8+22 covers 30 min wet.' },
  n8: { id:'8', es:'Para vapor: ver Pt5 Ch13 2.7. Slip-on “restrained” ≤1 MPa en weather deck permitido.', en:'For steam see Pt5 Ch13 2.7. Restrained slip-on ≤1 MPa on weather decks permitted.' },
};

const GENERAL = {
  g1: { id:'Gen-1', es:'Slip-on generalmente no en bodegas/tanques; en tanques sólo si el medio coincide.', en:'Slip-on generally not in cargo holds/tanks; inside tanks only if same medium.' },
  g2: { id:'Gen-2', es:'Slip type como medio principal sólo si compensa dilatación axial.', en:'Slip type as main means only if compensating axial deformation.' },
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
    I:   { allowed: true },
    II:  { allowed: true },
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
        key:'crude_oil_washing_lines',
        label:'Crude oil washing lines',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n1'],
        fire:'30 min dry',
      },
      {
        key:'cargo_oil_lines_lt60',
        label:'Líneas de crudo y derivados (fp < 60°C)',
        allow: allowFrom(['pipe_union', 'compression', 'pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n1'],
        fire:'30 min dry',
      },
      {
        key:'vent_lines_lt60',
        label:'Líneas de venteo (fp < 60°C)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n3'],
        fire:'30 min dry',
      },
    ],
  },
  {
    key:'inert_gas',
    label:'Gas inerte',
    systems:[
      {
        key:'inert_distribution_lines',
        label:'Líneas de distribución de gas inerte',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n1'],
        fire:'30 min dry',
      },
      {
        key:'inert_main_lines',
        label:'Líneas principales de gas inerte',
        allow: allowFrom(['pipe_union', 'compression', 'pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n1', 'n2'],
        fire:'30 min dry',
      },
      {
        key:'inert_scrubber_effluent',
        label:'Scrubber effluent lines',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'30 min wet',
      },
      {
        key:'inert_water_seal_effluent',
        label:'Water seal effluent lines',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'30 min wet',
      },
    ],
  },
  {
    key:'flamm_gt60',
    label:'Fluidos inflamables (fp > 60°C)',
    systems:[
      {
        key:'hydraulic_oil_lines',
        label:'Líneas de aceite hidráulico',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n2', 'n3'],
        fire:'Not required',
      },
      {
        key:'lubricating_oil_lines',
        label:'Líneas de aceite lubricante',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n2', 'n3'],
        fire:'Not required',
      },
      {
        key:'thermal_oil_lines',
        label:'Líneas de aceite térmico',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n2', 'n3'],
        fire:'Not required',
      },
      {
        key:'cargo_oil_lines_gt60',
        label:'Líneas de crudo y derivados (fp > 60°C)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n1'],
        fire:'30 min dry',
      },
      {
        key:'fuel_oil_lines',
        label:'Líneas de fuel oil',
        allow: allowFrom(['pipe_union', 'compression', 'pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n2', 'n3', 'n4'],
        fire:'30 min wet',
      },
    ],
  },
  {
    key:'sea_water',
    label:'Agua de mar',
    systems:[
      {
        key:'ballast_system',
        label:'Sistema de lastre',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n4'],
        fire:'30 min wet',
      },
      {
        key:'bilge_lines',
        label:'Líneas de achique (bilge)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n4'],
        fire:'8 min dry + 22 min wet',
      },
      {
        key:'fire_ext_non_perm_filled',
        label:'Extinción por agua (sistemas no permanentemente llenos)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n3'],
        fire:'8 min dry + 22 min wet',
      },
      {
        key:'fire_ext_perm_filled',
        label:'Extinción por agua (sistemas llenos permanentemente)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n3'],
        fire:'30 min wet',
      },
      {
        key:'sea_cooling_water',
        label:'Refrigeración por agua de mar',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n4'],
        fire:'30 min wet',
      },
      {
        key:'sea_non_essential',
        label:'Servicios no esenciales de agua de mar',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
      {
        key:'tank_cleaning_services',
        label:'Servicios de limpieza de tanques',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
    ],
  },
  {
    key:'fresh_water',
    label:'Agua dulce',
    systems:[
      {
        key:'condensate_return',
        label:'Retorno de condensado',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n4'],
        fire:'30 min wet',
      },
      {
        key:'fresh_cooling_water',
        label:'Refrigeración por agua dulce',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n4'],
        fire:'30 min wet',
      },
      {
        key:'fresh_non_essential',
        label:'Servicios no esenciales de agua dulce',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
    ],
  },
  {
    key:'sanitary',
    label:'Sanitarios / drenajes / imbornales',
    systems:[
      {
        key:'deck_drains_internal',
        label:'Drenajes de cubierta (internos)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n5'],
        fire:'Not required',
      },
      {
        key:'sanitary_drains',
        label:'Drenajes sanitarios',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
      {
        key:'scuppers_overboard',
        label:'Imbornales a mar',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press']),
        notes:[],
        fire:'Not required',
      },
    ],
  },
  {
    key:'sounding',
    label:'Aforos / venteos',
    systems:[
      {
        key:'sounding_water_tanks_dry_spaces',
        label:'Aforos de tanques de agua / espacios secos',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
      {
        key:'vent_oil_tanks_gt60',
        label:'Venteos de tanques de aceite (>60°C)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n2', 'n3'],
        fire:'Not required',
      },
    ],
  },
  {
    key:'misc',
    label:'Varios',
    systems:[
      {
        key:'starting_control_air',
        label:'Aire de arranque / control',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press']),
        notes:['n4'],
        fire:'30 min dry',
      },
      {
        key:'service_air_non_essential',
        label:'Aire de servicio (no esencial)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
      {
        key:'co2_inside_protected',
        label:'CO₂ (dentro de espacios protegidos)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press']),
        notes:[],
        fire:'Not required',
      },
      {
        key:'co2_outside_protected',
        label:'CO₂ (fuera de espacios protegidos)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press']),
        notes:[],
        fire:'30 min dry',
      },
      {
        key:'brine',
        label:'Salmuera',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:[],
        fire:'Not required',
      },
      {
        key:'steam_general',
        label:'Vapor (general)',
        allow: allowFrom(['pipe_unions.welded_brazed', 'compression.swage', 'compression.bite', 'compression.typical_compression', 'compression.flared', 'compression.press', 'slip_on.machine_grooved', 'slip_on.grip', 'slip_on.slip']),
        notes:['n8'],
        fire:'Not required',
      },
    ],
  },
];

export const datasetShips: Dataset = {
  id:'ships',
  title:'LR Ships',
  JOINT_TYPES,
  SPACES,
  NOTES,
  GENERAL,
  CLASS_RULES,
  SYSTEM_GROUPS,
  EXTRA: {
    n2_forbiddenSpaces: ['mach_cat_a','accommodation'],
    n2_visibleOnlySpaces: ['other_mach_service'],
  },
};

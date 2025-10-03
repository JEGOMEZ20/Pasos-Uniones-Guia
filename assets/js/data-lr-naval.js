export const PipeClass = { I:"I", II:"II", III:"III" };

/**
 * fire_test: "30min_dry" | "30min_wet" | "8+22" | "not_required"
 * class_of_pipe_system: "dry" | "wet" | "dry/wet" | "-"
 * notes: [1..7] — SOLO las notas que trae la fila
 * allowed_joints: por grupo (no por subtipo)
 */
export const LR_NAVAL_SYSTEMS = [
  // ==== Flammable fluids (fp < 60°C)
  { id:"aircraft_vehicle_fuel_lt60", label:"Fuel aeronaves/vehículos (fp<60°C)",
    group:"ff_lt60", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[2,4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"vent_lines_lt60", label:"Vent lines (fp<60°C)",
    group:"ff_lt60", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // ==== Flammable fluids (fp > 60°C)
  { id:"aircraft_vehicle_fuel_gt60", label:"Fuel aeronaves/vehículos (fp>60°C)",
    group:"ff_gt60", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[2,4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ships_machinery_fuel", label:"Fuel de maquinaria del buque",
    group:"ff_gt60", class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"lube_oil", label:"Aceite lubricante",
    group:"ff_gt60", class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"hydraulic_oil", label:"Aceite hidráulico",
    group:"ff_gt60", class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // ==== Sea water
  { id:"bilge", label:"Líneas de achique",
    group:"sea_water", class_of_pipe_system:"dry/wet", fire_test:"8+22", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"hp_sea_water_spray", label:"Agua de mar a alta presión / water spray (no permanentes)",
    group:"sea_water", class_of_pipe_system:"dry/wet", fire_test:"8+22", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"fire_main_perm", label:"Extinción permanente (fire main/sprinkler)",
    group:"sea_water", class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"fire_main_nonperm", label:"Extinción no permanente (foam/drencher/fire main)",
    group:"sea_water", class_of_pipe_system:"dry/wet", fire_test:"8+22", notes:[3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ballast", label:"Lastre",
    group:"sea_water", class_of_pipe_system:"wet", fire_test:"8+22", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"cooling_sw", label:"Refrigeración (agua de mar)",
    group:"sea_water", class_of_pipe_system:"wet", fire_test:"8+22", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"tank_cleaning", label:"Tank cleaning services",
    group:"sea_water", class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"non_essential_sw", label:"Sistemas no esenciales (mar)",
    group:"sea_water", class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // ==== Fresh water
  { id:"cooling_fw", label:"Refrigeración (agua dulce)",
    group:"fresh_water", class_of_pipe_system:"wet", fire_test:"not_required", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"chilled_water", label:"Chilled water",
    group:"fresh_water", class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"condensate_return", label:"Retorno de condensado",
    group:"fresh_water", class_of_pipe_system:"dry", fire_test:"not_required", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"made_demin_water", label:"Agua fabricada/desmineralizada",
    group:"fresh_water", class_of_pipe_system:"wet", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ancillary_fw", label:"Sistemas auxiliares (agua dulce)",
    group:"fresh_water", class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // ==== Sanitary / drains / scuppers
  { id:"deck_drains_internal", label:"Desagües de cubierta (internos)",
    group:"sanitary", class_of_pipe_system:"dry", fire_test:"not_required", notes:[6],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"sanitary_drains", label:"Sanitary drains",
    group:"sanitary", class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"scuppers_overboard", label:"Scuppers y descarga a mar (overboard)",
    group:"sanitary", class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },

  // ==== Sounding / vent
  { id:"water_tanks_dry_spaces", label:"Sondeos (tanques de agua/espacios secos)",
    group:"sounding", class_of_pipe_system:"dry/wet", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:false, slip_on_joints:false } },
  { id:"oil_tanks_gt60", label:"Sondeos (tanques aceite fp>60°C)",
    group:"sounding", class_of_pipe_system:"dry", fire_test:"not_required", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"intakes_uptakes", label:"Intakes & uptakes",
    group:"sounding", class_of_pipe_system:"dry", fire_test:"not_required", notes:[7],
    allowed_joints:{ pipe_unions:false, compression_couplings:true, slip_on_joints:true } },
  { id:"hvac_trunking", label:"HVAC trunking",
    group:"sounding", class_of_pipe_system:"dry", fire_test:"not_required", notes:[7],
    allowed_joints:{ pipe_unions:false, compression_couplings:false, slip_on_joints:false } },

  // ==== Miscellaneous
  { id:"hp_air", label:"Aire HP",
    group:"misc", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"mp_air", label:"Aire MP",
    group:"misc", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"lp_air", label:"Aire LP",
    group:"misc", class_of_pipe_system:"dry", fire_test:"not_required", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"service_air", label:"Aire de servicio (no esencial)",
    group:"misc", class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"brine", label:"Salmuera",
    group:"misc", class_of_pipe_system:"wet", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"co2_system", label:"CO₂ system",
    group:"misc", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },
  { id:"nitrogen_system", label:"Nitrógeno",
    group:"misc", class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },
  { id:"steam", label:"Vapor",
    group:"misc", class_of_pipe_system:"-", fire_test:"not_required", notes:[5],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } }, // Slip-on condicional por 5.10.11
];

// ===== Tabla 1.5.4 — subtipos NAVAL
export const SUBTYPE_RULES_NAVAL = {
  pipe_unions: [
    { id:"welded_brazed", name:"Soldadas/Brasing", classes:["I","II","III"], od_max_mm:{ I:60.3, II:60.3 } }
  ],
  compression_couplings: [
    { id:"swage",   name:"Swage",   classes:["III"] }, // NAVAL: solo III
    { id:"press",   name:"Press",   classes:["III"] },
    { id:"typical", name:"Típica",  classes:["I","II","III"], od_max_mm:{ I:60.3, II:60.3 } },
    { id:"bite",    name:"Mordedor",classes:["I","II","III"], od_max_mm:{ I:60.3, II:60.3 } },
    { id:"flared",  name:"Abocardado",classes:["I","II","III"], od_max_mm:{ I:60.3, II:60.3 } },
  ],
  slip_on_joints: [
    { id:"machine_grooved", name:"Ranurado/Mecanizado", classes:["I","II","III"] },
    { id:"grip",            name:"Grip",                classes:["II","III"] },
    { id:"slip_type",       name:"Slip",                classes:["II","III"] },
  ],
};

// ===== Notas (tabla 1.5.3)
export const NOTES_NAVAL = {
  1:"En Cat. A: tipo resistente al fuego; ‘bilge main’ en Cat. A: acoples de acero/CuNi o equivalente.",
  2:"Slip-on no en Cat. A, pañoles de munición ni alojamientos; aceptadas en otros espacios de maquinaria/servicio si visibles y accesibles.",
  3:"Tipo resistente al fuego, salvo en cubiertas abiertas con poco o nulo riesgo de fuego (def. SOLAS II-2/9.2.3.3.2.2(10)).",
  4:"Tipo resistente al fuego.",
  5:"Ver 5.10.11 (slip-on restringidos en líneas de vapor ≤10 bar en cubierta expuesta).",
  6:"Solo por encima del límite de integridad estanca.",
  7:"Requisitos de HVAC trunking y ‘intakes/uptakes’ se tratan en sus secciones."
};

// ===== Cláusulas generales (5.10.x)
export const CLAUSES_NAVAL = {
  "5.10.5":"Rotura ≥ 4× presión de diseño (≥200 bar: consideración especial).",
  "5.10.6":"No usar donde un daño cause fuego/inundación (conexión al costado bajo límite de integridad estanca o tanques con fluidos inflamables).",
  "5.10.7":"Capacidad para presión/vacío según aplique.",
  "5.10.8":"Minimizar juntas mecánicas en fluidos inflamables; preferir bridas norma reconocida.",
  "5.10.9":"No slip-on en bodegas/tanques/espacios no fácilmente accesibles; en tanques solo si el medio es el mismo.",
  "5.10.10":"Slip-type no como medio principal (solo compensar deformación axial).",
  "5.10.11":"Slip-on restringidos en vapor ≤10 bar en cubierta expuesta (restrained, expansión).",
  "5.10.12":"Ensayos según LR Type Approval Test Spec No.2."
};

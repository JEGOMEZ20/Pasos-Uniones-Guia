export const PipeClass = { I:"I", II:"II", III:"III" };

// ===== Tabla 12.2.8 (filas por sistema) =====
/**
 * fire_test: "30min_dry" | "30min_wet" | "8+22" | "not_required"
 * class_of_pipe_system: "dry" | "wet" | "dry/wet"
 * notes: [número de nota de la fila; SOLO las de esa fila]
 * allowed_joints.{pipe_unions|compression_couplings|slip_on_joints}: boolean
 */
export const LR_SHIPS_SYSTEMS = [
  // Flammable fluids (fp < 60°C)
  { id:"cargo_oil_lines_lt60", label:"Líneas de carga de hidrocarburos", group:"ff_lt60",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"crude_oil_washing_lt60", label:"Crude oil washing", group:"ff_lt60",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"vents_lt60", label:"Vent lines", group:"ff_lt60",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // Inert gas
  { id:"ig_water_seal", label:"Water seal effluent", group:"inert_gas",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ig_scrubber", label:"Scrubber effluent", group:"inert_gas",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ig_main", label:"Inert gas main", group:"inert_gas",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1,2],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ig_distribution", label:"Inert gas distribution", group:"inert_gas",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // Flammable fluids (fp > 60°C)
  { id:"cargo_oil_lines_gt60", label:"Líneas de carga (fp > 60°C)", group:"ff_gt60",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[1],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"fuel_oil_lines", label:"Fuel oil lines", group:"ff_gt60",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"lube_oil_lines", label:"Lubricating oil", group:"ff_gt60",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"hydraulic_oil", label:"Hydraulic oil", group:"ff_gt60",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"thermal_oil", label:"Thermal oil", group:"ff_gt60",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // Sea water
  { id:"bilge", label:"Líneas de achique", group:"sea_water",
    class_of_pipe_system:"dry/wet", fire_test:"8+22", notes:[4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"fire_main_perm", label:"Sistemas contra incendios permanentes", group:"sea_water",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"fire_main_nonperm", label:"Sistemas contra incendios no permanentes", group:"sea_water",
    class_of_pipe_system:"dry/wet", fire_test:"8+22", notes:[3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"ballast", label:"Lastre", group:"sea_water",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"cooling_sw", label:"Refrigeración agua de mar", group:"sea_water",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"tank_cleaning", label:"Tank cleaning services", group:"sea_water",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"non_essential_sw", label:"Sistemas no esenciales (mar)", group:"sea_water",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // Fresh water
  { id:"cooling_fw", label:"Refrigeración agua dulce", group:"fresh_water",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"condensate_return", label:"Retorno de condensado", group:"fresh_water",
    class_of_pipe_system:"wet", fire_test:"30min_wet", notes:[4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"non_essential_fw", label:"No esenciales (agua dulce)", group:"fresh_water",
    class_of_pipe_system:"wet", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // Sanitary / drains / scuppers
  { id:"deck_drains", label:"Desagües de cubierta (internos)", group:"sanitary",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[5],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"sanitary_drains", label:"Sanitary drains", group:"sanitary",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"scuppers_overboard", label:"Descarga a mar (overboard)", group:"sanitary",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },

  // Sounding / vent
  { id:"sounding_tanks_dry", label:"Sondeos (tanques/espacios secos)", group:"sounding",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"sounding_oil_gt60", label:"Sondeos (tanques aceite fp>60°C)", group:"sounding",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[2,3],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },

  // Misc
  { id:"hp_control_air", label:"Aire de control/arranque", group:"misc",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[4],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },
  { id:"service_air", label:"Aire de servicio (no esencial)", group:"misc",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"brine", label:"Salmuera", group:"misc",
    class_of_pipe_system:"wet", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
  { id:"co2_outside", label:"CO₂ fuera del espacio protegido", group:"misc",
    class_of_pipe_system:"dry", fire_test:"30min_dry", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },
  { id:"co2_inside", label:"CO₂ dentro del espacio protegido", group:"misc",
    class_of_pipe_system:"dry", fire_test:"not_required", notes:[],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:false } },
  { id:"steam", label:"Vapor", group:"misc",
    class_of_pipe_system:"wet", fire_test:"not_required", notes:[8],
    allowed_joints:{ pipe_unions:true, compression_couplings:true, slip_on_joints:true } },
];

// ===== Tabla 12.2.9 (reglas por sub-tipo) =====
export const SUBTYPE_RULES = {
  pipe_unions: [
    { id:"welded_brazed", name:"Soldadas/Brasing", classes:["I","II","III"], od_max_mm:{ I:60.3, II:60.3 } }
  ],
  compression_couplings: [
    { id:"swage",   name:"Swage",   classes:["I","II","III"] },
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

// ===== Textos de notas (solo 12.2.8) =====
export const NOTES_TEXT = {
  1:"Ensayo de fuego cuando se instalan en pump-rooms o cubiertas abiertas.",
  2:"Slip-on no aceptadas en maquinaria Cat. A ni alojamientos. En otros espacios de maquinaria aceptadas si están visibles y accesibles (MSC/Circ.734).",
  3:"Juntas de tipo resistente al fuego salvo en cubierta abierta y no usadas para fuel oil.",
  4:"Ensayo de fuego cuando se instalan en espacios de máquinas de categoría A.",
  5:"Solo sobre cubierta de pasaje/cubierta de francobordo.",
  6:"Slip-type en cubierta si P≤10 bar (referencia figuras).",
  7:"Equivalencia de ensayos (30 sec/8+22/30 húmedo).",
  8:"Ver 2.12.10 para vapor: slip-on restringidos en cubierta (P≤1 MPa).",
};

// ===== Cláusulas generales 2.12.x (sólo referencias y títulos) =====
export const CLAUSES = {
  "2.12.5": "Riesgo incendio/inundación (costado bajo cubierta o tanques con fluidos inflamables).",
  "2.12.6": "Capaces de vacío en succiones.",
  "2.12.7": "Minimizar juntas mecánicas en fluidos inflamables.",
  "2.12.8": "Slip-on no en bodegas/tanques/espacios no fácilmente accesibles; dentro de tanques solo si el medio es el mismo.",
  "2.12.9": "Slip-type no como medio principal de unión (solo para compensar deformación axial).",
  "2.12.10":"Slip-on restringidos en líneas de vapor ≤1 MPa en cubierta expuesta (expansión).",
  "2.12.11":"Ensayos de tipo conforme a LR Type Approval Test Spec No.2."
};

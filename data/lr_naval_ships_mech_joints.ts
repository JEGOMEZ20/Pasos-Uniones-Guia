export const LR_NAVAL_DATASET = {
  "standard": "LR_NAVAL_SHIPS",
  "version": "Vol2 Pt7 Ch1 §5.10 (Tables 1.5.3, 1.5.4) – rev 2024-06",
  "systems": [
    {
      "id": "aircraft_vehicle_fuel_lt60",
      "label_es": "Combustible aeronaves/vehículos (p.f. < 60°C)",
      "label_en": "Aircraft & vehicle fuel oil (<60°C)",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [
        2,
        4
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "vent_lines_flammable_lt60",
      "label_es": "Respiraderos (p.f. < 60°C)",
      "label_en": "Vent lines (<60°C)",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [
        2,
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "aircraft_vehicle_fuel_gt60",
      "label_es": "Combustible aeronaves/vehículos (p.f. > 60°C)",
      "label_en": "Aircraft & vehicle fuel oil (>60°C)",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [
        2,
        4
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "machinery_fuel_oil_gt60",
      "label_es": "Combustible maquinaria buque (p.f. > 60°C)",
      "label_en": "Ship machinery fuel oil (>60°C)",
      "class_of_pipe_system": "wet",
      "fire_test": "30min_wet",
      "notes": [
        2,
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "lubricating_oil_gt60",
      "label_es": "Aceite lubricante (p.f. > 60°C)",
      "label_en": "Lubricating oil (>60°C)",
      "class_of_pipe_system": "wet",
      "fire_test": "30min_wet",
      "notes": [
        2,
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "hydraulic_oil_gt60",
      "label_es": "Aceite hidráulico (p.f. > 60°C)",
      "label_en": "Hydraulic oil (>60°C)",
      "class_of_pipe_system": "wet",
      "fire_test": "30min_wet",
      "notes": [
        2,
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "bilge_lines",
      "label_es": "Líneas de achique",
      "label_en": "Bilge lines",
      "class_of_pipe_system": "dry/wet",
      "fire_test": "8min_dry_plus_22min_wet",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "hp_sea_water_spray_npfilled",
      "label_es": "Agua de mar alta presión / spray (no permanentemente llenas)",
      "label_en": "HP sea water & spray (not permanently filled)",
      "class_of_pipe_system": "dry/wet",
      "fire_test": "8min_dry_plus_22min_wet",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "permanent_fire_mains_sprinkler",
      "label_es": "Sistemas fijos llenos de agua (main/sprinkler)",
      "label_en": "Permanent water-filled fire-extinguishing (fire main/sprinkler)",
      "class_of_pipe_system": "wet",
      "fire_test": "30min_wet",
      "notes": [
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "non_permanent_fire_systems",
      "label_es": "Sistemas no permanentes (espuma/drenchers/main)",
      "label_en": "Non-permanent water-filled fire-extinguishing (foam/drencher/main)",
      "class_of_pipe_system": "dry/wet",
      "fire_test": "8min_dry_plus_22min_wet",
      "notes": [
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      },
      "extra": "FSS_Code_observed"
    },
    {
      "id": "ballast_system",
      "label_es": "Sistema de lastre",
      "label_en": "Ballast system",
      "class_of_pipe_system": "wet",
      "fire_test": "8min_dry_plus_22min_wet",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "cooling_water_system",
      "label_es": "Sistema de agua de refrigeración",
      "label_en": "Cooling water system",
      "class_of_pipe_system": "wet",
      "fire_test": "8min_dry_plus_22min_wet",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "tank_cleaning_services",
      "label_es": "Servicios de limpieza de tanques",
      "label_en": "Tank cleaning services",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "sea_water_non_essential",
      "label_es": "Sistemas no esenciales (agua de mar)",
      "label_en": "Sea water non-essential systems",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "fresh_water_cooling_system",
      "label_es": "Sistema de refrigeración (agua dulce)",
      "label_en": "Fresh water cooling system",
      "class_of_pipe_system": "wet",
      "fire_test": "not_required",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "chilled_water_system",
      "label_es": "Sistema de agua helada",
      "label_en": "Chilled water system",
      "class_of_pipe_system": "wet",
      "fire_test": "30min_wet",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "condensate_return",
      "label_es": "Retorno de condensado",
      "label_en": "Condensate return",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "made_demin_water_system",
      "label_es": "Sistema de agua preparada/desmineralizada",
      "label_en": "Made & demineralised water system",
      "class_of_pipe_system": "wet",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "fresh_water_ancillary",
      "label_es": "Sistema auxiliar de agua dulce",
      "label_en": "Fresh water ancillary system",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "deck_drains_internal",
      "label_es": "Drenajes de cubierta (internos)",
      "label_en": "Deck drains (internal)",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [
        6
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "sanitary_drains",
      "label_es": "Drenajes sanitarios",
      "label_en": "Sanitary drains",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "scuppers_overboard",
      "label_es": "Imbornales y descargas a mar",
      "label_en": "Scuppers & discharge (overboard)",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": false
      }
    },
    {
      "id": "sounding_water_tanks_dry_spaces",
      "label_es": "Sondas: tanques de agua / espacios secos",
      "label_en": "Sounding: water tanks / dry spaces",
      "class_of_pipe_system": "dry/wet",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "sounding_oil_tanks_gt60",
      "label_es": "Sondas: tanques de aceite (p.f. > 60°C)",
      "label_en": "Sounding: oil tanks (>60°C)",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [
        2,
        3
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "intakes_uptakes",
      "label_es": "Entradas y salidas (intakes/uptakes)",
      "label_en": "Intakes & uptakes",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [
        7
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "hvac_trunking",
      "label_es": "Conductos HVAC",
      "label_en": "HVAC trunking",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [
        7
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "hp_air_system",
      "label_es": "Sistema de aire alta presión",
      "label_en": "High pressure air system",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "mp_air_system",
      "label_es": "Sistema de aire media presión",
      "label_en": "Medium pressure air system",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "lp_air_system",
      "label_es": "Sistema de aire baja presión",
      "label_en": "Low pressure air system",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "service_air_nonessential",
      "label_es": "Aire de servicio (no esencial)",
      "label_en": "Service air (non-essential)",
      "class_of_pipe_system": "dry",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "brine_system",
      "label_es": "Sistema de salmuera",
      "label_en": "Brine system",
      "class_of_pipe_system": "wet",
      "fire_test": "not_required",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    },
    {
      "id": "co2_system",
      "label_es": "Sistema de CO₂",
      "label_en": "CO₂ system",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [
        1
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": false
      }
    },
    {
      "id": "nitrogen_system",
      "label_es": "Sistema de nitrógeno",
      "label_en": "Nitrogen system",
      "class_of_pipe_system": "dry",
      "fire_test": "30min_dry",
      "notes": [],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": false
      }
    },
    {
      "id": "steam",
      "label_es": "Vapor",
      "label_en": "Steam",
      "class_of_pipe_system": "see_note_5",
      "fire_test": "not_required",
      "notes": [
        5
      ],
      "allowed_joints": {
        "pipe_unions": true,
        "compression_couplings": true,
        "slip_on_joints": true
      }
    }
  ],
  "pipe_class_rules": [
    {
      "joint": "pipe_union_welded_brazed",
      "class": [
        "I",
        "II",
        "III"
      ],
      "od_max_mm": 60.3
    },
    {
      "joint": "compression_swage",
      "class": [
        "III"
      ]
    },
    {
      "joint": "compression_bite",
      "class": [
        "I",
        "II",
        "III"
      ],
      "od_max_mm": 60.3
    },
    {
      "joint": "compression_typical",
      "class": [
        "I",
        "II",
        "III"
      ],
      "od_max_mm": 60.3
    },
    {
      "joint": "compression_flared",
      "class": [
        "I",
        "II",
        "III"
      ],
      "od_max_mm": 60.3
    },
    {
      "joint": "compression_press",
      "class": [
        "III"
      ]
    },
    {
      "joint": "slip_on_machine_grooved",
      "class": [
        "I",
        "II"
      ]
    },
    {
      "joint": "slip_on_grip",
      "class": [
        "I",
        "II"
      ]
    },
    {
      "joint": "slip_on_slip_type",
      "class": [
        "I",
        "II"
      ]
    }
  ],
  "notes": {
    "1": {
      "type": "catA_fire_resistant_if_deteriorates_and_material_for_bilge_main",
      "catA_requires_fire_resistant": true,
      "bilge_main_materials": [
        "steel",
        "CuNi",
        "equivalent"
      ]
    },
    "2": {
      "type": "no_slip_on_in_catA_munitions_accommodation",
      "prohibit_spaces": [
        "munitions_store",
        "accommodation"
      ],
      "require_visible_accessible_spaces": [
        "other_machinery"
      ]
    },
    "3": {
      "type": "fire_resistant_except_open_deck_low_fire_risk",
      "exception": {
        "space": "open_deck_low_risk_SOLAS_9_2_3_3_2_2_10"
      }
    },
    "4": {
      "type": "fire_resistant_required"
    },
    "5": {
      "type": "restrained_slip_on_steam_open_deck_tankers_le_10bar",
      "space": "open_deck",
      "ship_types": [
        "oil_tanker",
        "chemical_tanker"
      ],
      "max_pressure_bar": 10
    },
    "6": {
      "type": "only_above_limit_of_watertight_integrity"
    },
    "7": {
      "type": "hvac_trunking_intakes_uptakes_defer",
      "message": "HVAC/uptakes/intakes: ver secciones específicas de las Reglas."
    }
  }
};
export type LRNavalDataset = typeof LR_NAVAL_DATASET;
export default LR_NAVAL_DATASET;

export type LRShipsJointGroup = "pipe_unions" | "compression_couplings" | "slip_on_joints";

export interface LRShipsSystem {
  id: string;
  label_es: string;
  label_en?: string;
  group?: string;
  class_of_pipe_system: "dry" | "wet" | "dry/wet";
  fire_test: "30min_dry" | "30min_wet" | "8min_dry_plus_22min_wet" | null;
  notes: number[];
  allowed_joints: Partial<Record<LRShipsJointGroup, boolean>>;
}

export interface LRShipsPipeClassRule {
  joint: Joint;
  class: PipeClass[];
  od_max_mm?: Partial<Record<PipeClass, number>>;
}

export interface LRShipsDataset {
  standard: "LR_SHIPS";
  version: string;
  systems: LRShipsSystem[];
  pipe_class_rules: LRShipsPipeClassRule[];
  notes: Record<string, LRShipsNote>;
}

export type Space =
  | "machinery_cat_A"
  | "other_machinery"
  | "accommodation"
  | "pump_room"
  | "open_deck"
  | "tank"
  | "cargo_hold"
  | "cofferdam"
  | "void";

export type Joint =
  | "pipe_unions"
  | "compression_couplings"
  | "slip_on_joints"
  | "pipe_union_welded_brazed"
  | "compression_swage"
  | "compression_typical"
  | "compression_bite"
  | "compression_flared"
  | "compression_press"
  | "slip_on_machine_grooved"
  | "slip_on_grip"
  | "slip_on_slip_type";

export type PipeClass = "I" | "II" | "III";

export type LRShipsNote =
  | {
      type: "fire_test_if_space";
      spaces: Space[];
      test: "from_row" | "30min_dry" | "30min_wet" | "8min_dry_plus_22min_wet";
    }
  | {
      type: "prohibit_slip_on_in_spaces";
      prohibit: Space[];
      allow_if?: "other_machinery_visible_accessible";
    }
  | {
      type: "require_fire_resistant_type_except";
      except: { space: Space; not_for?: "fuel_oil_lines" };
    }
  | { type: "only_above_bulkhead_deck_passenger_ships" }
  | { type: "allow_slip_type_on_open_deck_max_pressure_bar"; max_bar: number }
  | {
      type: "test_equivalence";
      equivalences: Record<
        "30min_dry" | "30min_wet" | "8min_dry_plus_22min_wet",
        "30min_dry" | "30min_wet" | "8min_dry_plus_22min_wet"
      >;
    }
  | { type: "reference_only"; ref: string };

export const LR_SHIPS_DATASET: LRShipsDataset = {
  standard: "LR_SHIPS",
  version: "Pt5 Ch12 Sec2.12 (Tables 12.2.8, 12.2.9) – rev 2024-06",
  systems: [
    {
      id: "ballast_system",
      label_es: "Sistema de lastre",
      label_en: "Ballast system",
      class_of_pipe_system: "wet",
      fire_test: "30min_wet",
      notes: [4],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: true,
      },
    },
    {
      id: "bilge_lines",
      label_es: "Líneas de achique",
      label_en: "Bilge lines",
      class_of_pipe_system: "dry/wet",
      fire_test: "8min_dry_plus_22min_wet",
      notes: [4],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: true,
      },
    },
    {
      id: "hydrocarbon_loading_lines",
      label_es: "Líneas de carga de hidrocarburos",
      label_en: "Hydrocarbon loading lines",
      class_of_pipe_system: "dry",
      fire_test: "30min_dry",
      notes: [1],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: true,
      },
    },
    {
      id: "seawater_cooling",
      label_es: "Sistema de enfriamiento por agua de mar",
      label_en: "Sea water cooling",
      class_of_pipe_system: "wet",
      fire_test: "30min_wet",
      notes: [1, 2],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: true,
      },
    },
    {
      id: "fire_main",
      label_es: "Red principal de incendios",
      label_en: "Fire main",
      class_of_pipe_system: "wet",
      fire_test: "30min_wet",
      notes: [1, 2, 3],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: true,
      },
    },
    {
      id: "fuel_oil_system",
      label_es: "Sistema de fuel oil",
      label_en: "Fuel oil system",
      class_of_pipe_system: "dry",
      fire_test: "30min_dry",
      notes: [3],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: false,
      },
    },
    {
      id: "sanitary",
      label_es: "Sistema sanitario",
      label_en: "Sanitary system",
      class_of_pipe_system: "wet",
      fire_test: null,
      notes: [],
      allowed_joints: {
        pipe_unions: true,
        compression_couplings: true,
        slip_on_joints: true,
      },
    },
  ],
  pipe_class_rules: [
    {
      joint: "pipe_union_welded_brazed",
      class: ["I", "II", "III"],
      od_max_mm: { I: 60.3, II: 60.3 },
    },
    { joint: "compression_swage", class: ["III"] },
    {
      joint: "compression_bite",
      class: ["I", "II", "III"],
      od_max_mm: { I: 60.3, II: 60.3 },
    },
    {
      joint: "compression_typical",
      class: ["I", "II", "III"],
      od_max_mm: { I: 60.3, II: 60.3 },
    },
    {
      joint: "compression_flared",
      class: ["I", "II", "III"],
      od_max_mm: { I: 60.3, II: 60.3 },
    },
    { joint: "compression_press", class: ["III"] },
    { joint: "slip_on_machine_grooved", class: ["I", "II", "III"] },
    { joint: "slip_on_grip", class: ["II", "III"] },
    { joint: "slip_on_slip_type", class: ["II", "III"] },
  ],
  notes: {
    "1": { type: "fire_test_if_space", spaces: ["pump_room", "open_deck"], test: "from_row" },
    "2": {
      type: "prohibit_slip_on_in_spaces",
      prohibit: ["machinery_cat_A", "accommodation"],
      allow_if: "other_machinery_visible_accessible",
    },
    "3": {
      type: "require_fire_resistant_type_except",
      except: { space: "open_deck", not_for: "fuel_oil_lines" },
    },
    "4": { type: "fire_test_if_space", spaces: ["machinery_cat_A"], test: "from_row" },
    "5": { type: "only_above_bulkhead_deck_passenger_ships" },
    "6": { type: "allow_slip_type_on_open_deck_max_pressure_bar", max_bar: 10 },
    "7": {
      type: "test_equivalence",
      equivalences: {
        "30min_dry": "8min_dry_plus_22min_wet",
        "8min_dry_plus_22min_wet": "30min_dry",
        "30min_wet": "30min_wet",
      },
    },
    "8": {
      type: "reference_only",
      ref: "Pt5 Ch12 2.12.10 (restrained slip-on en cubierta ≤1 MPa, petroleros/quimiqueros)",
    },
  },
};

export default LR_SHIPS_DATASET;

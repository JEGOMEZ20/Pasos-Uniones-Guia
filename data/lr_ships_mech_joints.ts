export type Group = "pipe_unions" | "compression_couplings" | "slip_on_joints";

export type PipeClass = "I" | "II" | "III";

export type Space =
  | "machinery_cat_A"
  | "accommodation"
  | "other_machinery"
  | "other_machinery_accessible"
  | "cargo_hold"
  | "tank"
  | "pump_room"
  | "open_deck";

export type Joint =
  | Group
  | "pipe_union_welded_brazed"
  | "compression_swage"
  | "compression_bite"
  | "compression_typical"
  | "compression_flared"
  | "compression_press"
  | "slip_on_machine_grooved"
  | "slip_on_grip"
  | "slip_on_slip_type";

export type LrShipRow = {
  id: string;
  label_es: string;
  class_of_pipe_system: "dry" | "wet" | "dry/wet";
  fire_test: "30min_dry" | "30min_wet" | "8+22" | "not_required";
  notes: number[];
  allowed_joints: {
    pipe_unions: boolean;
    compression_couplings: boolean;
    slip_on_joints: boolean;
  };
};

export const LR_SHIPS_SYSTEMS: LrShipRow[] = [
  {
    id: "ballast_system",
    label_es: "Sistema de lastre",
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
    class_of_pipe_system: "dry/wet",
    fire_test: "8+22",
    notes: [4],
    allowed_joints: {
      pipe_unions: true,
      compression_couplings: true,
      slip_on_joints: true,
    },
  },
  {
    id: "hydrocarbon_loading_lines_fp_le_60",
    label_es: "Líneas de carga de hidrocarburos",
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
    class_of_pipe_system: "wet",
    fire_test: "not_required",
    notes: [],
    allowed_joints: {
      pipe_unions: true,
      compression_couplings: true,
      slip_on_joints: true,
    },
  },
];

export const LR_SHIPS_DATA_VERSION = "2024-06-r2";

export const LR_SHIPS_DATASET = {
  standard: "LR_SHIPS",
  version: LR_SHIPS_DATA_VERSION,
  systems: LR_SHIPS_SYSTEMS,
};

export default LR_SHIPS_DATASET;

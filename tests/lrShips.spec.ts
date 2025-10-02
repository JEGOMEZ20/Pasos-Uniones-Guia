import { describe, expect, it } from "vitest";
import evaluateLRShips, {
  evaluateGroups as evaluateLRShipsGroups,
  type Joint,
  type PipeClass,
  type Space,
} from "../dist/engine/lrShips.js";
import lrShipsDataset from "../dist/data/lr_ships_mech_joints.js";

function evaluate(options: {
  systemId: string;
  space: Space;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  lineType?: "fuel_oil" | "thermal_oil" | "other";
  location?: "visible_accessible" | "normal";
}) {
  return evaluateLRShips(options);
}

function pass(joint: Joint, pipeClass: PipeClass, od?: number) {
  const rule = lrShipsDataset.pipe_class_rules.find((entry) => entry.joint === joint);
  if (!rule) {
    throw new Error(`No existe regla para ${joint}`);
  }
  if (!rule.class.includes(pipeClass)) {
    return false;
  }
  const limit = rule.od_max_mm?.[pipeClass];
  if (limit == null) {
    return true;
  }
  if (od === undefined) {
    return false;
  }
  return od <= limit + 1e-6;
}

describe("evaluateLRShips", () => {
  it("marca condicional líneas de carga de hidrocarburos en Cat. A, Clase III", () => {
    const result = evaluate({
      systemId: "hydrocarbon_loading_lines",
      space: "machinery_cat_A",
      pipeClass: "III",
      od_mm: 73,
      joint: "slip_on_joints",
    });

    expect(result.status).toBe("conditional");
    expect(result.conditions.join(" ")).toMatch(/30 min seco/);
    expect(result.reasons).toHaveLength(0);
  });

  it("habilita slip-on condicional en otros espacios accesibles para carga de hidrocarburos", () => {
    const r = evaluate({
      systemId: "hydrocarbon_loading_lines",
      space: "other_machinery_accessible",
      pipeClass: "II",
      od_mm: 48.3,
      joint: "slip_on_joints",
      accessibility: "easy",
    });

    expect(r.status).toBe("conditional");
    expect(r.reasons).toHaveLength(0);
    expect(r.conditions.join(" ")).toMatch(/30 min seco/);
  });

  it("verifica Tabla 12.2.9 por subtipo", () => {
    expect(pass("slip_on_machine_grooved", "III", 73)).toBe(true);
    expect(pass("slip_on_grip", "III", 73)).toBe(true);
    expect(pass("compression_press", "III", 73)).toBe(true);
    expect(pass("pipe_union_welded_brazed", "III", 141.3)).toBe(true);
  });

  it("valida slip-on por subtipo en Clase II", () => {
    expect(pass("slip_on_machine_grooved", "II", 48.3)).toBe(true);
    expect(pass("slip_on_grip", "II", 48.3)).toBe(true);
    expect(pass("slip_on_slip_type", "II", 48.3)).toBe(true);
  });

  it("controla Grip en Clase I por Tabla 12.2.9", () => {
    expect(pass("slip_on_grip", "I", 48.3)).toBe(false);
  });

  it("bloquea slip-on en bodegas por cláusula general", () => {
    const groups = evaluateLRShipsGroups({
      systemId: "hydrocarbon_loading_lines",
      space: "cargo_hold",
      joint: "slip_on_joints",
    });

    const slipOn = groups.slip_on_joints;
    expect(slipOn.status).toBe("forbidden");
    expect(slipOn.reasons[0]).toBe(
      "Slip-on no permitido en bodegas/tanques/espacios no fácilmente accesibles"
    );
    expect(slipOn.clauses[0]?.section).toMatch(/§2\.12\.8/);
  });
});

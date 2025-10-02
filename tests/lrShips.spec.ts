import { describe, expect, it } from "vitest";
import evaluateLRShips, {
  SUBTYPE_RULES,
  evaluateGroups as evaluateLRShipsGroups,
  passClassOD,
} from "../dist/engine/lrShips.js";

describe("evaluateLRShips", () => {
  it("marca condicional las slip-on en líneas de carga de hidrocarburos Cat. A Clase II", () => {
    const result = evaluateLRShips({
      systemId: "hydrocarbon_loading_lines",
      space: "machinery_cat_A",
      pipeClass: "II",
      od_mm: 60.3,
      joint: "slip_on_joints",
      accessibility: "easy",
    });

    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain("30 min seco");
    expect(result.reasons).toHaveLength(0);
  });

  it("valida Swage y Press según Tabla 12.2.9 para Clase II", () => {
    const swageRule = SUBTYPE_RULES.compression_couplings.find((rule) => rule.id === "swage");
    const pressRule = SUBTYPE_RULES.compression_couplings.find((rule) => rule.id === "press");

    expect(swageRule && passClassOD(swageRule, "II", 60.3)).toBe(true);
    expect(pressRule && passClassOD(pressRule, "II", 60.3)).toBe(false);
  });

  it("habilita los tres subtipos Slip-on en Clase II dentro de los límites", () => {
    const mgRule = SUBTYPE_RULES.slip_on_joints.find((rule) => rule.id === "machine_grooved");
    const gripRule = SUBTYPE_RULES.slip_on_joints.find((rule) => rule.id === "grip");
    const slipRule = SUBTYPE_RULES.slip_on_joints.find((rule) => rule.id === "slip_type");

    expect(mgRule && passClassOD(mgRule, "II", 60.3)).toBe(true);
    expect(gripRule && passClassOD(gripRule, "II", 60.3)).toBe(true);
    expect(slipRule && passClassOD(slipRule, "II", 60.3)).toBe(true);
  });

  it("bloquea Slip-on en bodega por la cláusula 2.12.8", () => {
    const groups = evaluateLRShipsGroups({
      systemId: "hydrocarbon_loading_lines",
      space: "cargo_hold",
      joint: "slip_on_joints",
      pipeClass: "III",
      od_mm: 73,
    });

    const slipOn = groups.slip_on_joints;
    expect(slipOn.status).toBe("forbidden");
    expect(slipOn.clauses?.[0]?.section).toMatch(/§2\.12\.8/);
  });

  it("rechaza Grip en Clase I por límite de Tabla 12.2.9", () => {
    const gripRule = SUBTYPE_RULES.slip_on_joints.find((rule) => rule.id === "grip");
    expect(gripRule && passClassOD(gripRule, "I", 48.3)).toBe(false);
  });
});

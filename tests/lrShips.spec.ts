import { describe, expect, it } from "vitest";
import { evaluateLRShips, SUBTYPE_RULES, passClassOD } from "../dist/engine/lrShips.js";

describe("LR Ships mechanical joints", () => {
  it("marca condicional los grupos por ensayo base en hidrocarburos", () => {
    const result = evaluateLRShips({
      systemId: "hydrocarbon_loading_lines_fp_le_60",
      space: "machinery_cat_A",
      pipeClass: "II",
      od_mm: 60.3,
      accessibility: "easy",
    });

    expect(result.pipe_unions.status).toBe("conditional");
    expect(result.pipe_unions.conditions).toContain("30 min seco");
    expect(result.compression_couplings.status).toBe("conditional");
    expect(result.slip_on_joints.status).toBe("conditional");
    expect(result.slip_on_joints.reasons.length).toBe(0);
  });

  it("valida Swage y Press según Tabla 12.2.9 para Clase II", () => {
    const swageRule = SUBTYPE_RULES.compression_couplings.find((rule) => rule.id === "swage");
    const pressRule = SUBTYPE_RULES.compression_couplings.find((rule) => rule.id === "press");

    expect(swageRule && passClassOD(swageRule, "II", 60.3)).toBe(true);
    expect(pressRule && passClassOD(pressRule, "II", 60.3)).toBe(false);
  });

  it("habilita los subtipos Slip-on en Clase II dentro de los límites", () => {
    const ids = ["machine_grooved", "grip", "slip_type"] as const;
    for (const id of ids) {
      const rule = SUBTYPE_RULES.slip_on_joints.find((item) => item.id === id);
      expect(rule && passClassOD(rule, "II", 60.3)).toBe(true);
    }
  });

  it("bloquea Slip-on en bodega por la cláusula 2.12.8", () => {
    const result = evaluateLRShips({
      systemId: "hydrocarbon_loading_lines_fp_le_60",
      space: "cargo_hold",
      pipeClass: "III",
      od_mm: 73,
      accessibility: "not_easy",
    });

    const slipOn = result.slip_on_joints;
    expect(slipOn.status).toBe("forbidden");
    expect(slipOn.clauses[0]?.section).toMatch(/§2\.12\.8/);
  });

  it("rechaza Grip en Clase I por límite de Tabla 12.2.9", () => {
    const gripRule = SUBTYPE_RULES.slip_on_joints.find((rule) => rule.id === "grip");
    expect(gripRule && passClassOD(gripRule, "I", 48.3)).toBe(false);
  });
});

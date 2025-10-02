import { describe, expect, it } from "vitest";
import evaluateLRShips, { type Joint, type PipeClass, type Space } from "../dist/engine/lrShips.js";

function evaluate(options: {
  systemId: string;
  space: Space;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  lineType?: "fuel_oil" | "thermal_oil" | "other";
  location?: "visible_accessible" | "normal";
  sameMediumInTank?: boolean;
}) {
  return evaluateLRShips(options);
}

describe("evaluateLRShips", () => {
  it("marca condiciones de fuego para sistema de lastre en Cat. A con slip-on", () => {
    const result = evaluate({
      systemId: "ballast_system",
      space: "machinery_cat_A",
      joint: "slip_on_machine_grooved",
      pipeClass: "II",
      od_mm: 50,
    });
    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain("Ensayo fuego 30 min húmedo");
  });

  it("aplica ensayo combinado para líneas de achique en Cat. A con compresión", () => {
    const result = evaluate({
      systemId: "bilge_lines",
      space: "machinery_cat_A",
      joint: "compression_bite",
      pipeClass: "II",
      od_mm: 40,
    });
    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain("Ensayo fuego 8 min seco + 22 min húmedo");
    expect(result.reasons.some((msg) => msg.includes("Nota 2"))).toBe(false);
  });

  it("bloquea slip-on en acomodaciones por Nota 2", () => {
    const result = evaluate({
      systemId: "seawater_cooling",
      space: "accommodation",
      joint: "slip_on_grip",
      pipeClass: "II",
      od_mm: 40,
    });
    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("Nota 2");
  });

  it("permite slip-type en cubierta abierta a ≤10 bar", () => {
    const result = evaluate({
      systemId: "sanitary",
      space: "open_deck",
      joint: "slip_on_slip_type",
      pipeClass: "III",
      od_mm: 40,
      designPressure_bar: 8,
    });
    expect(result.status === "allowed" || result.status === "conditional").toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rechaza compression press en clase I por Tabla 12.2.9", () => {
    const result = evaluate({
      systemId: "sanitary",
      space: "other_machinery",
      joint: "compression_press",
      pipeClass: "I",
      od_mm: 40,
    });
    expect(result.status).toBe("forbidden");
    expect(result.reason).toBe("Tabla 12.2.9: límite de clase/OD");
  });

  it("prohíbe slip-on en tanque con medio distinto", () => {
    const result = evaluate({
      systemId: "ballast_system",
      space: "tank",
      joint: "slip_on_machine_grooved",
      pipeClass: "II",
      od_mm: 40,
      sameMediumInTank: false,
    });
    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("tanques");
  });

  it("marca ensayo combinado y Nota 4 para slip-on en bilge Cat. A (Clase III)", () => {
    const result = evaluate({
      systemId: "bilge_lines",
      space: "machinery_cat_A",
      joint: "slip_on_machine_grooved",
      pipeClass: "III",
      od_mm: 76,
    });
    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain("Ensayo fuego 8 min seco + 22 min húmedo");
    expect(result.notesApplied).toContain(4);
    expect(result.reasons.some((msg) => msg.includes("Nota 2"))).toBe(false);
  });

  it("bloquea slip-on Grip en Clase I por Tabla 12.2.9", () => {
    const result = evaluate({
      systemId: "sanitary",
      space: "other_machinery",
      joint: "slip_on_grip",
      pipeClass: "I",
      od_mm: 50,
    });
    expect(result.status).toBe("forbidden");
    expect(result.reason).toBe("Tabla 12.2.9: límite de clase/OD");
  });
});

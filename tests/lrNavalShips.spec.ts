import { describe, expect, it } from "vitest";
import evaluateLRNavalShips, {
  type Joint,
  type PipeClass,
  type Space,
} from "../dist/engine/evaluateLRNavalShips.js";

function evaluate(options: {
  systemId: string;
  space: Space;
  joint: Joint;
  pipeClass?: PipeClass;
  od_mm?: number;
  designPressure_bar?: number;
  isSectionDirectlyConnectedToShipSide?: boolean;
  aboveLimitOfWatertightIntegrity?: boolean;
  accessibility?: "easy" | "not_easy";
  location?: "visible_accessible" | "normal";
  mediumInPipeSameAsTank?: boolean;
  lineType?: "fuel_oil" | "thermal_oil" | "other";
  shipType?: "naval" | "oil_tanker" | "chemical_tanker" | "other";
  tailoring?: { shock?: boolean; fire?: boolean; watertight?: boolean };
  mainMeansOfConnection?: boolean;
}) {
  return evaluateLRNavalShips(options);
}

describe("evaluateLRNavalShips", () => {
  it("marca condiciones para bilge Cat. A (Clase III) con slip-on", () => {
    const result = evaluate({
      systemId: "bilge_lines",
      space: "machinery_cat_A",
      joint: "slip_on_machine_grooved",
      pipeClass: "III",
      od_mm: 76,
    });

    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain("Ensayo de fuego: 8 min seco + 22 min húmedo");
    expect(result.conditions).toContain(
      "Tipo resistente al fuego si componentes se deterioran en incendio (Cat. A)"
    );
    expect(result.conditions).toContain("Material acople bilge main: acero/CuNi/equiv.");
    expect(result.notesApplied).toContain(1);
    expect(result.reasons.some((msg) => msg.includes("Nota 2"))).toBe(false);
  });

  it("aplica requisitos de bilge main en Cat. A con compresión", () => {
    const result = evaluate({
      systemId: "bilge_lines",
      space: "machinery_cat_A",
      joint: "compression_bite",
      pipeClass: "II",
      od_mm: 40,
    });

    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain("Ensayo de fuego: 8 min seco + 22 min húmedo");
    expect(result.conditions).toContain("Material acople bilge main: acero/CuNi/equiv.");
    expect(result.notesApplied).toContain(1);
  });

  it("bloquea slip-on en Cat. A para sistemas con Nota 2", () => {
    const result = evaluate({
      systemId: "machinery_fuel_oil_gt60",
      space: "machinery_cat_A",
      joint: "slip_on_grip",
      pipeClass: "II",
      od_mm: 40,
    });

    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("Nota 2");
  });

  it("condiciona steam con restrained slip-on en cubierta expuesta ≤10 bar", () => {
    const result = evaluate({
      systemId: "steam",
      space: "open_deck",
      joint: "slip_on_machine_grooved",
      pipeClass: "II",
      od_mm: 40,
      designPressure_bar: 8,
      shipType: "oil_tanker",
    });

    expect(result.status).toBe("conditional");
    expect(result.conditions).toContain(
      "Restringido a cubierta expuesta ≤10 bar (vapor, petroleros/quimiqueros)"
    );
  });

  it("rechaza steam slip-on fuera de condiciones de Nota 5", () => {
    const result = evaluate({
      systemId: "steam",
      space: "open_deck",
      joint: "slip_on_grip",
      pipeClass: "II",
      od_mm: 40,
      designPressure_bar: 8,
      shipType: "oil_tanker",
    });

    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("Nota 5");
    expect(result.reasons.some((msg) => msg.includes("Nota 5"))).toBe(true);
  });

  it("prohíbe slip-on en tanque con medio diferente", () => {
    const result = evaluate({
      systemId: "ballast_system",
      space: "tank",
      joint: "slip_on_machine_grooved",
      pipeClass: "II",
      od_mm: 50,
      mediumInPipeSameAsTank: false,
    });

    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("tanques");
  });

  it("mantiene condicional bilge Cat. A con joint genérico", () => {
    const result = evaluate({
      systemId: "bilge_lines",
      space: "machinery_cat_A",
      joint: "slip_on_joints",
      pipeClass: "III",
      od_mm: 114.3,
    });

    expect(result.status).toBe("conditional");
    expect(result.notesApplied).toContain(1);
  });

  it("prohíbe secciones conectadas al costado bajo el WLI", () => {
    const result = evaluate({
      systemId: "ballast_system",
      space: "other_machinery",
      joint: "compression_bite",
      pipeClass: "II",
      od_mm: 40,
      isSectionDirectlyConnectedToShipSide: true,
      aboveLimitOfWatertightIntegrity: false,
    });

    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("§5.10.6");
  });

  it("prohíbe slip-on cuando no hay accesibilidad fácil", () => {
    const result = evaluate({
      systemId: "ballast_system",
      space: "other_machinery",
      joint: "slip_on_machine_grooved",
      pipeClass: "II",
      od_mm: 40,
      accessibility: "not_easy",
    });

    expect(result.status).toBe("forbidden");
    expect(result.reason).toContain("§5.10.9");
  });
});

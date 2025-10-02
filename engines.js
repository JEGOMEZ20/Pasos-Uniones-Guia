const BASE_COUPLING_RULES = {
  pipeUnions: (clazz, odMM) => {
    if (clazz === "III") {
      return { allowed: true, reason: "+ (sin límite de OD en Clase III)" };
    }
    const ok = odMM <= 60.3;
    return {
      allowed: ok,
      reason: ok ? "+ (OD ≤ 60,3 mm en Clase I/II)" : "En Clase I/II solo se permite OD ≤ 60,3 mm.",
    };
  },
  compressionSubtypes: (clazz, odMM) => ({
    swage: clazz === "III",
    bite: clazz === "III" ? true : odMM <= 60.3,
    typical: clazz === "III" ? true : odMM <= 60.3,
    flared: clazz === "III" ? true : odMM <= 60.3,
    press: clazz === "III",
  }),
  slipOnSubtypes: (clazz) => ({
    machine_grooved: true,
    grip: clazz !== "I",
    slip: clazz !== "I",
  }),
};

function formatNumber(value) {
  if (!Number.isFinite(value)) return value;
  return value.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export class BaseEngine {
  constructor(ruleset) {
    this.ruleset = ruleset;
  }

  static use(ruleset) {
    return new this(ruleset);
  }

  initContext(ctx) {
    const systems = this.ruleset?.SYSTEMS || [];
    const system = systems.find((s) => s.id === ctx.systemId) || systems[0] || null;
    const classMode = ctx.classMode ?? "manual";
    const manualClass = ctx.manualClass ?? ctx.clazz ?? "II";
    const designPressureBar = Number.isFinite(ctx.designPressureBar) ? ctx.designPressureBar : 0;
    const designTemperatureC = Number.isFinite(ctx.designTemperatureC) ? ctx.designTemperatureC : 0;
    const odMM = Number.isFinite(ctx.odMM) ? ctx.odMM : 0;
    const mediumGroup = this.getSystemMediumGroup(system);
    const usedClass =
      classMode === "manual"
        ? manualClass
        : this.suggestClass(mediumGroup, designPressureBar, designTemperatureC);

    return {
      ruleset: this.ruleset,
      system,
      classMode,
      manualClass,
      usedClass,
      mediumGroup,
      odMM,
      designPressureBar,
      designTemperatureC,
      space: ctx.space,
      baseAllowances: { pipeUnions: false, compression: false, slipOn: false },
      currentAllowances: { pipeUnions: false, compression: false, slipOn: false },
      details: {
        pipeSystemClass: null,
        fireTest: null,
        suggestedClass: this.suggestClass(mediumGroup, designPressureBar, designTemperatureC),
        mediumGroup,
        odMM,
        design: { P: designPressureBar, T: designTemperatureC },
        classMode,
        pipeUnionsRule: { allowed: false, reason: "" },
        compressionSubs: { swage: false, bite: false, typical: false, flared: false, press: false },
        slipOnSubs: { machine_grooved: false, grip: false, slip: false },
      },
      systemNotes: [],
      observations: [],
      reasons: [],
      extras: {},
    };
  }

  baseFromSystemRow(ctx) {
    const sys = ctx.system;
    if (!sys) {
      ctx.baseAllowances = { pipeUnions: false, compression: false, slipOn: false };
      ctx.currentAllowances = { ...ctx.baseAllowances };
      ctx.details.pipeSystemClass = null;
      ctx.details.fireTest = null;
      return ctx;
    }

    const allowed = sys.allowed || {};
    ctx.baseAllowances = {
      pipeUnions: Boolean(allowed.pipeUnions),
      compression: Boolean(allowed.compression),
      slipOn: Boolean(allowed.slipOn),
    };
    ctx.currentAllowances = { ...ctx.baseAllowances };
    ctx.details.pipeSystemClass = sys.pipeSystemClass ?? null;
    ctx.details.fireTest = sys.fireTest ?? null;
    return ctx;
  }

  applyClassAndODLimits(ctx) {
    const rules = this.getCouplingRules();
    const overrides = this.ruleset?.COUPLING_OVERRIDES || {};
    const applyOverride = (key, value) => {
      const handler = typeof overrides[key] === "function" ? overrides[key] : null;
      return handler
        ? handler({
            base: value,
            sys: ctx.system,
            usedClass: ctx.usedClass,
            P_design_bar: ctx.designPressureBar,
            T_design_C: ctx.designTemperatureC,
            location: ctx.space,
          })
        : value;
    };

    const allow = { ...ctx.currentAllowances };

    let pipeUnionsAllowed = allow.pipeUnions;
    let pipeUnionsRule = { allowed: pipeUnionsAllowed, reason: "" };
    if (pipeUnionsAllowed) {
      pipeUnionsRule = rules.pipeUnions(ctx.usedClass, ctx.odMM);
      pipeUnionsAllowed = pipeUnionsAllowed && pipeUnionsRule.allowed;
      pipeUnionsAllowed = applyOverride("pipeUnions", pipeUnionsAllowed);
      if (!pipeUnionsAllowed && pipeUnionsRule.reason) {
        ctx.observations.push(pipeUnionsRule.reason);
      }
    }

    let compressionAllowed = allow.compression;
    let compressionSubs = { swage: false, bite: false, typical: false, flared: false, press: false };
    if (compressionAllowed) {
      compressionSubs = rules.compressionSubtypes(ctx.usedClass, ctx.odMM);
      compressionAllowed = compressionAllowed && Object.values(compressionSubs).some(Boolean);
      compressionAllowed = applyOverride("compression", compressionAllowed);
      if (!compressionAllowed) {
        const odDisplay = formatNumber(ctx.odMM);
        ctx.observations.push(
          `En Clase ${ctx.usedClass}${ctx.usedClass !== "III" ? ` y OD ${odDisplay} mm` : ""} no queda ningún subtipo de compresión permitido.`
        );
      } else {
        if (ctx.usedClass !== "III") {
          ctx.observations.push("Swage/Press solo en Clase III.");
          if (ctx.odMM > 60.3) {
            ctx.observations.push("En Clase I/II, Bite/Typical/Flared solo hasta OD 60,3 mm.");
          }
        }
      }
    }

    let slipOnAllowed = allow.slipOn;
    let slipOnSubs = { machine_grooved: false, grip: false, slip: false };
    if (slipOnAllowed) {
      slipOnSubs = rules.slipOnSubtypes(ctx.usedClass);
      slipOnAllowed = slipOnAllowed && Object.values(slipOnSubs).some(Boolean);
      slipOnAllowed = applyOverride("slipOn", slipOnAllowed);
      if (!slipOnAllowed) {
        ctx.observations.push("Slip type Grip/Slip no se permiten en Clase I.");
      } else if (ctx.usedClass === "I") {
        ctx.observations.push("Grip/Slip no se permiten en Clase I.");
      }
    }

    ctx.currentAllowances = {
      pipeUnions: pipeUnionsAllowed,
      compression: compressionAllowed,
      slipOn: slipOnAllowed,
    };

    ctx.details.pipeUnionsRule = pipeUnionsRule;
    ctx.details.compressionSubs = compressionSubs;
    ctx.details.slipOnSubs = slipOnSubs;
    return ctx;
  }

  applyLocationConstraints(ctx) {
    return ctx;
  }

  applyGlobalConstraints(ctx) {
    const comments = this.ruleset?.GENERAL_COMMENTS || {};
    const systemIsSteam = (ctx.system?.system || "").toLowerCase() === "steam" || ctx.mediumGroup === "steam";
    if (comments.slipOnNotMain) ctx.observations.push(comments.slipOnNotMain);
    if (comments.burstPressure) ctx.observations.push(comments.burstPressure);
    if (comments.typeApproval) ctx.observations.push(comments.typeApproval);
    if (comments.hullSide) ctx.observations.push(comments.hullSide);
    if (comments.slipOnInaccessible && ["cargo_hold", "tank"].includes(ctx.space)) {
      ctx.observations.push(comments.slipOnInaccessible);
      ctx.currentAllowances.slipOn = false;
    }
    if (comments.steamDeck && systemIsSteam) {
      if (ctx.designPressureBar <= 10 && ctx.space === "open_deck") {
        ctx.observations.push(comments.steamDeck);
      } else {
        ctx.observations.push(`${comments.steamDeck} (verifica P ≤ 10 bar y ubicación en cubierta expuesta).`);
      }
    }
    return ctx;
  }

  collectSystemNotes(ctx) {
    const notes = [];
    const tableNotes = this.ruleset?.TABLE_NOTES_ES || {};
    const expand = (entry) => {
      if (!entry) return;
      const matches = entry.match(/[0-9]+/g) || [];
      if (!matches.length) {
        if (tableNotes[entry]) {
          notes.push(`Nota ${entry}: ${tableNotes[entry]}`);
        } else {
          notes.push(entry);
        }
        return;
      }
      for (const code of matches) {
        if (tableNotes[code]) {
          notes.push(`Nota ${code}: ${tableNotes[code]}`);
        }
      }
    };

    (ctx.system?.notes || []).forEach(expand);
    if (ctx.system?.remarks) {
      notes.push(ctx.system.remarks);
    }
    ctx.systemNotes = notes;
    return ctx;
  }

  collectObservations(ctx) {
    return ctx;
  }

  finalize(ctx) {
    const allowed = { ...ctx.currentAllowances };
    if (!allowed.slipOn && ctx.baseAllowances?.slipOn) {
      ctx.reasons.push(
        "Slip-on permitido por la tabla base, pero bloqueado por ubicación, clase u otras condiciones del reglamento."
      );
    }

    const classLabel =
      ctx.usedClass === "I" ? "Class I" : ctx.usedClass === "II" ? "Class II" : ctx.usedClass === "III" ? "Class III" : ctx.usedClass;

    return {
      allowed,
      fireTest: ctx.details.fireTest ?? null,
      systemNotes: [...ctx.systemNotes],
      observations: [...ctx.observations],
      usedClass: classLabel,
      odMM: ctx.odMM,
      system: ctx.system,
      pipeSystemClass: ctx.details.pipeSystemClass ?? null,
      space: ctx.space,
      reasons: [...ctx.reasons],
      details: ctx.details,
      extras: ctx.extras,
    };
  }

  getCouplingRules() {
    return BASE_COUPLING_RULES;
  }

  getSystemMediumGroup(sys) {
    if (!sys) return undefined;
    if (sys.mediumGroup) return sys.mediumGroup;
    const name = (sys.system || "").toLowerCase();
    const group = (sys.group || "").toLowerCase();
    if (name.includes("thermal oil")) return "thermal_oil";
    if (name.includes("steam") || group.includes("steam")) return "steam";
    if (group.includes("flammable") || name.includes("oil")) return "flammable_liquids";
    return "other_media";
  }

  suggestClass(mediumGroup, P, T) {
    const limits = this.ruleset?.CLASS_LIMITS || {};
    const lim = mediumGroup ? limits[mediumGroup] : null;
    if (!lim) return "II";
    if (P > lim.classII.P || T > lim.classII.T) return "I";
    if (P > lim.classIII.P || T > lim.classIII.T) return "II";
    return "III";
  }
}

export class NavalEngine extends BaseEngine {
  applyLocationConstraints(ctx) {
    if (["category_a", "accommodation", "munition_store"].includes(ctx.space)) {
      ctx.currentAllowances.slipOn = false;
      const note2 = this.ruleset?.TABLE_NOTES_ES?.["2"];
      ctx.observations.push(note2 ? `Nota 2: ${note2}` : "Slip-on bloqueado por la ubicación seleccionada.");
    }
    return ctx;
  }
}

export class ShipsEngine extends BaseEngine {
  baseFromSystemRow(ctx) {
    super.baseFromSystemRow(ctx);
    return ctx;
  }

  applyLocationConstraints(ctx) {
    const isCatA = ctx.space === "category_a";
    const isAccom = ctx.space === "accommodation";
    const isOtherM = ctx.space === "other_machinery";
    const isFuelOil =
      /fuel oil/i.test(ctx.system?.system || "") || (ctx.system?.id || "").includes("fuel_oil");

    if (isCatA || isAccom) {
      if (ctx.currentAllowances.slipOn) {
        ctx.currentAllowances.slipOn = false;
      }
      ctx.observations.push(
        "Nota 2: Slip-on no se aceptan en espacios de máquinas de categoría A ni alojamientos."
      );
      return ctx;
    }

    if (isOtherM) {
      if (isFuelOil) {
        if (ctx.currentAllowances.slipOn) {
          ctx.currentAllowances.slipOn = false;
        }
        ctx.observations.push(
          "Slip-on no aceptadas para fuel oil en otros espacios de maquinaria (criterio prudencial basado en Nota 2)."
        );
      } else {
        ctx.observations.push(
          "Nota 2: En otros espacios de maquinaria, slip-on solo si quedan en posiciones visibles y accesibles."
        );
      }
    }
    return ctx;
  }

  applyGlobalConstraints(ctx) {
    const comments = this.ruleset?.GENERAL_COMMENTS || {};
    const pushUnique = (message) => {
      if (message && !ctx.observations.includes(message)) {
        ctx.observations.push(message);
      }
    };

    super.applyGlobalConstraints(ctx);

    const groupName = (ctx.system?.group || "").toLowerCase();
    const isFlammableGroup = groupName.includes("flammable") || ctx.mediumGroup === "flammable_liquids";

    if (comments.hullSide && !isFlammableGroup) {
      ctx.observations = ctx.observations.filter((obs) => obs !== comments.hullSide);
    }

    if (ctx.space === "category_a") {
      pushUnique(
        "Nota 4: Aplicar ensayo de resistencia al fuego cuando se instalan juntas dentro de espacios de máquinas de categoría A."
      );
    }

    if (ctx.system?.id === "misc_steam" && ctx.space === "weather_deck_oil_chem_tanker") {
      const pressure = Number.isFinite(ctx.designPressureBar) ? ctx.designPressureBar : 999;
      if (pressure <= 10) {
        pushUnique(
          "2.12.10: Permitidas 'restrained slip-on' en vapor en cubierta a la intemperie para P ≤ 1 MPa."
        );
      } else {
        pushUnique("2.12.10: P > 1 MPa → no aplica permiso de 'restrained slip-on' en cubierta.");
      }
    }

    if (ctx.space === "passenger_below_bulkhead") {
      ctx.currentAllowances.pipeUnions = false;
      ctx.currentAllowances.compression = false;
      ctx.currentAllowances.slipOn = false;
      pushUnique(
        "Nota 5 / 2.12.5: Bajo la cubierta de mamparo en buques de pasaje deben evitarse juntas que puedan propagar incendio o inundación."
      );
    }

    if (isFlammableGroup) {
      pushUnique(
        "2.12.7: Minimizar juntas mecánicas; preferir bridas según norma reconocida."
      );
      pushUnique(
        "2.12.5: Evitar juntas mecánicas en tramos conectados al costado bajo cubierta o en tanques con fluidos inflamables."
      );
    }
    return ctx;
  }

  collectSystemNotes(ctx) {
    super.collectSystemNotes(ctx);
    if (this.ruleset?.FIRE_TEST_EQUIVALENCE) {
      ctx.extras.fireTestEquivalence = this.ruleset.FIRE_TEST_EQUIVALENCE;
    }
    return ctx;
  }
}

export class SSCEngine extends BaseEngine {}

export const RegulationEngines = {
  naval: NavalEngine,
  ships: ShipsEngine,
  ssc: SSCEngine,
};

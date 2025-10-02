const BASE_COUPLING_RULES = {
  pipeUnions: (clazz, odMM) => {
    if (clazz === "III") {
      return { allowed: true, reason: "+ (sin límite de OD en Class III)" };
    }
    const ok = odMM <= 60.3;
    return {
      allowed: ok,
      reason: ok ? "+ (OD ≤ 60,3 mm en Class I/II)" : "En Class I/II solo se permite OD ≤ 60,3 mm.",
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
      baseAllowances: system ? { ...system.allowed } : { pipeUnions: false, compression: false, slipOn: false },
      currentAllowances: system ? { ...system.allowed } : { pipeUnions: false, compression: false, slipOn: false },
      details: {
        pipeSystemClass: system?.pipeSystemClass ?? null,
        fireTest: system?.fireTest ?? null,
        suggestedClass: this.suggestClass(mediumGroup, designPressureBar, designTemperatureC),
        mediumGroup,
        odMM,
        design: { P: designPressureBar, T: designTemperatureC },
        classMode,
      },
      systemNotes: [],
      observations: [],
      reasons: [],
      extras: {},
    };
  }

  baseFromSystemRow(ctx) {
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
          `En Class ${ctx.usedClass}${ctx.usedClass !== "III" ? ` y OD ${odDisplay} mm` : ""} no queda ningún subtipo de compresión permitido.`
        );
      } else {
        if (ctx.usedClass !== "III") {
          ctx.observations.push("Swage/Press solo en Class III.");
          if (ctx.odMM > 60.3) {
            ctx.observations.push("En Class I/II, Bite/Typical/Flared solo hasta OD 60,3 mm.");
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
        ctx.observations.push("Slip type Grip/Slip no se permiten en Class I.");
      } else if (ctx.usedClass === "I") {
        ctx.observations.push("Grip/Slip no se permiten en Class I.");
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
    return notes;
  }

  collectObservations(ctx) {
    return ctx.observations;
  }

  finalize(ctx) {
    const categories = { ...ctx.currentAllowances };
    if (!categories.slipOn && ctx.baseAllowances?.slipOn) {
      ctx.reasons.push(
        "Slip-on permitido por la tabla base, pero bloqueado por ubicación, clase u otras condiciones del reglamento."
      );
    }
    return {
      sys: ctx.system,
      usedClass: ctx.usedClass,
      categories,
      reasons: ctx.reasons,
      details: ctx.details,
      systemNotes: ctx.systemNotes,
      observations: ctx.observations,
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
  applyLocationConstraints(ctx) {
    const tableNotes = this.ruleset?.TABLE_NOTES_ES || {};
    if (["category_a", "accommodation"].includes(ctx.space)) {
      ctx.currentAllowances.slipOn = false;
      const note2 = tableNotes["2"];
      ctx.observations.push(note2 ? `Nota 2: ${note2}` : "Slip-on bloqueado por la ubicación seleccionada (Nota 2).");
    } else if (ctx.space === "other_machinery") {
      const note2 = tableNotes["2"];
      const isFuelOil = (ctx.system?.id || "").includes("fuel_oil") || /fuel oil/i.test(ctx.system?.system || "");
      if (isFuelOil) {
        ctx.currentAllowances.slipOn = false;
        ctx.observations.push("Nota 2: Slip-on no aceptadas en líneas de fuel oil dentro de otros espacios de maquinaria.");
      } else if (note2) {
        ctx.observations.push(`Nota 2: ${note2}`);
      }
    }
    return ctx;
  }

  applyGlobalConstraints(ctx) {
    super.applyGlobalConstraints(ctx);
    const comments = this.ruleset?.GENERAL_COMMENTS || {};
    if (comments.steamDeck) {
      if (ctx.system?.id === "misc_steam" && ctx.space === "open_deck" && ctx.designPressureBar <= 10) {
        ctx.observations.push(comments.steamDeck);
      } else if (ctx.system?.id === "misc_steam") {
        ctx.observations.push(`${comments.steamDeck} (verifica P ≤ 1 MPa y ubicación en cubierta expuesta).`);
      }
    }
    if (comments.slipOnInaccessible && ["cargo_hold", "tank"].includes(ctx.space)) {
      ctx.currentAllowances.slipOn = false;
      ctx.observations.push(comments.slipOnInaccessible);
    }
    if (ctx.space === "passenger_below_bulkhead") {
      ctx.currentAllowances.pipeUnions = false;
      ctx.currentAllowances.compression = false;
      ctx.currentAllowances.slipOn = false;
      ctx.observations.push(
        "Nota 5 / 2.12.5: Bajo la cubierta de mamparo de buques de pasaje deben evitarse juntas mecánicas que puedan propagar fuego o inundación."
      );
    }
    return ctx;
  }

  collectSystemNotes(ctx) {
    const notes = super.collectSystemNotes(ctx);
    if (ctx.system?.fireTest && /not required/i.test(ctx.system.fireTest) === false) {
      ctx.observations.push(`Requiere ensayo de resistencia al fuego: ${ctx.system.fireTest}.`);
      ctx.observations.push("La junta seleccionada debe ser de tipo resistente al fuego aprobado.");
    }
    if (this.ruleset?.FIRE_TEST_EQUIVALENCE) {
      ctx.extras.fireTestEquivalence = this.ruleset.FIRE_TEST_EQUIVALENCE;
    }
    return notes;
  }
}

export class SSCEngine extends BaseEngine {}

export const RegulationEngines = {
  naval: NavalEngine,
  ships: ShipsEngine,
  ssc: SSCEngine,
};

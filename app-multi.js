const DEFAULT_JOINT_IMAGE = "./assets/joints/not-found.jpg";
const JOINT_IMAGES = {
  pipe_welded_brazed: "./assets/joints/pipe_welded_brazed.jpg",
  compression_swage: "./assets/joints/compression_swage.jpg",
  compression_press: "./assets/joints/compression_press.jpg",
  compression_typical: "./assets/joints/compression_typical.jpg",
  compression_bite: "./assets/joints/compression_bite.jpg",
  compression_flared: "./assets/joints/compression_flared.jpg",
  slip_machine_grooved: "./assets/joints/slip_machine_grooved.jpg",
  slip_grip: "./assets/joints/slip_grip.jpg",
  slip_slip: "./assets/joints/slip_slip.jpg",
};

const JOINT_VIEWER_LABELS = {
  pipe_welded_brazed: "Uniones soldadas y por braseado",
  compression_swage: "Acople de compresión tipo swage",
  compression_press: "Acople de compresión tipo press",
  compression_typical: "Acople de compresión estándar (férula)",
  compression_bite: "Acople de compresión tipo mordida",
  compression_flared: "Acople de compresión abocardado",
  slip_machine_grooved: "Junta Slip-on ranurada mecánicamente",
  slip_grip: "Junta Grip Type",
  slip_slip: "Junta Slip Type",
};

const JOINT_VIEWER_CATEGORY_LABELS = {
  pipe_welded_brazed: "Uniones para tubería",
  compression_swage: "Acoples de compresión",
  compression_press: "Acoples de compresión",
  compression_typical: "Acoples de compresión",
  compression_bite: "Acoples de compresión",
  compression_flared: "Acoples de compresión",
  slip_machine_grooved: "Juntas tipo Slip-on",
  slip_grip: "Juntas tipo Slip-on",
  slip_slip: "Juntas tipo Slip-on",
};

const JOINT_CATEGORY_TITLES = {
  pipeUnions: { es: "Uniones para tubería", en: "Pipe unions" },
  compression: { es: "Acoples de compresión", en: "Compression couplings" },
  slipOn: { es: "Juntas tipo Slip-on", en: "Slip-on joints" },
};

const JOINT_BY_CATEGORY = {
  pipeUnions: "pipe_unions",
  compression: "compression_couplings",
  slipOn: "slip_on_joints",
};

const CATEGORY_SUBTYPE_JOINTS = {
  pipeUnions: ["pipe_union_welded_brazed"],
  compression: [
    "compression_swage",
    "compression_press",
    "compression_typical",
    "compression_bite",
    "compression_flared",
  ],
  slipOn: [
    "slip_on_machine_grooved",
    "slip_on_grip",
    "slip_on_slip_type",
  ],
};

const STATUS_LABELS = {
  allowed: "Permitido",
  conditional: "Condicional",
  forbidden: "No permitido",
};

const STOP_WORDS = new Set([
  "system",
  "systems",
  "line",
  "lines",
  "service",
  "services",
  "main",
  "and",
  "the",
  "permanently",
  "filled",
]);

function tokenizeLabel(value) {
  if (!value) return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token));
}

function matchSystemIdForRule(ruleId, system, context) {
  const dataset = ruleId === "ships" ? context.lrShipsDataset : ruleId === "naval" ? context.lrNavalDataset : null;
  if (!dataset || !system) return null;

  const targetTokens = new Set();
  tokenizeLabel(system.system || "").forEach((token) => targetTokens.add(token));
  tokenizeLabel(system.id || "").forEach((token) => targetTokens.add(token));
  if (!targetTokens.size) return null;

  let bestMatch = { id: null, score: 0, remainder: Number.POSITIVE_INFINITY };

  for (const entry of dataset.systems || []) {
    const candidates = [entry.label_en, entry.label_es, entry.id];

    for (const candidate of candidates) {
      if (!candidate) continue;
      if (candidate.toLowerCase() === (system.system || "").toLowerCase()) {
        return entry.id;
      }
      const tokens = tokenizeLabel(candidate);
      if (!tokens.length) continue;
      let overlap = 0;
      for (const token of tokens) {
        if (targetTokens.has(token)) overlap += 1;
      }
      if (overlap > bestMatch.score || (overlap === bestMatch.score && tokens.length < bestMatch.remainder)) {
        bestMatch = { id: entry.id, score: overlap, remainder: tokens.length };
      }
    }
  }

  return bestMatch.score > 0 ? bestMatch.id : null;
}

function normalizeSpaceForRule(ruleId, spaceId) {
  const baseMap = {
    category_a: "machinery_cat_A",
    other_machinery: "other_machinery",
    accommodation: "accommodation",
    cargo_hold: "cargo_hold",
    tank: "tank",
    open_deck: "open_deck",
  };

  if (spaceId in baseMap) {
    return baseMap[spaceId];
  }

  if (ruleId === "ships") {
    if (spaceId === "weather_deck_oil_chem_tanker" || spaceId === "passenger_below_bulkhead") {
      return "open_deck";
    }
    if (spaceId === "munition_store") {
      return "other_machinery";
    }
  }

  if (ruleId === "naval") {
    if (spaceId === "munition_store") {
      return "munitions_store";
    }
    if (spaceId === "weather_deck_oil_chem_tanker") {
      return "open_deck";
    }
    if (spaceId === "passenger_below_bulkhead") {
      return "other_machinery";
    }
  }

  return baseMap.other_machinery;
}

const JOINT_ITEM_LABELS = {
  pipe_welded_brazed: {
    es: "Uniones soldadas y por braseado",
    en: "Welded and Brazed Types",
  },
  compression_swage: {
    es: "Tipo swage (deformado)",
    en: "Swage Type",
  },
  compression_press: {
    es: "Tipo press",
    en: "Press Type",
  },
  compression_typical: {
    es: "Tipo férula",
    en: "Typical Compression Type",
  },
  compression_bite: {
    es: "Tipo mordedor",
    en: "Bite Type",
  },
  compression_flared: {
    es: "Tipo abocardado/abocinado",
    en: "Flared Type",
  },
  slip_machine_grooved: {
    es: "Tipo ranurado (laminado/mecanizado)",
    en: "Machine Grooved Type",
  },
  slip_grip: {
    es: "Tipo grip / agarre",
    en: "Grip Type",
  },
  slip_slip: {
    es: "Tipo slip / deslizante",
    en: "Slip Type",
  },
};

const COMPRESSION_SUBTYPE_MAP = {
  swage: "compression_swage",
  press: "compression_press",
  typical: "compression_typical",
  bite: "compression_bite",
  flared: "compression_flared",
};

const SLIP_ON_SUBTYPE_MAP = {
  machine_grooved: "slip_machine_grooved",
  grip: "slip_grip",
  slip: "slip_slip",
};

const SPACES = [
  { id: "category_a", label: "Espacio de máquinas de categoría A" },
  { id: "other_machinery", label: "Otros espacios de maquinaria/servicio (accesibles)" },
  { id: "accommodation", label: "Acomodaciones" },
  { id: "munition_store", label: "Depósitos de municiones" },
  { id: "cargo_hold", label: "Bodega de carga" },
  { id: "tank", label: "Interior de tanque" },
  { id: "open_deck", label: "Cubierta expuesta / intemperie" },
  { id: "weather_deck_oil_chem_tanker", label: "Cubierta a la intemperie (petroleros/quimiqueros)" },
  { id: "passenger_below_bulkhead", label: "Bajo cubierta de mamparo (buques de pasaje)" },
];

const SCHEDULES = [
  { nps: "1/8", dn: 6, od: 10.3, label: "DN6 (1/8) – OD 10,3" },
  { nps: "1/4", dn: 8, od: 13.7, label: "DN8 (1/4) – OD 13,7" },
  { nps: "3/8", dn: 10, od: 17.2, label: "DN10 (3/8) – OD 17,2" },
  { nps: "1/2", dn: 15, od: 21.3, label: "DN15 (1/2) – OD 21,3" },
  { nps: "3/4", dn: 20, od: 26.7, label: "DN20 (3/4) – OD 26,7" },
  { nps: "1", dn: 25, od: 33.4, label: "DN25 (1) – OD 33,4" },
  { nps: "1 1/4", dn: 32, od: 42.2, label: "DN32 (1¼) – OD 42,2" },
  { nps: "1 1/2", dn: 40, od: 48.3, label: "DN40 (1½) – OD 48,3" },
  { nps: "2", dn: 50, od: 60.3, label: "DN50 (2) – OD 60,3" },
  { nps: "2 1/2", dn: 65, od: 73.0, label: "DN65 (2½) – OD 73,0" },
  { nps: "3", dn: 80, od: 88.9, label: "DN80 (3) – OD 88,9" },
  { nps: "4", dn: 100, od: 114.3, label: "DN100 (4) – OD 114,3" },
  { nps: "5", dn: 125, od: 141.3, label: "DN125 (5) – OD 141,3" },
  { nps: "6", dn: 150, od: 168.3, label: "DN150 (6) – OD 168,3" },
  { nps: "8", dn: 200, od: 219.1, label: "DN200 (8) – OD 219,1" },
];

function formatNumber(value) {
  if (!Number.isFinite(value)) return value;
  return value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function getJointLabels(kind) {
  const entry = JOINT_ITEM_LABELS[kind];
  if (entry) {
    return entry;
  }
  const label = JOINT_VIEWER_LABELS[kind] || kind;
  return { es: label, en: label };
}

function computeCategoryEvaluations({ ruleId, system, spaceId, usedClass, odMM, designPressureBar }, context) {
  const dataset = ruleId === "ships" ? context.lrShipsDataset : ruleId === "naval" ? context.lrNavalDataset : null;
  const evaluator = ruleId === "ships" ? context.evaluateLRShips : ruleId === "naval" ? context.evaluateLRNavalShips : null;
  const groupsEvaluator =
    ruleId === "ships"
      ? context.evaluateLRShipsGroups
      : ruleId === "naval"
      ? context.evaluateLRNavalGroups
      : null;
  if (!dataset || typeof evaluator !== "function" || !system) {
    return {};
  }

  const systemId = matchSystemIdForRule(ruleId, system, context);
  if (!systemId) {
    return {};
  }

  const normalizedSpace = normalizeSpaceForRule(ruleId, spaceId);
  const classLabel = typeof usedClass === "string" ? usedClass.replace(/^class\s+/i, "").trim() : undefined;
  const odValue = Number.isFinite(odMM) ? odMM : undefined;
  const pressureValue = Number.isFinite(designPressureBar) ? designPressureBar : undefined;

  const baseInput = {
    systemId,
    space: normalizedSpace,
    pipeClass: classLabel || undefined,
    od_mm: odValue,
    designPressure_bar: pressureValue,
    location: "visible_accessible",
    accessibility: "easy",
    mediumInPipeSameAsTank: true,
    lineType: "other",
  };

  if (ruleId === "naval") {
    baseInput.shipType = spaceId === "weather_deck_oil_chem_tanker" ? "oil_tanker" : "naval";
    baseInput.isSectionDirectlyConnectedToShipSide = false;
    baseInput.aboveLimitOfWatertightIntegrity = true;
    baseInput.mainMeansOfConnection = false;
    baseInput.tailoring = undefined;
  }

  const evaluations = {};
  const CLASS_LIMIT_MESSAGE = "Tabla 1.5.4/12.2.9: ningún subtipo cumple clase/OD";
  const CLASS_LIMIT_KEYWORDS = ["Tabla 1.5.4", "Tabla 12.2.9"];

  const pushUnique = (list, value) => {
    if (!Array.isArray(list)) return;
    if (!list.includes(value)) {
      list.push(value);
    }
  };

  const reasonMatchesLimit = (result) => {
    if (!result) return false;
    const directReason = typeof result.reason === "string" ? result.reason : "";
    const reasonList = Array.isArray(result.reasons) ? result.reasons : [];
    return CLASS_LIMIT_KEYWORDS.some((keyword) =>
      directReason.includes(keyword) || reasonList.some((msg) => typeof msg === "string" && msg.includes(keyword))
    );
  };

  for (const [category, groupJoint] of Object.entries(JOINT_BY_CATEGORY)) {
    const subtypeJoints = CATEGORY_SUBTYPE_JOINTS[category] || [];
    const groupInput = { ...baseInput, joint: groupJoint };
    let groupDetail = null;

    if (typeof groupsEvaluator === "function") {
      try {
        const groupResults = groupsEvaluator(groupInput, dataset);
        if (groupResults && groupResults[groupJoint]) {
          const raw = groupResults[groupJoint];
          groupDetail = {
            ...raw,
            conditions: Array.isArray(raw.conditions) ? [...raw.conditions] : [],
            reasons: Array.isArray(raw.reasons) ? [...raw.reasons] : [],
            notesApplied: Array.isArray(raw.notesApplied) ? [...raw.notesApplied] : [],
            clauses: Array.isArray(raw.clauses) ? [...raw.clauses] : [],
            trace: Array.isArray(raw.trace) ? [...raw.trace] : [],
          };
        }
      } catch (error) {
        console.warn(`No se pudo calcular estado base del grupo ${category}`, error);
      }
    }

    const subtypeResults = {};
    for (const subtypeJoint of subtypeJoints) {
      try {
        subtypeResults[subtypeJoint] = evaluator({ ...baseInput, joint: subtypeJoint });
      } catch (error) {
        console.warn(`No se pudo evaluar subtipo ${subtypeJoint}`, error);
      }
    }

    const subtypeValues = Object.values(subtypeResults);
    const anySubtypeAllowed = subtypeValues.some((entry) => entry && entry.status !== "forbidden");
    const allForbiddenByClassLimit =
      subtypeValues.length > 0 &&
      subtypeValues.every((entry) => entry && entry.status === "forbidden" && reasonMatchesLimit(entry));

    if (groupDetail) {
      if (allForbiddenByClassLimit) {
        groupDetail.status = "forbidden";
        pushUnique(groupDetail.reasons, CLASS_LIMIT_MESSAGE);
        pushUnique(groupDetail.trace, CLASS_LIMIT_MESSAGE);
        groupDetail.reason = CLASS_LIMIT_MESSAGE;
      } else {
        groupDetail.reason = groupDetail.reasons.length
          ? groupDetail.reasons[groupDetail.reasons.length - 1]
          : undefined;
        if (!anySubtypeAllowed && subtypeValues.length > 0 && !groupDetail.reasons.length) {
          groupDetail.reason = undefined;
        }
      }
      groupDetail.subtypeResults = subtypeResults;
      evaluations[category] = groupDetail;
      continue;
    }

    if (subtypeValues.length) {
      const fallback = { ...subtypeValues[0], subtypeResults };
      evaluations[category] = fallback;
    }
  }

  return evaluations;
}

const EMPTY_DICT = { groups: {}, systems: {}, conditions: {}, fireTest: {} };

function buildViewerTitle(kind) {
  const label = JOINT_VIEWER_LABELS[kind] || kind;
  const category = JOINT_VIEWER_CATEGORY_LABELS[kind];
  return category ? `${category} · ${label}` : label;
}

function parseViewerHash(hash) {
  if (!hash) return null;
  const match = hash.match(/^#view:([\w-]+)/i);
  if (!match) return null;
  const raw = match[1];
  if (raw.startsWith("trace-")) {
    return { kind: raw, mode: "trace" };
  }
  return { kind: raw, mode: "image" };
}

const canInspect = (group, subtypeAllowed) => {
  if (!group) return Boolean(subtypeAllowed);
  return group.status !== 'forbidden' && Boolean(subtypeAllowed);
};

function createSearchIcon(h) {
  return ({ className = "w-4 h-4", ...props }) =>
    h(
      "svg",
      {
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props,
      },
      h("circle", { cx: 11, cy: 11, r: 7 }),
      h("line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
    );
}

function createShieldIcon(h) {
  return ({ className = "w-6 h-6", ...props }) =>
    h(
      "svg",
      {
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props,
      },
      h("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })
    );
}

export default function App({
  RULESETS,
  RegulationEngines,
  I18N,
  ships,
  naval,
  evaluateLRShips,
  evaluateLRShipsGroups,
  evaluateLRNavalShips,
  evaluateLRNavalGroups,
  React,
  html,
}) {
  const {
    createElement: h,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } = React;

  const evaluationContext = useMemo(() => ({
    lrShipsDataset: ships,
    lrNavalDataset: naval,
    evaluateLRShips,
    evaluateLRShipsGroups,
    evaluateLRNavalShips,
    evaluateLRNavalGroups,
  }), [
    ships,
    naval,
    evaluateLRShips,
    evaluateLRShipsGroups,
    evaluateLRNavalShips,
    evaluateLRNavalGroups,
  ]);

  const SearchIcon = createSearchIcon(h);
  const ShieldIcon = createShieldIcon(h);

  const getInitialRule = () => {
    const params = new URLSearchParams(location.search);
    return params.get('rule') || localStorage.getItem('rule') || 'naval';
  };

  const [ruleId, setRuleId] = useState(() => getInitialRule());
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [classMode, setClassMode] = useState('manual');
  const [clazz, setClazz] = useState('');
  const [odMM, setOdMM] = useState(null);
  const [designPressureBar, setDesignPressureBar] = useState(7.5);
  const [designTemperatureC, setDesignTemperatureC] = useState(25);
  const [space, setSpace] = useState('other_machinery');
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationError, setEvaluationError] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [viewerImageSrc, setViewerImageSrc] = useState('');
  const [viewerImageStatus, setViewerImageStatus] = useState('idle');
  const [viewerTrace, setViewerTrace] = useState([]);
  const viewerHistoryRef = useRef(false);

  const rules = RULESETS[ruleId] ?? RULESETS.naval;
  const dict = useMemo(() => I18N[ruleId] ?? EMPTY_DICT, [ruleId]);
  const EngineClass = RegulationEngines[ruleId] ?? RegulationEngines.naval;
  const systems = rules.SYSTEMS || [];

  const tGroup = (key) => (key ? dict?.groups?.[key] ?? key : key);
  const tSystem = (id) => (id ? dict?.systems?.[id] ?? id : id);
  const tCondition = (value) => (value ? dict?.conditions?.[value] ?? value : value);
  const tFireTest = (value) => (value ? dict?.fireTest?.[value] ?? value : value);

  const resetEvaluationState = useCallback(() => {
    setEvaluation(null);
    setEvaluationError(null);
    setHasPendingChanges(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rule', ruleId);
  }, [ruleId]);

  useEffect(() => {
    if (!systems.length) {
      setSelectedSystemId(null);
      return;
    }
    if (!systems.some((item) => item.id === selectedSystemId)) {
      setSelectedSystemId(systems[0]?.id ?? null);
    }
  }, [systems, selectedSystemId]);

  useEffect(() => {
    resetEvaluationState();
    setViewer(null);
    setViewerTrace([]);
    setViewerImageSrc('');
    setViewerImageStatus('idle');
  }, [ruleId, selectedSystemId, space, clazz, odMM, resetEvaluationState]);

  const groupedSystems = useMemo(() => {
    const order = [];
    const byGroup = new Map();
    for (const item of systems) {
      if (!byGroup.has(item.group)) {
        byGroup.set(item.group, []);
        order.push(item.group);
      }
      byGroup.get(item.group).push(item);
    }
    return { order, byGroup };
  }, [systems]);

  const syncViewerFromLocation = useCallback(() => {
    const parsed = parseViewerHash(window.location.hash);
    if (parsed?.kind) {
      if (parsed.mode === 'trace') {
        const category = parsed.kind.replace(/^trace-/, '');
        const titles = JOINT_CATEGORY_TITLES[category] || { es: category, en: category };
        const traceData = evaluation?.categoryEvaluations?.[category]?.trace ?? [];
        setViewer({ open: true, kind: parsed.kind, title: `Trazas · ${titles.es}`, mode: 'trace' });
        setViewerTrace(traceData);
        setViewerImageStatus('idle');
        setViewerImageSrc('');
      } else {
        setViewer({ open: true, kind: parsed.kind, title: buildViewerTitle(parsed.kind), mode: 'image' });
      }
    } else {
      setViewer(null);
      setViewerTrace([]);
      viewerHistoryRef.current = false;
    }
  }, [evaluation]);

  const openViewer = useCallback(
    (input) => {
      if (!input) return;
      const payload = typeof input === 'string' ? { kind: input, mode: 'image' } : input;
      const kind = payload?.kind;
      if (!kind) return;
      const targetHash = `#view:${kind}`;
      const baseUrl = `${window.location.pathname}${window.location.search}`;
      const nextUrl = `${baseUrl}${targetHash}`;
      if (viewer?.open) {
        history.replaceState(null, '', nextUrl);
      } else {
        history.pushState(null, '', nextUrl);
        viewerHistoryRef.current = true;
      }
      syncViewerFromLocation();
    },
    [viewer?.open, syncViewerFromLocation]
  );

  const closeViewer = useCallback(() => {
    if (!viewer?.open) return;
    const expectedHash = viewer?.kind ? `#view:${viewer.kind}` : null;
    const baseUrl = `${window.location.pathname}${window.location.search}`;
    setViewerTrace([]);
    if (expectedHash && viewerHistoryRef.current && window.location.hash === expectedHash && window.history.length > 1) {
      history.back();
    } else {
      history.replaceState(null, '', baseUrl);
      syncViewerFromLocation();
    }
  }, [viewer?.open, viewer?.kind, syncViewerFromLocation]);

  function handleRuleChange(event) {
    setRuleId(event.target.value);
    setEvaluation(null);
    setHasPendingChanges(true);
    setEvaluationError(null);
  }

  function handleClassModeChange(nextMode) {
    if (nextMode === classMode) return;
    setClassMode(nextMode);
    markPendingChanges();
  }

  function markPendingChanges() {
    setHasPendingChanges(true);
    setEvaluation(null);
    setEvaluationError(null);
  }

  function computeEvaluation() {
    if (!selectedSystemId) {
      setEvaluationError('Selecciona un sistema antes de evaluar.');
      return;
    }
    if (!Number.isFinite(odMM)) {
      setEvaluationError('Selecciona un diámetro antes de evaluar.');
      return;
    }
    if (classMode === 'manual' && !clazz) {
      setEvaluationError('Selecciona una clase antes de evaluar.');
      return;
    }
    try {
      const engine = EngineClass.use(rules);
      const context = engine.initContext({
        systemId: selectedSystemId,
        classMode,
        clazz,
        manualClass: clazz,
        odMM,
        designPressureBar,
        designTemperatureC,
        space,
      });
      engine.baseFromSystemRow(context);
      engine.applyLocationConstraints(context);
      engine.applyClassAndODLimits(context);
      engine.applyGlobalConstraints(context);
      engine.collectSystemNotes(context);
      engine.collectObservations(context);
      const categoryEvaluations = computeCategoryEvaluations(
        {
          ruleId,
          system: context.system,
          spaceId: context.space,
          usedClass: context.usedClass,
          odMM: context.odMM,
          designPressureBar: context.designPressureBar,
        },
        evaluationContext
      );
      const result = { ...engine.finalize(context), categoryEvaluations };
      setEvaluation(result);
      setHasPendingChanges(false);
      setEvaluationError(null);
    } catch (error) {
      console.error('No se pudo completar la evaluación', error);
      setEvaluation(null);
      setEvaluationError(
        'Hubo un problema al generar la evaluación. Verifica los datos e inténtalo nuevamente.'
      );
    }
  }

  useEffect(() => {
    const handleLocationChange = () => syncViewerFromLocation();
    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [syncViewerFromLocation]);

  useEffect(() => {
    if (!(viewer?.open && viewer.kind && viewer.mode !== 'trace')) {
      setViewerImageStatus('idle');
      setViewerImageSrc('');
      return;
    }
    const desiredSrc = JOINT_IMAGES[viewer.kind] || DEFAULT_JOINT_IMAGE;
    setViewerImageStatus('loading');
    const loader = new Image();
    let cancelled = false;
    loader.src = desiredSrc;
    loader.onload = () => {
      if (!cancelled) {
        setViewerImageSrc(desiredSrc);
        setViewerImageStatus('loaded');
      }
    };
    loader.onerror = () => {
      if (!cancelled) {
        setViewerImageSrc(DEFAULT_JOINT_IMAGE);
        setViewerImageStatus('error');
      }
    };
    return () => {
      cancelled = true;
    };
  }, [viewer]);

  useEffect(() => {
    if (!viewer?.open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeViewer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewer?.open, closeViewer]);

  useEffect(() => {
    if (!(viewer?.open && viewer.mode === 'trace')) return;
    const category = viewer.kind?.replace(/^trace-/, '');
    if (!category) return;
    const traceData = evaluation?.categoryEvaluations?.[category]?.trace ?? [];
    setViewerTrace(traceData);
  }, [evaluation, viewer]);

  const system = systems.find((item) => item.id === selectedSystemId) || systems[0] || null;
  const requirements = rules.LR_REQUIREMENTS_ES || [];
  const evaluationSystem = evaluation?.system || system;
  const systemLabel = evaluationSystem
    ? `${tGroup(evaluationSystem.group)} — ${tSystem(evaluationSystem.id)}`
    : '';
  const conditionLabel = tCondition(evaluation?.pipeSystemClass || evaluationSystem?.pipeSystemClass);
  const fireTestLabel = tFireTest(evaluation?.fireTest || evaluationSystem?.fireTest);
  const usedClassLabel = evaluation?.usedClass ? evaluation.usedClass.replace('Class', 'Clase') : null;
  const odDisplay = formatNumber(evaluation?.odMM ?? odMM);
  const evaluationSpaceId = evaluation?.space || space;
  const spaceLabel = SPACES.find((opt) => opt.id === evaluationSpaceId)?.label ?? evaluationSpaceId;
  const ruleLabel = rules.subtitle || rules.title;
  const translatedGroup = tGroup(system?.group) || '—';
  const translatedSystem = tSystem(system?.id) || '—';
  const translatedCondition = tCondition(system?.pipeSystemClass);
  const translatedFireTest = tFireTest(system?.fireTest);

  const renderCategoryCard = (category) => {
    if (!evaluation) return null;
    const rawAllowed = Boolean(evaluation.allowed?.[category]);
    const detail = evaluation.categoryEvaluations?.[category];
    const status = detail?.status ?? (rawAllowed ? 'allowed' : 'forbidden');
    const allowed = status !== 'forbidden';
    const titles = JOINT_CATEGORY_TITLES[category] || { es: category, en: category };
    let subtitleExtra = '';
    let items = [];

    if (category === 'pipeUnions') {
      const reason = evaluation.details?.pipeUnionsRule?.reason;
      subtitleExtra = reason || (allowed ? 'Aplicable según Tabla 12.2.9' : '');
      items = [
        {
          kind: 'pipe_welded_brazed',
          enabled: allowed,
        },
      ];
    } else if (category === 'compression') {
      const subs = evaluation.details?.compressionSubs || {};
      subtitleExtra = allowed ? 'Subtipos según clase y OD' : 'Sin subtipos válidos con la clase/OD';
      const order = ['swage', 'press', 'typical', 'bite', 'flared'];
      items = order.map((subId) => ({
        kind: COMPRESSION_SUBTYPE_MAP[subId],
        enabled: Boolean(subs[subId]),
      }));
    } else if (category === 'slipOn') {
      const subs = evaluation.details?.slipOnSubs || {};
      subtitleExtra = allowed ? 'Machine-grooved / Grip / Slip' : 'Bloqueado por ubicación o clase';
      const order = ['machine_grooved', 'grip', 'slip'];
      items = order.map((subId) => ({
        kind: SLIP_ON_SUBTYPE_MAP[subId],
        enabled: Boolean(subs[subId]),
      }));
    }

    const statusTextMap = {
      allowed: 'Se puede usar',
      conditional: 'Uso condicionado',
      forbidden: 'No se puede usar',
    };
    const statusText = statusTextMap[status] ?? (allowed ? 'Se puede usar' : 'No se puede usar');
    const subtitle = subtitleExtra ? `${statusText} • ${subtitleExtra}` : statusText;
    const cardClass = `result-card result-card--${status}`;
    const statusLabel = STATUS_LABELS[status] || status;
    const traceAvailable = detail?.trace?.length;
    const conditions = Array.isArray(detail?.conditions) ? detail.conditions : [];
    const notesApplied = Array.isArray(detail?.notesApplied) ? detail.notesApplied : [];
    const reasons = Array.isArray(detail?.reasons) ? detail.reasons : [];
    const clauses = Array.isArray(detail?.clauses) ? detail.clauses : [];
    const groupEval = detail ?? { status };

    return html`
      <article className=${cardClass} key=${category}>
        <header className="result-header">
          <div>
            <span className="result-title-es">${titles.es}</span>
            <span className="result-title-en">(${titles.en})</span>
          </div>
          <div className="result-header-actions">
            <span className=${`status-pill status-pill--${status}`}>${statusLabel}</span>
            ${traceAvailable
              ? html`<button
                  type="button"
                  className="chip chip--ghost"
                  onClick=${() => openViewer({ kind: `trace-${category}`, mode: 'trace' })}
                >
                  VER
                </button>`
              : null}
          </div>
        </header>
        <div className="block-subtitle">${subtitle}</div>
        <div className="result-body">
          <ul className="option-list">
            ${items.map((item, idx) => {
              if (!item?.kind) return null;
              const labels = getJointLabels(item.kind);
              const disabled = !canInspect(groupEval, item.enabled);
              return html`
                <li className=${`option-item${disabled ? ' disabled' : ''}`} key=${`${item.kind}-${idx}`}>
                  <div className="option-text">
                    <span className="option-es">${labels.es}</span>
                    <span className="option-en">(${labels.en})</span>
                  </div>
                  <div className="option-actions">
                    <button
                      type="button"
                      className="chip"
                      disabled=${disabled}
                      onClick=${() => openViewer(item.kind)}
                    >
                      ver
                    </button>
                  </div>
                </li>
              `;
            })}
          </ul>
          ${status === 'conditional'
            ? html`
                <div className="status-details">
                  ${conditions.length
                    ? html`<div className="detail-block">
                        <span className="detail-title">Condiciones</span>
                        <ul className="chip-list">
                          ${conditions.map(
                            (item, idx) => html`<li className="chip" key=${`cond-${idx}`}>${item}</li>`
                          )}
                        </ul>
                      </div>`
                    : null}
                  ${notesApplied.length
                    ? html`<div className="detail-block">
                        <span className="detail-title">Notas aplicadas</span>
                        <ul className="chip-list">
                          ${notesApplied.map(
                            (note) => html`<li className="chip chip-note" key=${`note-${note}`}>
                                Nota ${note}
                              </li>`
                          )}
                        </ul>
                      </div>`
                    : null}
                </div>
              `
            : null}
          ${status === 'forbidden'
            ? html`
                <div className="status-details">
                  ${reasons.length
                    ? html`<div className="detail-block">
                        <span className="detail-title">Motivos</span>
                        <ul className="chip-list">
                          ${reasons.map(
                            (item, idx) => html`<li className="chip" key=${`reason-${idx}`}>${item}</li>`
                          )}
                        </ul>
                      </div>`
                    : null}
                  ${clauses.length
                    ? html`<div className="detail-block">
                        <span className="detail-title">Cláusulas</span>
                        <ul className="chip-list">
                          ${clauses.map((item, idx) => {
                            if (!item) return null;
                            const label = item.section ? `${item.section}: ${item.title}` : item.title;
                            return html`<li className="chip" key=${`clause-${idx}`}>${label}</li>`;
                          })}
                        </ul>
                      </div>`
                    : null}
                </div>
              `
            : null}
        </div>
      </article>
    `;
  };

  return html`
    <div className="pb-16">
      <section className="relative hero-pr max-w-6xl mx-auto px-6 py-10">
        <div className="logo-badge" aria-hidden="true" role="presentation">
          <img src="assets/joints/cotec.jpg" alt="COTECMAR" />
        </div>

        <p className="uppercase tracking-[0.4em] text-xs text-sky-400">
          LR · Juntas mecánicas
        </p>

        <h1 className="hero-title font-extrabold">
          Evaluador multi-norma Para<br />
          Juntas Mecánicas.
        </h1>

        <p className="mt-3 text-slate-300 max-w-3xl">
          Selecciona el reglamento LR aplicable, el sistema de tuberías y los parámetros de diseño…
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2"><${ShieldIcon} className="w-5 h-5 text-emerald-300" /> Flujo unificado por norma (patrón estrategia)</span>
          <span className="inline-flex items-center gap-2"><${ShieldIcon} className="w-5 h-5 text-sky-300" /> Datos y notas aislados por conjunto de reglas</span>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        <section className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 shadow-lg shadow-slate-900/40 mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Reglamento activo</span>
            <select
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value=${ruleId}
              onChange=${handleRuleChange}
            >
              ${Object.entries(RULESETS).map(([key, rule]) => html`
                <option key=${key} value=${key}>${rule.title}</option>
              `)}
            </select>
              <small className="text-slate-400">${rules.subtitle}</small>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Sistema / Servicio</span>
            <select
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
              value=${selectedSystemId ?? ''}
              onChange=${(e) => { setSelectedSystemId(e.target.value); markPendingChanges(); }}
            >
              ${groupedSystems.order.map((groupKey) => html`
                <optgroup key=${groupKey} label=${tGroup(groupKey)}>
                  ${groupedSystems.byGroup.get(groupKey).map((item) => html`
                    <option value=${item.id}>${tSystem(item.id)}</option>
                  `)}
                </optgroup>
              `)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Ubicación / espacio</span>
            <select
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
              value=${space}
              onChange=${(e) => { setSpace(e.target.value); markPendingChanges(); }}
            >
              ${SPACES.map((opt) => html`
                <option key=${opt.id} value=${opt.id}>${opt.label}</option>
              `)}
            </select>
          </label>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Modo de clase de tubería</span>
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-1 flex gap-1">
              <button
                type="button"
                className=${`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition ${classMode === 'manual'
                  ? 'bg-sky-500 text-slate-900 shadow'
                  : 'bg-transparent text-slate-200 hover:bg-slate-700/60'}`}
                onClick=${() => handleClassModeChange('manual')}
              >
                Clase
              </button>
              <button
                type="button"
                className=${`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition ${classMode === 'auto'
                  ? 'bg-sky-500 text-slate-900 shadow'
                  : 'bg-transparent text-slate-200 hover:bg-slate-700/60'}`}
                onClick=${() => handleClassModeChange('auto')}
              >
                Manual
              </button>
            </div>
            <small className="text-slate-400">
              ${classMode === 'manual'
                ? 'Selecciona Clase I / II / III.'
                : 'Ingresa presión y temperatura de diseño.'}
            </small>
          </div>

          ${classMode === 'manual'
            ? html`
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-300">Clase (I / II / III)</span>
                  <select
                    className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
                    value=${clazz}
                    onChange=${(e) => { setClazz(e.target.value); markPendingChanges(); }}
                  >
                    <option value="" disabled>Selecciona una clase...</option>
                    <option value="I">Clase I</option>
                    <option value="II">Clase II</option>
                    <option value="III">Clase III</option>
                  </select>
                </label>
              `
            : null}

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Diámetro nominal - OD</span>
            <select
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
              value=${odMM ?? ''}
              onChange=${(e) => {
                const value = e.target.value;
                setOdMM(value ? parseFloat(value) : null);
                markPendingChanges();
              }}
            >
              <option value="" disabled>Selecciona un diámetro...</option>
              ${SCHEDULES.map((opt) => html`
                <option key=${opt.od} value=${opt.od}>${opt.label}</option>
              `)}
            </select>
          </label>

          ${classMode === 'auto'
            ? html`
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-300">Presión de diseño (bar)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
                    value=${designPressureBar}
                    onChange=${(e) => { setDesignPressureBar(parseFloat(e.target.value)); markPendingChanges(); }}
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-300">Temperatura de diseño (°C)</span>
                  <input
                    type="number"
                    step="1"
                    className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
                    value=${designTemperatureC}
                    onChange=${(e) => { setDesignTemperatureC(parseFloat(e.target.value)); markPendingChanges(); }}
                  />
                </label>
              `
            : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold px-5 py-2 rounded-lg transition"
            onClick=${computeEvaluation}
            disabled=${!selectedSystemId || !systems.length}
          >
            <${SearchIcon} /> Evaluar compatibilidad
          </button>
          ${hasPendingChanges || evaluationError
            ? html`
                <div className="flex flex-col gap-1">
                  ${hasPendingChanges
                    ? html`<span className="text-sm text-slate-300">Ajustar Valores Para Evaluar</span>`
                    : null}
                  ${evaluationError
                    ? html`<span className="text-sm text-rose-300">${evaluationError}</span>`
                    : null}
                </div>
              `
            : null}
        </div>
      </section>

      ${system ? html`
        <section className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 shadow-lg shadow-slate-900/40 mb-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Grupo</p>
              <p className="text-lg font-semibold">${translatedGroup}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Sistema</p>
              <p className="text-lg font-semibold">${translatedSystem}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide">Clase usada</p>
              <p className="text-lg font-semibold">${evaluation?.usedClass ?? clazz}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
            <div>
              <span className="block text-slate-400">Condición</span>
              <span className="font-medium">${translatedCondition || '—'}</span>
            </div>
            <div>
              <span className="block text-slate-400">Ensayo de fuego</span>
              <span className="font-medium">${translatedFireTest || '—'}</span>
            </div>
            <div>
              <span className="block text-slate-400">OD seleccionado</span>
              <span className="font-medium">${formatNumber(odMM)} mm</span>
            </div>
          </div>
        </section>
      ` : null}

      ${evaluation ? html`
        <section className="space-y-8">
          <article className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">Datos del sistema evaluado</h2>
            <dl className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Reglamento</dt>
                <dd className="text-base text-slate-100">${ruleLabel}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Ubicación seleccionada</dt>
                <dd className="text-base text-slate-100">${spaceLabel}</dd>
              </div>
              <div className="flex flex-col sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Sistema / servicio</dt>
                <dd className="text-base text-slate-100">${systemLabel || '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Condición del sistema</dt>
                <dd className="text-base text-slate-100">${conditionLabel || '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Ensayo de fuego</dt>
                <dd className="text-base text-slate-100">${fireTestLabel || '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Clase utilizada</dt>
                <dd className="text-base text-slate-100">${usedClassLabel || '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Diámetro exterior (mm)</dt>
                <dd className="text-base text-slate-100">${odDisplay}</dd>
              </div>
            </dl>
          </article>
          <div className="result-row">
            ${['pipeUnions', 'compression', 'slipOn'].map((category) => renderCategoryCard(category))}
          </div>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-3">Notas específicas del sistema</h2>
              ${evaluation.systemNotes?.length
                ? html`<ul className="notes-list">${evaluation.systemNotes.map((note, idx) => html`<li key=${idx}>${note}</li>`)}</ul>`
                : html`<p className="text-sm text-slate-400">La fila seleccionada no incluye notas adicionales.</p>`}
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-3">Observaciones (evaluación)</h2>
              ${(() => {
                const groups = evaluation?.categoryEvaluations ?? {};
                const blocked = Object.values(groups).filter((group) => group?.status === 'forbidden');

                if (blocked.length) {
                  const lines = [];
                  blocked.forEach((group) => {
                    const groupReasons = Array.isArray(group?.reasons) ? group.reasons : [];
                    const groupClauses = Array.isArray(group?.clauses) ? group.clauses : [];
                    groupReasons.forEach((reason) => {
                      if (reason) {
                        lines.push(`• ${reason}`);
                      }
                    });
                    groupClauses.forEach((clause) => {
                      if (clause) {
                        const label = clause.section ? `${clause.section}: ${clause.title}` : clause.title;
                        lines.push(`• ${label}`);
                      }
                    });
                    if (!groupReasons.length && !groupClauses.length) {
                      lines.push('• Uso condicionado o bloqueado por otras condiciones del reglamento.');
                    }
                  });

                  return html`<ul className="observations-list">${lines.map(
                    (text, idx) => html`<li key=${`blocked-${idx}`}>${text}</li>`
                  )}</ul>`;
                }

                const applied = evaluation
                  ? Array.from(
                      new Set(
                        [
                          ...(Array.isArray(evaluation.observations) ? evaluation.observations : []),
                          ...(Array.isArray(evaluation.conditions) ? evaluation.conditions : []),
                          ...(Array.isArray(evaluation.reasons) ? evaluation.reasons : []),
                        ].filter(Boolean)
                      )
                    )
                  : [];
                return applied.length
                  ? html`<ul className="observations-list">${applied.map(
                      (obs, idx) => html`<li key=${`obs-${idx}`}>• ${obs}</li>`
                    )}</ul>`
                  : html`<p className="text-sm text-slate-400">Sin observaciones adicionales para las condiciones ingresadas.</p>`;
              })()}
            </div>
          </section>

          <section className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">Recomendaciones y requisitos LR</h2>
            ${requirements.length
              ? html`<ul className="requirements-list">${requirements.map((req) => html`<li key=${req.id}><strong>${req.id}</strong>: ${req.text}</li>`)}</ul>`
              : html`<p className="text-sm text-slate-400">Sin requisitos adicionales configurados para esta norma.</p>`}
          </section>
        </section>
      ` : html`
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 text-sm text-slate-300">
          Configura los parámetros y pulsa <strong>Evaluar compatibilidad</strong> para generar el informe.
        </div>
      `}
      </div>

      ${viewer?.open ? html`
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick=${closeViewer}
      >
        <div
          className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
          onClick=${(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-lg font-semibold">${viewer.title}</h3>
            <button className="text-slate-300 hover:text-slate-100" onClick=${closeViewer}>Cerrar</button>
          </div>
          ${viewer.mode === 'trace'
            ? html`
                <div className="p-4">
                  ${viewerTrace.length
                    ? html`<ol className="trace-list">${viewerTrace.map((line, idx) => html`<li key=${idx}>${line}</li>`)}</ol>`
                    : html`<p className="text-sm text-slate-400">Sin trazas registradas para esta evaluación.</p>`}
                </div>
                <div className="px-4 pb-4 text-xs text-slate-400">Secuencia normativa aplicada al resultado.</div>
              `
            : html`
                <div className="p-4">
                  ${viewerImageStatus === 'loading'
                    ? html`<p className="text-sm text-slate-400">Cargando imagen…</p>`
                    : html`<img src=${viewerImageSrc || DEFAULT_JOINT_IMAGE} alt=${viewer.title} className="w-full h-auto rounded-lg" />`}
                </div>
                ${viewerImageStatus === 'error'
                  ? html`<div className="px-4 pb-4 text-xs text-rose-300">No se encontró una imagen específica; se muestra la referencia genérica.</div>`
                  : html`<div className="px-4 pb-4 text-xs text-slate-400">Referencia fotográfica para el tipo de unión seleccionado.</div>`}
              `}
        </div>
      </div>
    ` : null}
    </div>
  `;
}

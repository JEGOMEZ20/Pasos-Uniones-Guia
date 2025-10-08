import React, { useEffect, useMemo, useState } from 'react';
import type { Dataset, ClassName, System, JointKey } from '../core/types';
import { evaluate, type EvalItem } from '../core/evaluator';

const STATUS_LABEL: Record<EvalItem['status'], string> = {
  ok: 'Permitido',
  warn: 'Condicional',
  no: 'No permitido',
};

function statusClass(status: EvalItem['status']): string {
  switch (status) {
    case 'ok': return 'status-pill status-ok';
    case 'warn': return 'status-pill status-warn';
    default: return 'status-pill status-no';
  }
}

const CLASS_OPTIONS: { value: ClassName; label: string }[] = [
  { value: 'I', label: 'Clase I' },
  { value: 'II', label: 'Clase II' },
  { value: 'III', label: 'Clase III' },
];

interface Props { dataset: Dataset }

export default function Evaluator({ dataset }: Props) {
  const [systemKey, setSystemKey] = useState<string>('');
  const [pipeClass, setPipeClass] = useState<ClassName>('I');
  const [space, setSpace] = useState<string>('');
  const [od, setOd] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [sameMedium, setSameMedium] = useState<boolean>(true);
  const [axial, setAxial] = useState<boolean>(false);
  const [aboveWLI, setAboveWLI] = useState<boolean>(false);
  const [results, setResults] = useState<EvalItem[]>([]);
  const [evaluated, setEvaluated] = useState<boolean>(false);

  useEffect(() => {
    const firstGroup = dataset.SYSTEM_GROUPS[0];
    const firstSystem = firstGroup?.systems[0];
    setSystemKey(firstSystem?.key ?? '');
    setPipeClass('I');
    setSpace(dataset.SPACES[0]?.key ?? '');
    setOd('');
    setVisible(false);
    setSameMedium(true);
    setAxial(false);
    setAboveWLI(false);
    setResults([]);
    setEvaluated(false);
  }, [dataset]);

  const systemMap = useMemo(() => {
    const map = new Map<string, { group: string; system: System }>();
    for (const group of dataset.SYSTEM_GROUPS) {
      for (const system of group.systems) {
        map.set(system.key, { group: group.label, system });
      }
    }
    return map;
  }, [dataset]);

  const jointLabel = useMemo(() => {
    const map = new Map<JointKey, string>();
    dataset.JOINT_TYPES.forEach(j => map.set(j.key, j.label));
    return map;
  }, [dataset]);

  const selected = systemMap.get(systemKey);
  const selectedSystem = selected?.system;

  const selectedNotes = useMemo(() => {
    if (!selectedSystem) return [];
    return (selectedSystem.notes || [])
      .map(code => dataset.NOTES[code])
      .filter((note): note is NonNullable<typeof note> => Boolean(note));
  }, [dataset.NOTES, selectedSystem]);

  const generalNotes = useMemo(() => Object.values(dataset.GENERAL), [dataset.GENERAL]);

  const handleEvaluate = () => {
    if (!systemKey) return;
    const numericOd = od.trim() === '' ? NaN : Number(od);
    const evalResults = evaluate(
      dataset,
      {
        systemKey,
        pipeClass,
        space,
        od: Number.isFinite(numericOd) ? numericOd : NaN,
        visible,
        sameMedium,
        axial,
        aboveWLI,
      },
      systemKey,
    );
    setResults(evalResults);
    setEvaluated(true);
  };

  return (
    <div className="evaluator">
      <div className="card form-card">
        <header className="card-header">
          <div>
            <h2 className="card-title">{dataset.title}</h2>
            <p className="card-subtitle">Selecciona sistema, espacio y parámetros de instalación para evaluar los tipos de junta mecánica.</p>
          </div>
        </header>
        <div className="form-grid">
          <div className="form-field">
            <label>Sistema / línea</label>
            <select value={systemKey} onChange={e => setSystemKey(e.target.value)}>
              {dataset.SYSTEM_GROUPS.map(group => (
                <optgroup key={group.key} label={group.label}>
                  {group.systems.map(system => (
                    <option key={system.key} value={system.key}>{system.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Clase de tubería</label>
            <select value={pipeClass} onChange={e => setPipeClass(e.target.value as ClassName)}>
              {CLASS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Espacio / ubicación</label>
            <select value={space} onChange={e => setSpace(e.target.value)}>
              {dataset.SPACES.map(sp => (
                <option key={sp.key} value={sp.key}>{sp.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Diámetro exterior (mm)</label>
            <input value={od} onChange={e => setOd(e.target.value)} placeholder="Ej. 76" type="number" min="0" step="0.1" />
          </div>
        </div>
        <div className="checkbox-grid">
          <label className="checkbox-item">
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
            <span>Visible y accesible</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={sameMedium} onChange={e => setSameMedium(e.target.checked)} />
            <span>Mismo medio dentro del tanque</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={axial} onChange={e => setAxial(e.target.checked)} />
            <span>Compensa dilatación axial (slip type)</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={aboveWLI} onChange={e => setAboveWLI(e.target.checked)} />
            <span>Por encima del límite de estanqueidad</span>
          </label>
        </div>
        <div className="actions-row">
          <button type="button" className="btn" onClick={handleEvaluate}>Evaluar</button>
          {selectedSystem && (
            <span className="muted">Ensayo fuego fila: {selectedSystem.fire || 'No indicado'}</span>
          )}
        </div>
        {selected && selectedNotes.length > 0 && (
          <div className="notes-block">
            <h3>Notas de la fila</h3>
            <ul>
              {selectedNotes.map(note => (
                <li key={note.id}><strong>Nota {note.id}:</strong> {note.es}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card results-card">
        <div className="results-header">
          <h3 className="card-title">Resultado</h3>
          <div className="status-legend">
            <span className="status-pill status-ok">Permitido</span>
            <span className="status-pill status-warn">Condicional</span>
            <span className="status-pill status-no">No permitido</span>
          </div>
        </div>
        {evaluated && results.length === 0 && (
          <div className="empty-state">No hay resultados disponibles con la selección actual.</div>
        )}
        <div className="results-grid">
          {results.map(item => (
            <article key={item.jt} className="result-card">
              <header>
                <div>
                  <h4>{jointLabel.get(item.jt) ?? item.jt}</h4>
                  {selected && <p className="muted">Sistema: {selected.system.label}</p>}
                </div>
                <span className={statusClass(item.status)}>{STATUS_LABEL[item.status]}</span>
              </header>
              {item.reasons.length > 0 ? (
                <ul className="reason-list">
                  {item.reasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                </ul>
              ) : (
                <p className="muted">Sin observaciones adicionales.</p>
              )}
            </article>
          ))}
        </div>
      </div>

      {generalNotes.length > 0 && (
        <div className="card general-card">
          <h3 className="card-title">Criterios generales</h3>
          <ul>
            {generalNotes.map(rule => (
              <li key={rule.id}><strong>{rule.id}:</strong> {rule.es}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import Evaluator from './Evaluator';
import { datasetNaval } from '../data/lr-naval';
import { datasetShips } from '../data/lr-ships';

const DATASETS = { naval: datasetNaval, ships: datasetShips } as const;

type DatasetKey = keyof typeof DATASETS;

export default function StandardSelector(){
  const [std, setStd] = useState<DatasetKey>('naval');
  return (
    <div className="selector-shell">
      <div className="selector-bar">
        <label className="selector-label">Norma</label>
        <select className="selector-select" value={std} onChange={e=>setStd(e.target.value as DatasetKey)}>
          <option value="naval">LR Naval</option>
          <option value="ships">LR Ships</option>
        </select>
      </div>
      <Evaluator dataset={DATASETS[std]} />
    </div>
  );
}

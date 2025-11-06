import React from 'react';

type Norma = 'LR Naval' | 'LR Ships';
type Grupo =
  | 'Steam'
  | 'Thermal oil'
  | 'Flammable liquids'
  | 'Other media'
  | 'Cargo oil';

type Limits = {
  P2_bar: number; // Class II
  T2_C: number;
  P1_bar: number; // Class III
  T1_C: number;
  shipsOnly?: boolean; // para ocultar en Naval
};

const LIMITS: Record<Grupo, Limits> = {
  Steam:             { P2_bar: 16, T2_C: 300, P1_bar: 7,  T1_C: 170 },
  'Thermal oil':     { P2_bar: 16, T2_C: 300, P1_bar: 7,  T1_C: 150 },
  'Flammable liquids': { P2_bar: 16, T2_C: 150, P1_bar: 7,  T1_C: 60  },
  'Other media':     { P2_bar: 40, T2_C: 300, P1_bar: 16, T1_C: 200 },
  'Cargo oil':       { P2_bar: 40, T2_C: 300, P1_bar: 16, T1_C: 200, shipsOnly: true },
};

function toMPa(bar: number) {
  return +(bar / 10).toFixed(2);
}

function getGrupoFromUI(value: string): Grupo | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes('vapor') || normalized.includes('steam')) return 'Steam';
  if (normalized.includes('térmico') || normalized.includes('thermal')) return 'Thermal oil';
  if (
    normalized.includes('cargo') ||
    normalized.includes('crudo') ||
    normalized.includes('derivado') ||
    normalized.includes('crude')
  ) {
    return 'Cargo oil';
  }
  if (
    normalized.includes('inflamable') ||
    normalized.includes('combustible') ||
    normalized.includes('fuel') ||
    normalized.includes('aceite') ||
    normalized.includes('oil')
  ) {
    return 'Flammable liquids';
  }
  return 'Other media';
}

export interface ClaseCardProps {
  norma: Norma | null;
  grupoDeSistemaLabel: string | null; // texto del select actual (grupo + sistema)
  clase: 'Clase I' | 'Clase II' | 'Clase III' | null;
}

export const ClaseLimitsCard: React.FC<ClaseCardProps> = ({
  norma,
  grupoDeSistemaLabel,
  clase,
}) => {
  if (!norma || !grupoDeSistemaLabel || !clase) return null;

  const grupo = getGrupoFromUI(grupoDeSistemaLabel);
  if (!grupo) return null;

  const lim = LIMITS[grupo];
  if (!lim) return null;

  if (norma === 'LR Naval' && lim.shipsOnly) {
    return (
      <InfoCard
        title="Límites por clase"
        body="El servicio seleccionado no aplica en LR Naval (no hay límites tabulados para este medio). Selecciona otro grupo de sistema."
      />
    );
  }

  const p2_mpa = toMPa(lim.P2_bar);
  const p1_mpa = toMPa(lim.P1_bar);

  if (clase === 'Clase I') {
    return (
      <InfoCard
        title="Límites por clase – Clase I"
        body={
          `Clase I no tiene límite tabulado de P/T. Se selecciona cuando ` +
          `P > P₂ o T > T₂ del medio seleccionado.\n\n` +
          `Umbrales (Clase II) para este medio:\n` +
          `• P₂ = ${lim.P2_bar} bar (${p2_mpa} MPa)\n` +
          `• T₂ = ${lim.T2_C} °C`
        }
        hint={`Norma: ${norma}`}
      />
    );
  }

  if (clase === 'Clase II') {
    return (
      <InfoCard
        title="Límites por clase – Clase II"
        body={
          `Máximos permitidos para el medio seleccionado:\n` +
          `• P₂ = ${lim.P2_bar} bar (${p2_mpa} MPa)\n` +
          `• T₂ = ${lim.T2_C} °C`
        }
        hint={`Norma: ${norma}`}
      />
    );
  }

  return (
    <InfoCard
      title="Límites por clase – Clase III"
      body={
        `Máximos permitidos para el medio seleccionado:\n` +
        `• P₁ = ${lim.P1_bar} bar (${p1_mpa} MPa)\n` +
        `• T₁ = ${lim.T1_C} °C`
      }
      hint={`Norma: ${norma}`}
    />
  );
};

const InfoCard: React.FC<{ title: string; body: string; hint?: string }> = ({ title, body, hint }) => (
  <div className="info-card">
    <div className="info-card-title">{title}</div>
    <pre className="info-card-body">{body}</pre>
    {hint && <div className="info-card-hint">{hint}</div>}
  </div>
);


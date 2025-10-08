import { Dataset, JointKey, ClassRules, ClassName } from './types';

const mm = (n: any) => Number.isFinite(n) ? n : NaN;

export interface EvalInput {
  systemKey: string;
  pipeClass: ClassName;
  space: string;
  od: number;
  visible: boolean;      // “visible y accesible”
  sameMedium: boolean;   // dentro de tanque, ¿mismo medio?
  axial: boolean;        // slip type: ¿compensación axial?
  aboveWLI: boolean;     // drenajes internos: por encima del L.E.
}

export type EvalStatus = 'ok'|'warn'|'no';

export interface EvalItem { jt: JointKey; status: EvalStatus; reasons: string[] }

export function evaluate(dataset: Dataset, input: EvalInput, systemKey: string): EvalItem[] {
  const group = dataset.SYSTEM_GROUPS.find(g => g.systems.some(s => s.key === systemKey));
  const sys = group?.systems.find(s => s.key === systemKey);
  if (!sys) return [];

  const items: EvalItem[] = [];
  const classRules = dataset.CLASS_RULES;

  for (const jt of dataset.JOINT_TYPES) {
    const baseAllowed = !!sys.allow[jt.key];
    let status: EvalStatus = baseAllowed ? 'ok' : 'no';
    const reasons: string[] = [];

    if (!baseAllowed) {
      items.push({ jt: jt.key, status, reasons: ['No permitido por tabla de sistemas.'] });
      continue;
    }

    // Tabla por Clase / OD
    const cr = (classRules[jt.key] || {}) as Partial<ClassRules>;
    const rule = cr[input.pipeClass];
    if (rule) {
      if (!rule.allowed) {
        status = 'no';
        reasons.push(`No permitido para Clase ${input.pipeClass}.`);
      } else if (rule.odLE && mm(input.od) > rule.odLE) {
        status = 'no';
        reasons.push(`OD > ${rule.odLE} mm no permitido para Clase ${input.pipeClass}.`);
      }
    }

    // Notas de la fila
    if (status !== 'no' && sys.notes?.length) {
      for (const nc of sys.notes) {
        // Nota 2: slip-on restrictions (norma dependiente)
        if (nc === 'n2' && jt.key.startsWith('slip_')) {
          const ban = dataset.EXTRA?.n2_forbiddenSpaces || [];
          const vis = dataset.EXTRA?.n2_visibleOnlySpaces || [];
          if (ban.includes(input.space)) {
            status = 'no';
            reasons.push('Slip-on prohibido en este espacio (Nota 2).');
          } else if (vis.includes(input.space)) {
            status = status === 'ok' ? 'warn' : status;
            if (!input.visible) reasons.push('Debe estar en posición visible y accesible (Nota 2).');
          }
        }

        if (nc === 'n1') {
          if (input.space === 'mach_cat_a') {
            status = status === 'ok' ? 'warn' : status;
            reasons.push('Requiere tipo resistente al fuego aprobado (Nota 1).');
            if (sys.key === 'bilge') {
              reasons.push('En bilge main (Cat. A): acoplamientos de acero/CuNi o equivalente (Nota 1).');
            }
          }
        }

        if (nc === 'n3') {
          if (input.space !== 'open_deck') {
            status = status === 'ok' ? 'warn' : status;
            reasons.push('Requiere tipo resistente al fuego aprobado (Nota 3, no cubierta abierta).');
          }
        }

        if (nc === 'n6' && sys.key === 'deck_drains_internal') {
          status = status === 'ok' ? 'warn' : status;
          if (!input.aboveWLI) reasons.push('Sólo por encima del límite de estanqueidad (Nota 6).');
        }
      }
    }

    // Reglas generales, idénticas entre normas (ajusta si LR Ships difiere)
    if (status !== 'no' && jt.key.startsWith('slip_')) {
      if (input.space === 'cargo_hold') {
        status = 'no';
        reasons.push('Slip-on no en bodegas/carga (Regla general).');
      }
      if (input.space === 'inside_tank') {
        status = status === 'ok' ? 'warn' : status;
        if (!input.sameMedium) reasons.push('En tanques: sólo si el medio coincide con el del tanque.');
      }
    }
    if (status !== 'no' && jt.key === 'slip_type') {
      status = status === 'ok' ? 'warn' : status;
      if (!input.axial) reasons.push('Slip type como medio principal: sólo si compensa dilatación axial.');
    }

    items.push({ jt: jt.key, status, reasons });
  }

  return items;
}

export type ClassName = 'I'|'II'|'III';
export type JointKey =
  | 'pipe_union_welded_brazed'
  | 'comp_swage' | 'comp_bite' | 'comp_typical' | 'comp_flared' | 'comp_press'
  | 'slip_mgrooved' | 'slip_grip' | 'slip_type';

export interface JointType { key: JointKey; group: 'Pipe unions'|'Compression couplings'|'Slip-on joints'; label: string; }
export interface ClassRule { allowed: boolean; odLE?: number }
export type ClassRules = Record<ClassName, ClassRule>;

export interface Note { id: string; es: string; en: string }
export interface GeneralRule { id: string; es: string; en: string }

export interface Space { key: string; label: string }

export interface System {
  key: string;
  label: string;
  // “+ / –” por tipo de junta
  allow: Record<JointKey, boolean>;
  // ids de notas (n1, n2, …) referenciadas por la fila
  notes: string[];
  // texto visible del ensayo fuego en esa fila
  fire: string;
}

export interface SystemGroup {
  key: string;
  label: string;
  systems: System[];
}

export interface Dataset {
  id: 'naval'|'ships';
  title: string;
  JOINT_TYPES: JointType[];
  SPACES: Space[];
  NOTES: Record<string, Note>;
  GENERAL: Record<string, GeneralRule>;
  CLASS_RULES: Record<JointKey, Partial<ClassRules>>;
  SYSTEM_GROUPS: SystemGroup[];
  // Diferencias sutiles por norma (ej. alcance de Nota 2)
  EXTRA?: {
    n2_forbiddenSpaces?: string[];      // espacios donde slip-on está prohibido
    n2_visibleOnlySpaces?: string[];    // espacios donde exige “visible/accesible”
  }
}

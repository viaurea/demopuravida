export type DocStatus = 'ok' | 'warning' | 'expired';

export interface Driver {
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  docs: Record<string, string>;
  notes?: string;
}

export const DOC_COLUMNS = [
  'CDL (Clase A)',
  'Certificado Medico DOT',
  'Revision MVR',
  'Drug & Alcohol Clearinghouse',
  'Registro del Vehiculo',
  'Inspeccion Anual DOT',
  'Seguro (Resp. y Carga)',
];

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((d.getTime() - todayUTC().getTime()) / 86400000);
}

export function statusOf(days: number): DocStatus {
  if (days < 0) return 'expired';
  if (days <= 30) return 'warning';
  return 'ok';
}

export function statusLabel(s: DocStatus): string {
  return s === 'expired' ? 'Caducado' : s === 'warning' ? 'Próximo a caducar' : 'Al día';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function nearestDoc(driver: Driver): { label: string; date: string; days: number } {
  let best: { label: string; date: string; days: number } | null = null;
  for (const [label, date] of Object.entries(driver.docs)) {
    if (!date) continue;
    const d = daysUntil(date);
    if (!best || d < best.days) best = { label, date, days: d };
  }
  return best || { label: '—', date: '', days: Infinity };
}

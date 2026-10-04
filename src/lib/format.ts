/**
 * Formatos únicos para toda la app (es-AR).
 */

const moneyFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const moneyCompactFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const percentFmt = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 });

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** $ 1.234.567 (hasta 2 decimales si los hay). */
export function formatMoney(value: unknown): string {
  return moneyFmt.format(toNumber(value));
}

/** $ 1,2 M — para ejes y espacios chicos. */
export function formatMoneyCompact(value: unknown): string {
  return moneyCompactFmt.format(toNumber(value));
}

export function formatNumber(value: unknown): string {
  return numberFmt.format(toNumber(value));
}

/** 0.256 → 25,6 % */
export function formatPercent(ratio: unknown): string {
  return percentFmt.format(toNumber(ratio));
}

/** 04/10/2026 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** 04/10/2026 14:30 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(d)} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export const PRICE_TYPE_LABELS: Record<string, string> = {
  cash: 'Contado',
  debit: 'Débito',
  financed: 'Financiado',
};

/** Zona horaria del negocio (Argentina). */
export const BUSINESS_TZ = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy en la zona del negocio, formato YYYY-MM-DD (para inputs date). */
export function todayISODate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BUSINESS_TZ });
}

/**
 * Convierte la fecha de un input date (YYYY-MM-DD) en un instante: si es hoy,
 * la hora actual; si no, el mediodía de ese día en Argentina. Así la venta o
 * compra no cae en el día anterior al mostrarse en hora local.
 */
export function dateInputToInstant(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (value === todayISODate()) return new Date();
    return new Date(`${value}T12:00:00-03:00`);
  }
  return new Date(value);
}

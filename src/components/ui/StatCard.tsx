import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Tarjeta de indicador: etiqueta, valor principal y detalle. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'neutral' | 'warning' | 'danger';
  className?: string;
  children?: React.ReactNode;
}) {
  const iconTone =
    tone === 'danger'
      ? 'bg-red-50 text-red-600'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-600'
        : 'bg-zinc-100 text-zinc-500';
  return (
    <div className={cn('rounded-card border border-zinc-200 bg-white p-4 shadow-card sm:p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500 sm:text-sm">{label}</p>
        {Icon && (
          <span className={cn('hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex', iconTone)}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 tabular sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type BusinessSettings } from './settings-defaults';

let cache: { tenantKey: string; promise: Promise<BusinessSettings> } | null = null;

async function fetchSettings(): Promise<BusinessSettings> {
  const res = await fetch('/api/tenant/settings', { cache: 'no-store' });
  if (!res.ok) return DEFAULT_SETTINGS;
  const data = await res.json();
  return { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) };
}

/**
 * Configuración del negocio activo (etiquetas de variantes, márgenes por
 * defecto, redondeo). Devuelve los valores por defecto mientras carga.
 * `tenantKey` invalida la caché al cambiar de negocio.
 */
export function useBusinessSettings(tenantKey = ''): BusinessSettings {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!cache || cache.tenantKey !== tenantKey) {
      cache = { tenantKey, promise: fetchSettings() };
    }
    let alive = true;
    cache.promise.then((s) => alive && setSettings(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [tenantKey]);

  return settings;
}

/** Llamar después de guardar la configuración. */
export function invalidateBusinessSettings() {
  cache = null;
}

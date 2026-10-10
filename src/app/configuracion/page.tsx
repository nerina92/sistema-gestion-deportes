'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FaCog, FaStore, FaTags, FaDatabase, FaUsers, FaSave } from 'react-icons/fa';
import { BUSINESS_TYPE_PRESETS, DEFAULT_SETTINGS, type BusinessSettings } from '@/lib/settings-defaults';
import { invalidateBusinessSettings } from '@/lib/use-business-settings';

const inputClass =
  'w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-zinc-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500 mt-1">{hint}</span>}
    </label>
  );
}

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const activeTenant = session?.tenants.find((t) => t.tenantId === session.tenantId);

  useEffect(() => {
    fetch('/api/tenant/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => data.success && setForm({ ...DEFAULT_SETTINGS, ...data.settings }))
      .finally(() => setLoading(false));
  }, [session?.tenantId]);

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (type: string) => {
    const preset = BUSINESS_TYPE_PRESETS[type];
    setForm((prev) => ({
      ...prev,
      businessType: type,
      ...(preset ? { variantAttr1Label: preset.attr1, variantAttr2Label: preset.attr2, useVariants: preset.useVariants } : {}),
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // La tienda online se configura en Integraciones: no pisar esos campos.
        body: JSON.stringify(
          Object.fromEntries(Object.entries(form).filter(([key]) => !key.startsWith('store')))
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo guardar');
      setForm({ ...DEFAULT_SETTINGS, ...data.settings });
      invalidateBusinessSettings();
      setMessage({ type: 'ok', text: 'Configuración guardada' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
          <FaCog className="size-6 shrink-0 text-brand-600" />
          Configuración
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Datos y parámetros de {activeTenant?.name ?? 'tu negocio'}</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Datos del negocio */}
        <section className="bg-white rounded-card shadow-card border border-zinc-200">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-medium text-zinc-900 flex items-center">
              <FaStore className="mr-2 text-green-500" />
              Datos del negocio
            </h2>
            <p className="text-sm text-zinc-600 mt-1">Se usan en el encabezado de las facturas.</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre comercial">
              <input className={inputClass} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} disabled={loading} />
            </Field>
            <Field label="Rubro" hint="Al cambiarlo se sugieren las etiquetas de variantes.">
              <select className={inputClass} value={form.businessType} onChange={(e) => applyPreset(e.target.value)} disabled={loading}>
                {Object.entries(BUSINESS_TYPE_PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
                {!BUSINESS_TYPE_PRESETS[form.businessType] && <option value={form.businessType}>{form.businessType}</option>}
              </select>
            </Field>
            <Field label="Dirección">
              <input className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} disabled={loading} />
            </Field>
            <Field label="Localidad">
              <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} disabled={loading} />
            </Field>
            <Field label="Condición frente al IVA">
              <input className={inputClass} value={form.taxCondition} onChange={(e) => set('taxCondition', e.target.value)} disabled={loading} />
            </Field>
          </div>
        </section>

        {/* Productos y precios */}
        <section className="bg-white rounded-card shadow-card border border-zinc-200">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-medium text-zinc-900 flex items-center">
              <FaTags className="mr-2 text-brand-500" />
              Productos y precios
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Cómo se llaman las variantes de tus productos y los porcentajes por defecto para productos nuevos.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Atributo 1 de la variante" hint="Ej.: Talle, Medida, Tamaño, Modelo">
              <input className={inputClass} value={form.variantAttr1Label} onChange={(e) => set('variantAttr1Label', e.target.value)} disabled={loading} />
            </Field>
            <Field label="Atributo 2 de la variante" hint="Ej.: Color, Material, Sabor, Capacidad">
              <input className={inputClass} value={form.variantAttr2Label} onChange={(e) => set('variantAttr2Label', e.target.value)} disabled={loading} />
            </Field>
            <Field label="Margen contado (%)" hint="Sobre el costo">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.defaultMarginCash} onChange={(e) => set('defaultMarginCash', Number(e.target.value))} disabled={loading} />
            </Field>
            <Field label="Recargo débito (%)" hint="Sobre el precio contado">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.defaultSurchargeDebit} onChange={(e) => set('defaultSurchargeDebit', Number(e.target.value))} disabled={loading} />
            </Field>
            <Field label="Recargo financiado (%)" hint="Sobre el precio contado">
              <input type="number" min={0} step="0.01" className={inputClass} value={form.defaultSurchargeFinanced} onChange={(e) => set('defaultSurchargeFinanced', Number(e.target.value))} disabled={loading} />
            </Field>
            <Field label="Redondeo de precios" hint="Los precios calculados se redondean a este múltiplo">
              <select className={inputClass} value={form.priceRounding} onChange={(e) => set('priceRounding', Number(e.target.value))} disabled={loading}>
                <option value={0}>Sin redondeo</option>
                <option value={1}>$ 1</option>
                <option value={10}>$ 10</option>
                <option value={50}>$ 50</option>
                <option value={100}>$ 100</option>
                <option value={500}>$ 500</option>
                <option value={1000}>$ 1.000</option>
              </select>
            </Field>
            <Field label="Alerta de stock mínimo por defecto" hint="Para productos importados desde Excel">
              <input type="number" min={0} step={1} className={inputClass} value={form.defaultMinStockAlert} onChange={(e) => set('defaultMinStockAlert', Number(e.target.value))} disabled={loading} />
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4">
          {message && (
            <span className={`text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</span>
          )}
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-md hover:bg-brand-700 disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integraciones */}
        <section id="integraciones" className="bg-white rounded-card shadow-card border border-zinc-200">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-medium text-zinc-900 flex items-center">
              <FaDatabase className="mr-2 text-brand-500" />
              Integraciones
            </h2>
          </div>
          <ul className="p-6 space-y-3 text-sm">
            <li>
              <Link href="/integraciones/afip" className="text-brand-600 hover:text-brand-800 underline">
                AFIP — Facturación electrónica
              </Link>
            </li>
            <li>
              <Link href="/integraciones/tiendanube" className="text-brand-600 hover:text-brand-800 underline">
                Tienda Nube
              </Link>
            </li>
            <li>
              <Link href="/integraciones/tienda" className="text-brand-600 hover:text-brand-800 underline">
                Tienda online propia
              </Link>
            </li>
            <li>
              <Link href="/facturas" className="text-brand-600 hover:text-brand-800 underline">
                Facturas emitidas
              </Link>
            </li>
          </ul>
        </section>

        {/* Usuarios */}
        <section className="bg-white rounded-card shadow-card border border-zinc-200">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-medium text-zinc-900 flex items-center">
              <FaUsers className="mr-2 text-orange-500" />
              Usuarios
            </h2>
          </div>
          <div className="p-6 text-sm text-zinc-600 space-y-3">
            <p>Invitá a tu equipo y asigná qué puede hacer cada uno.</p>
            <Link href="/configuracion/usuarios" className="text-brand-600 hover:text-brand-800 underline">
              Administrar usuarios
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

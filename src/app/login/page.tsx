import { signIn } from '@/lib/auth';

const ERROR_MESSAGES: Record<string, string> = {
  NoInvitation:
    'Tu cuenta de Google no tiene acceso. El acceso es solo por invitación: pedile al administrador de tu negocio que te invite con este email.',
  AccessDenied:
    'Tu cuenta de Google no tiene acceso. El acceso es solo por invitación: pedile al administrador de tu negocio que te invite con este email.',
  Configuration: 'Hay un problema con la configuración del login. Avisá al administrador.',
};

function safeCallbackUrl(value: string | undefined): string {
  // Solo rutas internas, para evitar redirecciones abiertas.
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'No se pudo iniciar sesión. Intentá de nuevo.' : null;
  const redirectTo = safeCallbackUrl(callbackUrl);

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full bg-brand-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 size-[24rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold">GC</span>
          <span className="text-sm font-semibold tracking-wide">Gestión Comercial</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Todo tu comercio,{' '}
            <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-cyan-300 bg-clip-text italic text-transparent">
              en un solo sistema
            </span>
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-zinc-300">
            <li>Stock y precios siempre al día</li>
            <li>Ventas, compras y facturación electrónica</li>
            <li>Reportes para decidir con datos</li>
          </ul>
        </div>
        <p className="relative text-xs text-zinc-500">Plexo Labs</p>
      </div>

      {/* Ingreso */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">GC</span>
            <span className="text-sm font-semibold text-zinc-900">Gestión Comercial</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Ingresá a tu negocio</h1>
          <p className="mt-2 text-sm text-zinc-500">Usá la cuenta de Google con la que te invitaron.</p>

          {errorMessage && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          )}

          <form
            className="mt-8"
            action={async () => {
              'use server';
              await signIn('google', { redirectTo });
            }}
          >
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-800 shadow-xs transition hover:bg-zinc-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Continuar con Google
            </button>
          </form>
          <p className="mt-6 text-xs text-zinc-500">
            ¿No tenés acceso? Pedile al administrador de tu negocio que te invite con tu email de Google.
          </p>
        </div>
      </div>
    </div>
  );
}

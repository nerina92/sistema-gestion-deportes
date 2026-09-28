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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">GC</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Gestión Comercial</h1>
          <p className="mt-2 text-sm text-gray-600">Ingresá con la cuenta de Google con la que te invitaron</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{errorMessage}</div>
          )}
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
        </div>
      </div>
    </div>
  );
}

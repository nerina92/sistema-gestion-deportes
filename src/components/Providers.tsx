'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ session, children }: { session: Session | null; children: React.ReactNode }) {
  // SessionProvider solo toma la sesión inicial. Tras un login que no recarga la
  // página (ej. ingreso de desarrollo) quedaría la sesión vacía de /login, así
  // que se remonta cuando cambia el usuario.
  return (
    <SessionProvider key={session?.userId || 'anon'} session={session}>
      {children}
    </SessionProvider>
  );
}

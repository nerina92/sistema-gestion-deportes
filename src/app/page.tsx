import { redirect } from 'next/navigation';

// El proxy redirige según la sesión; esto es solo un fallback.
export default function Home() {
  redirect('/dashboard');
}

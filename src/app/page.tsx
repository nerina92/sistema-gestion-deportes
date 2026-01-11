'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold">DL</span>
          </div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    </div>
  );
}

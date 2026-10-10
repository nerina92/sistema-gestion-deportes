'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { activeNavItem } from './navigation';

interface HeaderProps {
  onMenuClick: () => void;
}

/** Barra superior: en mobile abre el menú; muestra la sección actual. */
export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const section = activeNavItem(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur lg:hidden">
      <button
        onClick={onMenuClick}
        className="-ml-1 rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>
      <p className="truncate text-sm font-semibold text-zinc-900">{section?.name ?? ''}</p>
    </header>
  );
}

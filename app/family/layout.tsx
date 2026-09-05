'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar pathname={pathname} variant="family" />
      <MobileNav pathname={pathname} variant="family" />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

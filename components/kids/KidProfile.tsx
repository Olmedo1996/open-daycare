'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Database } from '@/types/database.types';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';
import { ChevronLeftIcon, AlertTriangleIcon, EditIcon } from '@/components/shared/icons';
import { LinkParentModal } from '@/components/kids/LinkParentModal';

type Child = Database['public']['Tables']['children']['Row'];

interface KidProfileProps {
  kid: Child;
  roomName: string | null;
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

const AVATAR_COLORS = [
  { bg: '#A9D9E8', color: '#1F7A93' },
  { bg: '#F4B8CC', color: '#C44A7A' },
  { bg: '#B9DEC4', color: '#3E8B62' },
  { bg: '#F4DC8E', color: '#9A7B1E' },
  { bg: '#C9B6E8', color: '#7B5FC0' },
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function KidProfile({ kid, roomName }: KidProfileProps) {
  const [showLinkParent, setShowLinkParent] = useState(false);
  const hasAllergies = kid.allergy_tags.length > 0;
  const avatar = getAvatarColor(kid.id);
  const initial = kid.full_name.charAt(0).toUpperCase();
  const age = calculateAge(kid.birth_date);

  return (
    <div className="flex flex-1 min-h-screen bg-canvas">
      <Sidebar pathname="/kids" />
      <MobileNav pathname="/kids" />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[820px] w-full mx-auto px-5 md:px-10 pt-16 md:pt-[34px] pb-20">
          <Link
            href="/kids"
            className="flex items-center gap-[7px] text-[#94887B] font-bold text-[14px] mb-5"
          >
            <ChevronLeftIcon className="w-[18px] h-[18px]" />
            Volver a Niños
          </Link>

          <div className="flex gap-[26px] items-start flex-wrap">
            <div className="flex-1 min-w-[300px] flex flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <div
                  className="w-[84px] h-[84px] rounded-full font-head font-semibold text-[34px] flex items-center justify-center shrink-0"
                  style={{ background: avatar.bg, color: avatar.color }}
                >
                  {initial}
                </div>
                <div className="flex-1">
                  <h1 className="font-head font-semibold text-[28px] text-ink m-0">
                    {kid.full_name}
                  </h1>
                  <p className="m-0 mt-1 text-[15px] text-[#94887B]">
                    {age} años · Sala {roomName ?? 'Sin sala'}
                  </p>
                </div>
                <a
                  href="#"
                  className="border border-[#ECE0D0] bg-card text-[#6E6359] font-bold text-[14px] px-4 py-[9px] rounded-[12px] flex items-center gap-2"
                >
                  <EditIcon className="w-4 h-4" />
                  Editar
                </a>
              </div>

              {hasAllergies && (
                <div className="flex gap-[14px] bg-[#FBDAD6] rounded-[16px] px-[18px] py-4">
                  <div className="w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center shrink-0">
                    <AlertTriangleIcon className="w-[22px] h-[22px] text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-[#C5413A] text-[15px] mb-1">
                      Alergias y notas
                    </div>
                    <div className="text-[#B25249] text-[14.5px] leading-relaxed">
                      {kid.medical_notes}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card border border-line rounded-[16px] overflow-hidden">
                <div className="flex justify-between px-[18px] py-[15px] border-b border-[#F0E6D8]">
                  <span className="text-[#94887B] text-[14.5px]">
                    Fecha de nacimiento
                  </span>
                  <span className="font-extrabold text-ink text-[14.5px]">
                    {formatDate(kid.birth_date)}
                  </span>
                </div>
                <div className="flex justify-between px-[18px] py-[15px] border-b border-[#F0E6D8]">
                  <span className="text-[#94887B] text-[14.5px]">Sala</span>
                  <span className="font-extrabold text-ink text-[14.5px]">
                    {roomName ?? 'Sin sala'}
                  </span>
                </div>
                <div className="flex justify-between px-[18px] py-[15px]">
                  <span className="text-[#94887B] text-[14.5px]">Ingreso</span>
                  <span className="font-extrabold text-ink text-[14.5px]">
                    {formatDate(kid.enrolled_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-[300px] shrink-0 flex flex-col gap-[14px]">
              <a
                href="#"
                className="flex items-center justify-center gap-[9px] w-full px-[13px] py-[13px] rounded-[14px] bg-[#3F362E] text-white font-extrabold text-[15px]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                Resumen del día
              </a>

              <div className="bg-card border border-line rounded-[16px] px-[18px] py-4">
                <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-[14px]">
                  PADRES VINCULADOS
                </div>
                <div className="flex flex-col gap-[14px]">
                  <div className="text-[14px] text-muted">
                    Sin padres vinculados
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLinkParent(true)}
                    className="flex items-center gap-[12px] pt-2 bg-none border-none cursor-pointer p-0"
                  >
                    <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290]">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                    <span className="font-extrabold text-[14.5px] text-[#C5503A]">
                      Vincular otro padre
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <LinkParentModal
        open={showLinkParent}
        kidName={kid.full_name}
        onClose={() => setShowLinkParent(false)}
        onLink={() => {}}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Database } from '@/types/database.types';
import { SearchIcon } from '@/components/shared/icons';
import { KidCard } from '@/components/kids/KidCard';
import { AddKidModal } from '@/components/kids/AddKidModal';

type Room = Database['public']['Tables']['rooms']['Row'];
type Child = Database['public']['Tables']['children']['Row'];

interface KidsListProps {
  rooms: Room[];
  kidsData: Child[];
}

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function KidsList({ rooms, kidsData }: KidsListProps) {
  const [query, setQuery] = useState('');
  const [showAddKid, setShowAddKid] = useState(false);

  const filtered = kidsData.filter((kid) =>
    normalize(kid.full_name).includes(normalize(query)),
  );

  const kidsByRoom = rooms.map((room) => ({
    room,
    kids: filtered.filter((kid) => kid.room_id === room.id),
  }));

  const unassigned = filtered.filter((kid) => kid.room_id === null);

  return (
    <>
      <div className="max-w-[880px] w-full mx-auto px-5 md:px-10 pt-16 md:pt-[34px] pb-20">
          <div className="flex items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-accent mb-1">
                GESTIÓN
              </div>
              <h1 className="font-head font-semibold text-[30px] text-ink m-0">
                Niños
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowAddKid(true)}
              className="flex items-center gap-2 px-[18px] py-[11px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Agregar niño
            </button>
          </div>

          <div className="flex items-center gap-[11px] bg-card border border-line rounded-[14px] px-4 py-3 mb-[22px]">
            <SearchIcon className="w-[18px] h-[18px] text-[#B0A290]" />
            <input
              placeholder="Buscar niño…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-none bg-none text-[15px] text-ink placeholder-[#B6A99999] outline-none"
            />
          </div>

          {kidsByRoom.map(({ room, kids }) => (
            <div key={room.id} className="mb-[14px]">
              <div className="flex items-center gap-3 mb-[14px]">
                <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
                  SALA {room.name.toUpperCase()}
                </span>
                <span className="text-[13px] text-muted">
                  {kids.length} niños
                </span>
                <span className="flex-1 h-px bg-[#E7DAC8]" />
              </div>
              <div className="grid grid-cols-2 gap-[14px]">
                {kids.map((kid) => (
                  <KidCard key={kid.id} kid={kid} />
                ))}
              </div>
            </div>
          ))}

          {unassigned.length > 0 && (
            <div className="mb-[14px]">
              <div className="flex items-center gap-3 mb-[14px]">
                <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
                  SIN SALA
                </span>
                <span className="text-[13px] text-muted">
                  {unassigned.length} niños
                </span>
                <span className="flex-1 h-px bg-[#E7DAC8]" />
              </div>
              <div className="grid grid-cols-2 gap-[14px]">
                {unassigned.map((kid) => (
                  <KidCard key={kid.id} kid={kid} />
                ))}
              </div>
            </div>
          )}

          {kidsByRoom.every(({ kids }) => kids.length === 0) &&
            unassigned.length === 0 && (
              <div className="text-center py-16 text-muted text-[15px]">
                No se encontraron niños
              </div>
            )}
        </div>
      <AddKidModal
        open={showAddKid}
        onClose={() => setShowAddKid(false)}
        rooms={rooms}
      />
    </>
  );
}

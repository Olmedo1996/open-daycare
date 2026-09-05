import Link from 'next/link';
import type { Database } from '@/types/database.types';

type Child = Database['public']['Tables']['children']['Row'];

interface KidCardProps {
  kid: Child;
  onEdit?: (kid: Child) => void;
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

const cardClass = "kid-card-hover flex items-center gap-[14px] min-w-0 bg-card border border-line rounded-[18px] px-4 py-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[transform,border-color] duration-150 hover:border-[#F2A78E]";

function CardContent({ kid, hasAllergies, avatar, initial, age }: {
  kid: Child;
  hasAllergies: boolean;
  avatar: { bg: string; color: string };
  initial: string;
  age: number;
}) {
  const noParents = true;
  return (
    <>
      <div
        className="w-12 h-12 rounded-full font-head font-semibold text-[19px] flex items-center justify-center shrink-0"
        style={{ background: avatar.bg, color: avatar.color }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-head font-semibold text-[16px] text-ink truncate">
          {kid.full_name}
        </div>
        <div className="text-[13px] text-muted">
          {age} años
        </div>
      </div>
      {hasAllergies ? (
        <span
          className="flex-none text-[11px] font-extrabold px-[9px] py-[5px] rounded-full bg-[#FBD8CC] text-[#D9684A]"
        >
          ALERGIA
        </span>
      ) : noParents ? (
        <span className="flex-none text-[11px] font-extrabold px-[9px] py-[5px] rounded-full bg-[#F9D2DE] text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <svg className="flex-none w-[18px] h-[18px] text-[#CBB89F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      )}
    </>
  );
}

export function KidCard({ kid, onEdit }: KidCardProps) {
  const hasAllergies = kid.allergy_tags.length > 0;
  const avatar = getAvatarColor(kid.id);
  const initial = kid.full_name.charAt(0).toUpperCase();
  const age = calculateAge(kid.birth_date);

  if (onEdit) {
    return (
      <button
        type="button"
        onClick={() => onEdit(kid)}
        className={`${cardClass} cursor-pointer text-left w-full`}
      >
        <CardContent kid={kid} hasAllergies={hasAllergies} avatar={avatar} initial={initial} age={age} />
      </button>
    );
  }

  return (
    <Link
      href={`/staff/kids/${kid.id}`}
      className={cardClass}
    >
      <CardContent kid={kid} hasAllergies={hasAllergies} avatar={avatar} initial={initial} age={age} />
    </Link>
  );
}

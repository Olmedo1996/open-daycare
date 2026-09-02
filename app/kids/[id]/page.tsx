import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KidProfile } from '@/components/kids/KidProfile';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';
import { ChevronLeftIcon } from '@/components/shared/icons';

interface KidProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function KidProfilePage({ params }: KidProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: kid } = await supabase
    .from('children')
    .select('*')
    .eq('id', id)
    .single();

  if (!kid) {
    return (
      <div className="flex flex-1 min-h-screen bg-canvas">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <div className="max-w-[820px] w-full mx-auto px-5 md:px-10 pt-16 md:pt-[34px] pb-20">
            <Link
              href="/kids"
              className="flex items-center gap-[7px] text-[#94887B] font-bold text-[14px] mb-5"
            >
              <ChevronLeftIcon className="w-[18px] h-[18px]" />
              Volver a Niños
            </Link>
            <div className="text-center py-20">
              <p className="text-[18px] text-muted font-semibold">
                Niño no encontrado
              </p>
              <Link
                href="/kids"
                className="text-accent font-bold mt-2 inline-block"
              >
                Volver a la lista
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  let roomName: string | null = null;
  if (kid.room_id) {
    const { data: room } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', kid.room_id)
      .single();
    roomName = room?.name ?? null;
  }

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('name');

  const { data: parentLinks } = await supabase
    .from('parent_children')
    .select('parent_id, relationship')
    .eq('child_id', id);

  const parentIds = (parentLinks ?? []).map((link) => link.parent_id);
  const { data: parentUsers } = parentIds.length
    ? await supabase.from('users').select('id, full_name').in('id', parentIds)
    : { data: [] };

  const linkedParents = (parentLinks ?? []).map((link) => ({
    parent_id: link.parent_id,
    full_name:
      parentUsers?.find((u) => u.id === link.parent_id)?.full_name ?? 'Padre',
    relationship: link.relationship,
  }));

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, full_name, email, relationship')
    .eq('child_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const pendingInvitations = (invitations ?? []).map((inv) => ({
    id: inv.id,
    full_name: inv.full_name,
    email: inv.email,
    relationship: inv.relationship,
  }));

  return (
    <KidProfile
      kid={kid}
      roomName={roomName}
      rooms={rooms ?? []}
      linkedParents={linkedParents}
      pendingInvitations={pendingInvitations}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { KidsList } from '@/components/kids/KidsList';

export default async function KidsPage() {
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('name');

  const { data: kidsData } = await supabase
    .from('children')
    .select('*')
    .order('full_name');

  return (
    <KidsList
      rooms={rooms ?? []}
      kidsData={kidsData ?? []}
    />
  );
}

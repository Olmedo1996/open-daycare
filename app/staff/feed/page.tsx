import { createClient } from '@/lib/supabase/server';
import { getPosts, getChildren } from '@/lib/actions/posts';
import { FeedClient } from '@/components/home/FeedClient';

export default async function StaffFeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: posts }, { data: children }] = await Promise.all([
    getPosts(),
    getChildren(),
  ]);

  return (
    <FeedClient
      posts={posts}
      availableChildren={children}
      currentUserId={user?.id ?? ''}
    />
  );
}

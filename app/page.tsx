import { createClient } from '@/lib/supabase/server';
import { getPosts } from '@/lib/actions/posts';
import { FeedClient } from '@/components/home/FeedClient';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await getPosts();

  return (
    <FeedClient
      posts={posts}
      currentUserId={user?.id ?? ''}
    />
  );
}

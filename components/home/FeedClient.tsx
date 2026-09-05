'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';
import { FeedHeader } from '@/components/home/FeedHeader';
import { Composer } from '@/components/home/Composer';
import { FeedDivider } from '@/components/home/FeedDivider';
import { PostCard } from '@/components/home/PostCard';
import { NewPostModal } from '@/components/home/NewPostModal';
import type { PostWithDetails } from '@/lib/actions/posts';

interface FeedClientProps {
  posts: PostWithDetails[];
  currentUserId: string;
}

export function FeedClient({ posts, currentUserId }: FeedClientProps) {
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithDetails | null>(null);

  return (
    <div className="flex flex-1 min-h-screen bg-canvas">
      <Sidebar pathname="/" onOpenNewPost={() => setShowNewPost(true)} />
      <MobileNav pathname="/" />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-5 md:px-10 pt-16 md:pt-[34px] pb-20">
          <FeedHeader />
          <Composer />
          <FeedDivider />
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onEdit={(p) => setEditingPost(p)}
              />
            ))}
          </div>
        </div>
      </main>
      <NewPostModal
        open={showNewPost}
        onClose={() => setShowNewPost(false)}
        onPublish={() => setShowNewPost(false)}
      />
      <NewPostModal
        open={!!editingPost}
        onClose={() => setEditingPost(null)}
        onPublish={() => setEditingPost(null)}
        post={editingPost ?? undefined}
      />
    </div>
  );
}

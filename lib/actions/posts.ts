'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

// ---------- Types ----------

export type PostType =
  | 'meal'
  | 'nap'
  | 'activity'
  | 'achievement'
  | 'photo'
  | 'announcement';

export type CreatePostInput = {
  type: PostType;
  title?: string;
  body: string;
  room_id?: string;
  is_public: boolean;
  child_ids?: string[];
  photos?: File[];
};

export type UpdatePostInput = CreatePostInput & {
  id: string;
  deleted_photo_ids?: string[];
};

export type PostWithDetails = {
  id: string;
  author_id: string;
  room_id: string | null;
  type: PostType;
  title: string | null;
  body: string;
  is_public: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  author: { full_name: string; avatar_url: string | null };
  room: { name: string } | null;
  children: { child: { id: string; full_name: string } }[];
  photos: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }[];
};

// ---------- Helpers ----------

const POST_SELECT = `
  id,
  author_id,
  room_id,
  type,
  title,
  body,
  is_public,
  published_at,
  created_at,
  updated_at,
  author:users!posts_author_id_fkey(full_name, avatar_url),
  room:rooms!posts_room_id_fkey(name),
  children:post_children(child:children(id, full_name)),
  photos:post_photos(id, url, width, height, position)
`;

function normalizePost(row: Record<string, unknown>): PostWithDetails {
  const author = row.author as { full_name: string; avatar_url: string | null } | null;
  const room = row.room as { name: string } | null;
  const rawChildren = row.children as
    | { child: { id: string; full_name: string } }[]
    | null;
  const rawPhotos = row.photos as
    | {
        id: string;
        url: string;
        width: number | null;
        height: number | null;
        position: number;
      }[]
    | null;

  return {
    id: row.id as string,
    author_id: row.author_id as string,
    room_id: row.room_id as string | null,
    type: row.type as PostType,
    title: row.title as string | null,
    body: row.body as string,
    is_public: row.is_public as boolean,
    published_at: row.published_at as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: author ?? { full_name: '', avatar_url: null },
    room: room ?? null,
    children: rawChildren ?? [],
    photos: (rawPhotos ?? []).sort((a, b) => a.position - b.position),
  };
}

async function uploadPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  files: File[],
) {
  const uploaded: {
    post_id: string;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${postId}/${i}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('post-photos')
      .upload(path, file, { contentType: file.type });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from('post-photos').getPublicUrl(path);

    uploaded.push({
      post_id: postId,
      url: publicUrl,
      width: null,
      height: null,
      position: i,
    });
  }

  return uploaded;
}

async function deleteStoragePhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  urls: string[],
) {
  for (const url of urls) {
    const path = url.split('/post-photos/')[1];
    if (path) {
      await supabase.storage.from('post-photos').remove([path]);
    }
  }
}

// ---------- Actions ----------

export async function createPost(
  input: CreatePostInput,
): Promise<{ data: PostWithDetails | null; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  // 1. Insert post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      room_id: input.room_id || null,
      type: input.type,
      title: input.title || null,
      body: input.body,
      is_public: input.is_public,
    })
    .select(POST_SELECT)
    .single();

  if (postError) return { data: null, error: postError.message };

  // 2. Insert post_children
  if (input.child_ids && input.child_ids.length > 0) {
    const { error: childrenError } = await supabase
      .from('post_children')
      .insert(
        input.child_ids.map((child_id) => ({
          post_id: post.id,
          child_id,
        })),
      );

    if (childrenError) return { data: null, error: childrenError.message };
  }

  // 3. Upload photos
  if (input.photos && input.photos.length > 0) {
    const photos = await uploadPhotos(supabase, post.id, input.photos);

    const { error: photosError } = await supabase
      .from('post_photos')
      .insert(photos);

    if (photosError) return { data: null, error: photosError.message };
  }

  // Re-fetch with joins
  const { data: fullPost } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', post.id)
    .single();

  revalidatePath('/');

  return { data: fullPost ? normalizePost(fullPost) : null, error: null };
}

export async function getPosts(options?: {
  room_id?: string;
  child_id?: string;
}): Promise<{ data: PostWithDetails[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .order('published_at', { ascending: false });

  if (options?.room_id) {
    query = query.eq('room_id', options.room_id);
  }

  if (options?.child_id) {
    query = query.contains('children', [{ child: { id: options.child_id } }]);
  }

  const { data, error } = await query;

  if (error) return { data: [], error: error.message };

  return {
    data: (data ?? []).map(normalizePost),
    error: null,
  };
}

export async function getPostById(
  id: string,
): Promise<{ data: PostWithDetails | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .single();

  if (error) return { data: null, error: error.message };

  return { data: normalizePost(data), error: null };
}

export async function updatePost(
  input: UpdatePostInput,
): Promise<{ data: PostWithDetails | null; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  // 1. Update post
  const { error: updateError } = await supabase
    .from('posts')
    .update({
      room_id: input.room_id || null,
      type: input.type,
      title: input.title || null,
      body: input.body,
      is_public: input.is_public,
    })
    .eq('id', input.id)
    .eq('author_id', user.id);

  if (updateError) return { data: null, error: updateError.message };

  // 2. Sync post_children — delete all, re-insert
  await supabase.from('post_children').delete().eq('post_id', input.id);

  if (input.child_ids && input.child_ids.length > 0) {
    const { error: childrenError } = await supabase
      .from('post_children')
      .insert(
        input.child_ids.map((child_id) => ({
          post_id: input.id,
          child_id,
        })),
      );

    if (childrenError) return { data: null, error: childrenError.message };
  }

  // 3. Delete removed photos from storage + DB
  if (input.deleted_photo_ids && input.deleted_photo_ids.length > 0) {
    const { data: toDelete } = await supabase
      .from('post_photos')
      .select('url')
      .in('id', input.deleted_photo_ids);

    if (toDelete) {
      await deleteStoragePhotos(
        supabase,
        toDelete.map((p) => p.url),
      );
    }

    await supabase
      .from('post_photos')
      .delete()
      .in('id', input.deleted_photo_ids);
  }

  // 4. Upload new photos
  if (input.photos && input.photos.length > 0) {
    // Get current max position
    const { data: existing } = await supabase
      .from('post_photos')
      .select('position')
      .eq('post_id', input.id)
      .order('position', { ascending: false })
      .limit(1);

    const startPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const newPhotos = await uploadPhotos(supabase, input.id, input.photos);
    const positioned = newPhotos.map((p, i) => ({ ...p, position: startPos + i }));

    const { error: photosError } = await supabase
      .from('post_photos')
      .insert(positioned);

    if (photosError) return { data: null, error: photosError.message };
  }

  // Re-fetch with joins
  const { data: fullPost } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', input.id)
    .single();

  revalidatePath('/');

  return { data: fullPost ? normalizePost(fullPost) : null, error: null };
}

export async function deletePost(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // 1. Get photos URLs before delete
  const { data: photos } = await supabase
    .from('post_photos')
    .select('url')
    .eq('post_id', id);

  // 2. Delete photos from storage
  if (photos && photos.length > 0) {
    await deleteStoragePhotos(
      supabase,
      photos.map((p) => p.url),
    );
  }

  // 3. Delete post (cascade handles post_children + post_photos)
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');

  return { error: null };
}

// ---------- Children ----------

export type ChildOption = {
  id: string;
  full_name: string;
};

export async function getChildren(): Promise<{
  data: ChildOption[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('children')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name');

  if (error) return { data: [], error: error.message };

  return { data: data ?? [], error: null };
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type PostWithDetails, deletePost } from '@/lib/actions/posts';
import {
  CommentIcon,
  HeartIcon,
  MenuIcon,
  EditIcon,
} from '@/components/shared/icons';

const POST_TYPE_LABEL: Record<string, string> = {
  meal: 'COMIDA',
  nap: 'SIESTA',
  activity: 'ACTIVIDAD',
  achievement: 'LOGRO',
  photo: 'FOTO',
  announcement: 'ANUNCIO',
};

const POST_TYPE_COLORS: Record<string, { container: string; dot: string; text: string }> = {
  meal: {
    container: 'bg-[#EDE3C4]',
    dot: 'bg-[#9A7B1E]',
    text: 'text-[#9A7B1E]',
  },
  nap: {
    container: 'bg-[#E7DCF6]',
    dot: 'bg-[#7B5FC0]',
    text: 'text-[#7B5FC0]',
  },
  activity: {
    container: 'bg-[#C7E7F1]',
    dot: 'bg-[#2E89A6]',
    text: 'text-[#2E89A6]',
  },
  achievement: {
    container: 'bg-[#CFEBD8]',
    dot: 'bg-[#3E9B6C]',
    text: 'text-[#3E9B6C]',
  },
  photo: {
    container: 'bg-[#FBD8CC]',
    dot: 'bg-[#D9684A]',
    text: 'text-[#D9684A]',
  },
  announcement: {
    container: 'bg-[#CCD8F4]',
    dot: 'bg-[#4E72C8]',
    text: 'text-[#4E72C8]',
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

interface PostCardProps {
  post: PostWithDetails;
  currentUserId: string;
  onEdit?: (post: PostWithDetails) => void;
}

export function PostCard({ post, currentUserId, onEdit }: PostCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = post.author_id === currentUserId;
  const badge = POST_TYPE_COLORS[post.type] ?? POST_TYPE_COLORS.activity;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm('¿Eliminar esta publicación?')) return;
    const { error } = await deletePost(post.id);
    if (!error) {
      router.refresh();
    }
  };

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit?.(post);
  };

  return (
    <article className="bg-card border border-line rounded-[20px] py-5 px-[22px] shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-[14px]">
        <span
          className="w-[44px] h-[44px] rounded-full font-head font-semibold text-[17px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#A9D9E8', color: '#1F7A93' }}
        >
          {post.author.full_name.charAt(0)}
        </span>
        <div className="flex-1">
          <div className="font-head font-semibold text-[16.5px] text-ink">
            {post.author.full_name}
          </div>
          <div className="text-[12.5px] text-muted">
            {timeAgo(post.published_at)}
            {isAuthor ? ' · publicado por vos' : ''}
          </div>
        </div>

        {/* Visibility badge */}
        <div
          className={`flex items-center gap-[5px] py-[4px] px-2.5 rounded-full text-[11px] font-extrabold tracking-[0.5px] ${
            post.is_public
              ? 'bg-[#CFEBD8] text-[#3E9B6C]'
              : 'bg-[#F0E0D0] text-[#9A7B1E]'
          }`}
        >
          {post.is_public ? 'Público' : 'Privado'}
        </div>

        {/* Type badge */}
        <div
          className={`flex items-center gap-[7px] py-[6px] px-3 rounded-full ${badge.container}`}
        >
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          <span className={`text-[12px] font-extrabold tracking-[0.5px] ${badge.text}`}>
            {POST_TYPE_LABEL[post.type] ?? post.type}
          </span>
        </div>

        {/* Options menu */}
        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#94887B] hover:bg-[#F0E6D8] hover:text-[#6E6359]"
            >
              <MenuIcon width={18} height={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-[140px] rounded-[12px] border border-[#ECE0D0] bg-white py-1 shadow-[0_8px_24px_-8px_rgba(63,54,46,.3)]">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-[14px] font-medium text-[#3F362E] hover:bg-[#F4ECE1]"
                >
                  <EditIcon width={16} height={16} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-[14px] font-medium text-[#D9583C] hover:bg-[#FDE8E4]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="mb-2 text-[16px] font-bold text-[#3F362E]">
          {post.title}
        </h3>
      )}

      {/* Children tags */}
      {post.children.length > 0 && (
        <div className="mb-[10px] flex flex-wrap gap-1.5">
          {post.children.map((pc) => (
            <span
              key={pc.child.id}
              className="rounded-full bg-[#F4ECE1] px-2.5 py-1 text-[12px] font-bold text-[#6E6359]"
            >
              {pc.child.full_name}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      <p className="text-[15.5px] leading-[1.55] text-[#4A4038] m-0">
        {post.body}
      </p>

      {/* Photos */}
      {post.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="h-[100px] w-[100px] rounded-[12px] object-cover"
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-[#F0E6D8]">
        <span className="flex items-center gap-[7px] text-[#E0654A] font-bold text-[14px]">
          <HeartIcon className="w-[19px] h-[19px]" />
          0
        </span>
        <span className="flex items-center gap-[7px] text-[#94887B] font-bold text-[14px]">
          <CommentIcon className="w-[18px] h-[18px]" />
          0
        </span>
      </div>
    </article>
  );
}

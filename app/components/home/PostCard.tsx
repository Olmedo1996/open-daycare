import { Avatar } from "@/app/components/shared/Avatar";
import { Badge } from "@/app/components/shared/Badge";
import {
  CommentIcon,
  HeartIcon,
  ImageIcon,
} from "@/app/components/shared/icons";
import type { Post, PostType } from "@/app/data/posts";

const AVATAR_TONE: Record<PostType, "kid" | "announcement"> = {
  achievement: "kid",
  activity: "kid",
  announcement: "announcement",
};

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <header className="mb-3.5 flex items-center gap-3">
        <Avatar
          name={post.authorName}
          tone={AVATAR_TONE[post.type]}
          className="h-11 w-11 text-[17px]"
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-muted-light">
            {post.timeLabel} · publicado por vos
          </div>
        </div>
        <Badge type={post.type} />
      </header>

      <div className="mb-2.5 text-[12.5px] text-muted-light">
        Para: {post.recipientLabel}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-ink-soft">{post.text}</p>

      {post.photoLabel && (
        <a
          href="#"
          className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-dash bg-photo-bg text-photo-icon"
        >
          <ImageIcon className="h-[30px] w-[30px]" strokeWidth={1.7} />
          <span className="text-[13.5px]">Foto · {post.photoLabel}</span>
        </a>
      )}

      <footer className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-[14px] font-bold text-like">
          <HeartIcon className="h-[19px] w-[19px]" />
          {post.likes}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-[14px] font-bold text-muted"
        >
          <CommentIcon className="h-[18px] w-[18px]" />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-[14px] font-extrabold text-accent-deep">
          Editar
        </a>
      </footer>
    </article>
  );
}
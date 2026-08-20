import { Composer } from "@/app/components/home/Composer";
import { PostCard } from "@/app/components/home/PostCard";
import { AppShell } from "@/app/components/shared/AppShell";
import { posts } from "@/app/data/posts";

export default function Home() {
  return (
    <AppShell activePath="/" maxWidth={760}>
      <header className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
          GUARDERÍA · SALA SOLES
        </div>
        <h1 className="font-display text-[30px] font-semibold text-ink">
          Buenas, Caro
        </h1>
        <p className="mt-[5px] text-[14.5px] text-muted">12 niños · martes 17 jun</p>
      </header>

      <Composer />

      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-faint">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </AppShell>
  );
}
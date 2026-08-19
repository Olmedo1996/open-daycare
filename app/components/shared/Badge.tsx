import type { PostType } from "@/app/data/posts";

const BADGE_CONFIG: Record<PostType, { label: string; classes: string }> = {
  achievement: { label: "LOGRO", classes: "bg-success-bg text-success" },
  activity: { label: "ACTIVIDAD", classes: "bg-info-bg text-info" },
  announcement: { label: "ANUNCIO", classes: "bg-warn-bg text-warn" },
};

type BadgeProps = {
  type: PostType;
};

export function Badge({ type }: BadgeProps) {
  const { label, classes } = BADGE_CONFIG[type];

  return (
    <span
      className={`inline-flex flex-none items-center gap-[7px] rounded-full px-3 py-1.5 ${classes}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span className="text-xs font-extrabold tracking-[0.5px]">{label}</span>
    </span>
  );
}
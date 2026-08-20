import type { KidAvatarTone, ParentTone } from "@/app/data/kids";
import { MegaphoneIcon } from "./icons";

type AvatarTone =
  | "teacher"
  | "kid"
  | "announcement"
  | KidAvatarTone
  | ParentTone;

type AvatarProps = {
  name: string;
  tone?: AvatarTone;
  className?: string;
};

const TONE_CLASSES: Record<AvatarTone, { bg: string; text: string }> = {
  teacher: { bg: "bg-brand-mid", text: "text-white" },
  kid: { bg: "bg-kid-bg", text: "text-kid" },
  announcement: { bg: "bg-warn-bg", text: "text-warn" },
  sky: { bg: "bg-kid-bg", text: "text-kid" },
  rose: { bg: "bg-rose-bg", text: "text-rose" },
  mint: { bg: "bg-mint-bg", text: "text-mint" },
  gold: { bg: "bg-gold-bg", text: "text-gold" },
  violet: { bg: "bg-violet-bg", text: "text-violet" },
  steel: { bg: "bg-steel-bg", text: "text-white" },
};

export function Avatar({ name, tone = "kid", className = "" }: AvatarProps) {
  const classes = TONE_CLASSES[tone];
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${classes.bg} ${classes.text} ${className}`}
      aria-label={name}
    >
      {tone === "announcement" ? (
        <MegaphoneIcon className="h-5 w-5" />
      ) : (
        <span className="leading-none">{initial}</span>
      )}
    </div>
  );
}
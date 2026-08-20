export type PillTone = "danger" | "link" | "active" | "pending";

type PillProps = {
  label: string;
  tone: PillTone;
  size?: "sm" | "md";
};

const TONE_CLASSES: Record<PillTone, string> = {
  danger: "bg-peanut-bg text-peanut",
  link: "bg-vincular-bg text-vincular",
  active: "bg-success-bg text-success",
  pending: "bg-pending-bg text-pending",
};

const SIZE_CLASSES: Record<NonNullable<PillProps["size"]>, string> = {
  sm: "px-[9px] py-1 text-[10.5px]",
  md: "px-[9px] py-[5px] text-[11px]",
};

export function Pill({ label, tone, size = "md" }: PillProps) {
  return (
    <span
      className={`inline-flex flex-none items-center rounded-full font-extrabold ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
import Link from "next/link";
import { parentsLabel, type Kid } from "@/app/data/kids";
import { Avatar } from "../shared/Avatar";
import { ChevronRightIcon } from "../shared/icons";
import { Pill } from "../shared/Pill";

type KidCardProps = {
  kid: Kid;
};

export function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.slug}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:-translate-y-0.5 hover:border-kid-hover"
    >
      <Avatar
        name={kid.name}
        tone={kid.avatarTone}
        className="h-12 w-12 text-[19px]"
      />
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">
          {kid.name}
        </div>
        <div className="text-[13px] text-muted-light">
          {kid.ageLabel} · {parentsLabel(kid.parents.length)}
        </div>
      </div>
      {kid.pill && kid.pillLabel ? (
        <Pill
          label={kid.pillLabel}
          tone={kid.pill === "link" ? "link" : "danger"}
        />
      ) : (
        <ChevronRightIcon className="h-[18px] w-[18px] flex-none text-[#CBB89F]" />
      )}
    </Link>
  );
}
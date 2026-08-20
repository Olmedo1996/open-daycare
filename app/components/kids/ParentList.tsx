import type { Parent } from "@/app/data/kids";
import { Avatar } from "../shared/Avatar";
import { PlusIcon } from "../shared/icons";
import { Pill } from "../shared/Pill";

type ParentListProps = {
  parents: Parent[];
};

const STATUS_TEXT: Record<
  Parent["status"],
  { pillLabel: string; tone: "active" | "pending"; detail: string }
> = {
  active: { pillLabel: "ACTIVA", tone: "active", detail: "activa" },
  pending: {
    pillLabel: "PENDIENTE",
    tone: "pending",
    detail: "invitación enviada",
  },
};

export function ParentList({ parents }: ParentListProps) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-[18px] py-4">
      <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-faint">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.map((parent) => {
          const status = STATUS_TEXT[parent.status];
          return (
            <div key={parent.name} className="flex items-center gap-3">
              <Avatar
                name={parent.name}
                tone={parent.tone}
                className="h-10 w-10 text-base !text-white"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-ink">
                  {parent.name}
                </div>
                <div className="text-[12.5px] text-muted-light">
                  {parent.role} · {status.detail}
                </div>
              </div>
              <Pill label={status.pillLabel} tone={status.tone} size="sm" />
            </div>
          );
        })}
        <a href="#" className="flex items-center gap-3 pt-2">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-icon">
            <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-accent-deep">
            Vincular otro padre
          </span>
        </a>
      </div>
    </div>
  );
}
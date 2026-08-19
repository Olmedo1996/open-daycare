import { Avatar } from "@/app/components/shared/Avatar";
import { CameraIcon } from "@/app/components/shared/icons";

export function Composer() {
  return (
    <a
      href="#"
      className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-line bg-surface px-[18px] py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <Avatar name="Caro Giménez" tone="teacher" className="h-10 w-10 text-base" />
      <span className="flex-1 text-[15px] text-muted-light">
        Compartí un momento…
      </span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-active-bg text-like">
        <CameraIcon className="h-[19px] w-[19px]" />
      </span>
    </a>
  );
}
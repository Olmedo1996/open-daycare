import { SearchBox } from "@/app/components/kids/SearchBox";
import { AppShell } from "@/app/components/shared/AppShell";
import { PlusIcon } from "@/app/components/shared/icons";
import { kids } from "@/app/data/kids";

export default function KidsPage() {
  return (
    <AppShell activePath="/kids" maxWidth={880}>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        <a
          href="#"
          className="flex items-center gap-2 rounded-[14px] bg-linear-to-b from-brand-light to-brand px-[18px] py-[11px] font-extrabold text-[14.5px] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
        >
          <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.4} />
          Agregar niño
        </a>
      </div>

      <SearchBox kids={kids} />
    </AppShell>
  );
}
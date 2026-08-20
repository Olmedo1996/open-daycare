import Link from "next/link";
import { Avatar } from "./Avatar";
import { LogOutIcon, PlusIcon, SunIcon } from "./icons";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

type SidebarProps = {
  activePath: string;
};

export function Sidebar({ activePath }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <a href="#" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,var(--color-brand-soft),var(--color-brand-mid))]">
          <SunIcon className="h-[21px] w-[21px] text-white" strokeWidth={2.2} />
        </span>
        <span>
          <span className="block font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </span>
          <span className="mt-0.5 block text-[11.5px] text-muted-light">
            Sala Soles
          </span>
        </span>
      </a>

      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-brand-light to-brand px-3 py-3 font-extrabold text-[14.5px] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.4} />
        Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, activePath);
          const className = `flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
            active
              ? "bg-active-bg font-extrabold text-accent"
              : "font-semibold text-muted-deep"
          }`;
          const content = (
            <>
              <Icon className="h-[19px] w-[19px]" />
              {item.label}
            </>
          );
          return item.href === "#" ? (
            <a key={item.label} href="#" className={className}>
              {content}
            </a>
          ) : (
            <Link key={item.label} href={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <Avatar
            name="Caro Giménez"
            tone="teacher"
            className="h-[38px] w-[38px] text-base"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">Caro Giménez</div>
            <div className="text-xs text-muted-light">Maestra · Soles</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-muted"
          >
            <LogOutIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </aside>
  );
}
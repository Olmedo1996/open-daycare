"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { CloseIcon, LogOutIcon, MenuIcon, PlusIcon, SunIcon } from "./icons";
import { NAV_ITEMS } from "./nav-items";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <a href="#" className="flex items-center gap-[11px]">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,var(--color-brand-soft),var(--color-brand-mid))]">
            <SunIcon className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <span>
            <span className="block font-display text-[15px] font-semibold leading-none text-ink">
              OpenDayCare
            </span>
            <span className="mt-0.5 block text-[10.5px] text-muted-light">
              Sala Soles
            </span>
          </span>
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-ink"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute left-0 top-0 flex h-full w-[248px] flex-col border-r border-line bg-surface px-4 py-6">
            <div className="flex items-center justify-between px-2 pb-[22px] pt-1">
              <a href="#" className="flex items-center gap-[11px]">
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
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-cream text-muted"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <a
              href="#"
              onClick={close}
              className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-brand-light to-brand px-3 py-3 font-extrabold text-[14.5px] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
            >
              <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.4} />
              Nueva publicación
            </a>

            <nav className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href="#"
                    onClick={close}
                    className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
                      item.active
                        ? "bg-active-bg font-extrabold text-accent"
                        : "font-semibold text-muted-deep"
                    }`}
                  >
                    <Icon className="h-[19px] w-[19px]" />
                    {item.label}
                  </a>
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
                  onClick={close}
                  title="Cerrar sesión"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-muted"
                >
                  <LogOutIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
import type { ComponentType, SVGProps } from "react";
import { BellIcon, HomeIcon, UserIcon, UsersIcon } from "./icons";

export type NavItem = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Feed", icon: HomeIcon, href: "/" },
  { label: "Niños", icon: UsersIcon, href: "/kids" },
  { label: "Avisos", icon: BellIcon, href: "#" },
  { label: "Mi cuenta", icon: UserIcon, href: "#" },
];

export function isNavItemActive(item: NavItem, activePath: string): boolean {
  return (
    item.href !== "#" &&
    (activePath === item.href || activePath.startsWith(item.href + "/"))
  );
}
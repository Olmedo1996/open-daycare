import type { ComponentType, SVGProps } from "react";
import { BellIcon, HomeIcon, UserIcon, UsersIcon } from "./icons";

export type NavItem = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Feed", icon: HomeIcon, active: true },
  { label: "Niños", icon: UsersIcon },
  { label: "Avisos", icon: BellIcon },
  { label: "Mi cuenta", icon: UserIcon },
];
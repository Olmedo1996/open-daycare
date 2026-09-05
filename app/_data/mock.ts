export type PostType = "achievement" | "activity" | "announcement";
export type NavIcon = "home" | "kids" | "bell" | "user";

// Visual labels (Spanish) per type — data is in English, UI in Spanish.
export const POST_TYPE_LABEL: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};

export interface FeedPost {
  id: string;
  authorName: string; // "Mateo" | "Anuncio general"
  authorInitial?: string; // "M" (omitted when the avatar uses an icon)
  avatarBg: string; // "#A9D9E8" | "#CCD8F4"
  avatarColor: string; // "#1F7A93" | "#4E72C8"
  avatarIcon?: "megaphone"; // present on the announcement post
  time: string; // "14:20"
  publishedByMe: boolean; // → "publicado por vos"
  type: PostType;
  audience: string; // "familia de Mateo" | "toda la sala"
  text: string;
  photoPlaceholder?: { label: string }; // "Foto · pintando con témperas"
  hearts: number;
  comments: number;
}

export interface NavItem {
  label: string;
  icon: NavIcon;
  active: boolean;
  href: string;
}

export interface SidebarUser {
  name: string; // "Caro Giménez"
  role: string; // "Maestra · Soles"
  initial: string; // "C"
}

export const sidebarUser: SidebarUser = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
};

export const familySidebarUser: SidebarUser = {
  name: "María López",
  role: "Madre · Familia",
  initial: "M",
};

export const roomSubtitle: string = "12 niños · martes 17 jun";

export const navItems: NavItem[] = [
  { label: "Feed", icon: "home", active: false, href: "/staff/feed" },
  { label: "Niños", icon: "kids", active: false, href: "/staff/kids" },
  { label: "Avisos", icon: "bell", active: false, href: "#" },
  { label: "Mi cuenta", icon: "user", active: false, href: "#" },
];

export const familyNavItems: NavItem[] = [
  { label: "Feed", icon: "home", active: false, href: "/family/feed" },
  { label: "Mis hijos", icon: "kids", active: false, href: "#" },
  { label: "Avisos", icon: "bell", active: false, href: "/family/notifications" },
  { label: "Mi cuenta", icon: "user", active: false, href: "/family/account" },
];

export type SidebarVariant = "staff" | "family";

export function getActiveNav(pathname: string, variant: SidebarVariant = "staff"): NavItem[] {
  const source = variant === "family" ? familyNavItems : navItems;
  const items = source.map((item) => ({ ...item, active: false }));
  if (variant === "staff") {
    if (pathname === "/staff/feed") {
      items[0].active = true;
    } else if (pathname.startsWith("/staff/kids")) {
      items[1].active = true;
    }
  } else {
    if (pathname === "/family/feed") {
      items[0].active = true;
    } else if (pathname.startsWith("/family/notifications")) {
      items[2].active = true;
    } else if (pathname.startsWith("/family/account")) {
      items[3].active = true;
    }
  }
  return items;
}

export const posts: FeedPost[] = [
  {
    id: "logro-mateo",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "14:20",
    publishedByMe: true,
    type: "achievement",
    audience: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    hearts: 3,
    comments: 1,
  },
  {
    id: "actividad-mateo",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "09:40",
    publishedByMe: true,
    type: "activity",
    audience: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoPlaceholder: { label: "Foto · pintando con témperas" },
    hearts: 5,
    comments: 2,
  },
  {
    id: "anuncio-general",
    authorName: "Anuncio general",
    avatarBg: "#CCD8F4",
    avatarColor: "#4E72C8",
    avatarIcon: "megaphone",
    time: "07:50",
    publishedByMe: true,
    type: "announcement",
    audience: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    hearts: 8,
    comments: 0,
  },
];

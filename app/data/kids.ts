export type ParentStatus = "active" | "pending";

export type ParentTone = "violet" | "steel";

export type Parent = {
  name: string;
  role: string;
  status: ParentStatus;
  tone: ParentTone;
};

export type KidAvatarTone = "sky" | "rose" | "mint" | "gold" | "violet";
export type KidPill = "danger" | "link" | null;

export type Kid = {
  slug: string;
  name: string;
  avatarTone: KidAvatarTone;
  ageLabel: string;
  pill: KidPill;
  pillLabel?: string; // "MANÍ" | "LACTOSA" | "VINCULAR" cuando pill no es null
  notes?: string;
  birthDate: string;
  room: string;
  enrollment: string;
  parents: Parent[];
};

export function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

export const kids: Kid[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    avatarTone: "sky",
    ageLabel: "3 años",
    pill: "danger",
    pillLabel: "MANÍ",
    notes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    birthDate: "12 mar 2022",
    room: "Soles",
    enrollment: "feb 2025",
    parents: [
      {
        name: "Lucía Fernández",
        role: "Mamá",
        status: "active",
        tone: "violet",
      },
      {
        name: "Diego Fernández",
        role: "Papá",
        status: "pending",
        tone: "steel",
      },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    avatarTone: "rose",
    ageLabel: "2 años",
    pill: null,
    birthDate: "15 jun 2023",
    room: "Soles",
    enrollment: "feb 2024",
    parents: [
      { name: "Mariana Méndez", role: "Mamá", status: "active", tone: "violet" },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    avatarTone: "mint",
    ageLabel: "3 años",
    pill: null,
    birthDate: "20 oct 2021",
    room: "Soles",
    enrollment: "feb 2024",
    parents: [
      { name: "Carla Ruiz", role: "Mamá", status: "active", tone: "violet" },
      { name: "Pablo Ruiz", role: "Papá", status: "pending", tone: "steel" },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    avatarTone: "gold",
    ageLabel: "2 años",
    pill: "link",
    pillLabel: "VINCULAR",
    birthDate: "04 feb 2023",
    room: "Soles",
    enrollment: "mar 2024",
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    avatarTone: "violet",
    ageLabel: "3 años",
    pill: "danger",
    pillLabel: "LACTOSA",
    notes:
      "Intolerancia a la lactosa. Sustituir la leche por bebida vegetal en la merienda.",
    birthDate: "11 ene 2022",
    room: "Soles",
    enrollment: "feb 2024",
    parents: [
      { name: "Natalia Díaz", role: "Mamá", status: "active", tone: "violet" },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    avatarTone: "rose",
    ageLabel: "2 años",
    pill: null,
    birthDate: "27 jul 2023",
    room: "Soles",
    enrollment: "feb 2025",
    parents: [
      { name: "Inés Castro", role: "Mamá", status: "active", tone: "violet" },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    avatarTone: "sky",
    ageLabel: "3 años",
    pill: null,
    birthDate: "08 sep 2021",
    room: "Soles",
    enrollment: "feb 2023",
    parents: [
      { name: "Jorge Romero", role: "Papá", status: "active", tone: "steel" },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    avatarTone: "mint",
    ageLabel: "2 años",
    pill: null,
    birthDate: "19 may 2023",
    room: "Soles",
    enrollment: "feb 2024",
    parents: [
      { name: "Renata Vega", role: "Mamá", status: "active", tone: "violet" },
    ],
  },
];
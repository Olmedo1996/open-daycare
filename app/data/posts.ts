export type PostType = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  authorName: string;
  timeLabel: string;
  type: PostType;
  recipientLabel: string;
  text: string;
  photoLabel?: string;
  likes: number;
  comments: number;
};

export const posts: Post[] = [
  {
    id: "post-1",
    authorName: "Mateo",
    timeLabel: "14:20",
    type: "achievement",
    recipientLabel: "Para: familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-2",
    authorName: "Mateo",
    timeLabel: "09:40",
    type: "activity",
    recipientLabel: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoLabel: "pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "post-3",
    authorName: "Anuncio general",
    timeLabel: "07:50",
    type: "announcement",
    recipientLabel: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
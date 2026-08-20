import type { Kid } from "@/app/data/kids";

type KidInfoCardProps = {
  kid: Pick<Kid, "birthDate" | "room" | "enrollment">;
};

const ROWS = [
  { label: "Fecha de nacimiento", key: "birthDate" },
  { label: "Sala", key: "room" },
  { label: "Ingreso", key: "enrollment" },
] as const;

export function KidInfoCard({ kid }: KidInfoCardProps) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      {ROWS.map((row, index) => (
        <div
          key={row.key}
          className={`flex justify-between px-[18px] py-[15px] ${
            index < ROWS.length - 1 ? "border-b border-line-soft" : ""
          }`}
        >
          <span className="text-[14.5px] text-muted">{row.label}</span>
          <span className="text-[14.5px] font-extrabold text-ink">
            {kid[row.key]}
          </span>
        </div>
      ))}
    </div>
  );
}
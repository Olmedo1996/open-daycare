"use client";

import { useState } from "react";
import type { Kid } from "@/app/data/kids";
import { SearchIcon } from "../shared/icons";
import { KidCard } from "./KidCard";

type SearchBoxProps = {
  kids: Kid[];
};

export function SearchBox({ kids }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const filtered = kids.filter((kid) =>
    kid.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
        <SearchIcon className="h-[18px] w-[18px] flex-none text-photo-icon" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          className="flex-1 border-none bg-transparent text-[15px] text-ink placeholder:text-muted-light focus:outline-none"
        />
      </div>

      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
          SALA SOLES
        </span>
        <span className="text-[13px] text-muted-light">
          {kids.length} niños
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        {filtered.map((kid) => (
          <KidCard key={kid.slug} kid={kid} />
        ))}
      </div>
    </>
  );
}
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Pokemon {
  id: number;
  name: string;
  image: string;
}

const TOTAL_POKEMON = 1025;

export function PokemonViewer() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [currentId, setCurrentId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadPokemon() {
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${currentId}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setPokemon({
            id: data.id,
            name: data.name,
            image: data.sprites.other['official-artwork'].front_default,
          });
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo cargar el pokémon.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPokemon();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentId]);

  const goToPrevious = () => {
    setLoading(true);
    setError(null);
    setCurrentId((id) => Math.max(1, id - 1));
  };

  const goToNext = () => {
    setLoading(true);
    setError(null);
    setCurrentId((id) => Math.min(TOTAL_POKEMON, id + 1));
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card border border-line p-6 shadow-sm">
      <h2 className="font-head font-semibold text-[24px] text-foreground">
        Pokémon actual
      </h2>

      {loading && <p className="text-muted">Cargando…</p>}
      {error && <p className="text-accent">{error}</p>}

      {!loading && !error && pokemon && (
        <div className="flex flex-col items-center gap-2">
          <Image
            src={pokemon.image}
            alt={pokemon.name}
            width={160}
            height={160}
            className="object-contain"
          />
          <span className="font-head font-semibold text-[20px] capitalize text-ink">
            {pokemon.name}
          </span>
          <span className="text-muted">#{pokemon.id}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={currentId <= 1 || loading}
          className="rounded-full bg-staff px-5 py-2 font-head font-semibold text-white transition-colors hover:bg-staff-deep disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={currentId >= TOTAL_POKEMON || loading}
          className="rounded-full bg-accent px-5 py-2 font-head font-semibold text-white transition-colors hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

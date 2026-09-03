'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="font-head font-semibold text-[32px] text-foreground">
        {count}
      </span>
      <button
        type="button"
        onClick={() => setCount((value) => value + 1)}
        className="rounded-full bg-accent px-6 py-2 font-head font-semibold text-white transition-colors hover:bg-accent-soft"
      >
        Incrementar
      </button>
    </div>
  );
}

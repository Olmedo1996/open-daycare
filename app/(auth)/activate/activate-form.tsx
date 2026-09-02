'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';

import { activateAccount, type ActivateState } from '@/lib/actions/activate';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="block text-center w-full p-4 rounded-[15px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-base cursor-pointer shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? 'Activando…' : 'Activar mi cuenta'}
    </button>
  );
}

export function ActivateForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const email = searchParams.get('email') ?? '';

  const [state, formAction] = useActionState<ActivateState, FormData>(
    activateAccount,
    { error: null },
  );

  return (
    <form action={formAction}>
      {/* Invitation code */}
      <div className="text-xs font-bold tracking-wider text-[#94887B] mb-2">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        type="text"
        name="code"
        defaultValue={code}
        required
        className="w-full p-3.5 px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-lg tracking-[3px] font-bold text-[#3F362E] mb-4 placeholder:text-[#B6A99B] font-head"
      />

      {/* Email */}
      <div className="text-xs font-bold tracking-wider text-[#94887B] mb-2">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        defaultValue={email}
        required
        autoComplete="email"
        className="w-full p-3.5 px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-base text-[#3F362E] mb-4 placeholder:text-[#B6A99B]"
      />

      {/* Password */}
      <div className="text-xs font-bold tracking-wider text-[#94887B] mb-2">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        required
        autoComplete="new-password"
        className="w-full p-3.5 px-4 rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white text-base text-[#3F362E] mb-[18px] placeholder:text-[#B6A99B]"
      />

      {/* Authorization checkbox */}
      <label className="flex items-start gap-3 bg-[#FBF1D6] rounded-[14px] p-3.5 px-4 mb-6 cursor-pointer">
        <span className="flex-none w-6 h-6 rounded-[8px] bg-[#5FB97E] flex items-center justify-center mt-[1px]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="text-sm text-[#8A7234] leading-[1.45]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
          de la app.
        </span>
      </label>

      {/* Activate button */}
      <SubmitButton />

      {state.error ? (
        <p role="alert" className="mt-4 text-center text-[#C5503A] text-sm font-bold">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

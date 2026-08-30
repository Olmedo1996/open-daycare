'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { signInAction, type LoginState } from '@/lib/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="block text-center w-full p-4 rounded-[15px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-base shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? 'Ingresando…' : 'Iniciar sesión'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(signInAction, {
    error: null,
  });

  return (
    <div>
      <form action={formAction}>
        {/* Email */}
        <div className="text-xs font-bold tracking-wider text-[#94887B] mb-2">EMAIL</div>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full p-3.5 px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-base text-[#3F362E] mb-4 placeholder:text-[#B6A99B]"
        />

        {/* Password */}
        <div className="text-xs font-bold tracking-wider text-[#94887B] mb-2">CONTRASEÑA</div>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full p-3.5 px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-base text-[#3F362E] mb-2.5 placeholder:text-[#B6A99B]"
        />

        {/* Forgot password */}
        <div className="text-right mb-5">
          <span className="text-[#C5503A] text-[13.5px] font-bold cursor-default">
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        {/* Login button */}
        <SubmitButton />
      </form>

      {state.error ? (
        <p role="alert" className="mt-4 text-center text-[#C5503A] text-sm font-bold">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

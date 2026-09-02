import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ActivateForm } from './activate-form';

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string }>;
}) {
  const { code, email } = await searchParams;

  let invitation: { child_name: string; room_name: string | null } | null = null;

  if (code && email) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_invitation_by_code', {
      p_code: code,
      p_email: email,
    });
    if (!error && data && data.length > 0) {
      invitation = {
        child_name: data[0].child_name,
        room_name: data[0].room_name,
      };
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="w-[58px] h-[58px] rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] flex items-center justify-center mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-head font-semibold text-[32px] leading-[1.15] mb-2 text-[#3F362E]">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-6 text-[#94887B] text-[15.5px] leading-[1.55]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        {/* Invitation card */}
        {invitation ? (
          <div className="flex items-center gap-[14px] bg-white border-[1.5px] border-[#EADFD0] rounded-[16px] p-3.5 px-4 mb-[22px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#A9D9E8] text-[#1F7A93] font-head font-semibold text-[19px] flex items-center justify-center">
              {invitation.child_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-[#94887B]">
                Te invitaron a seguir a
              </div>
              <div className="font-head font-semibold text-lg text-[#3F362E]">
                {invitation.child_name} · Sala{' '}
                {invitation.room_name ?? 'Sin sala'}
              </div>
            </div>
          </div>
        ) : null}

        {/* Activation form */}
        <Suspense fallback={null}>
          <ActivateForm />
        </Suspense>

        {/* Footer link */}
        <p className="text-center mt-[22px] text-[#94887B] text-[14.5px]">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-[#C5503A] font-extrabold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

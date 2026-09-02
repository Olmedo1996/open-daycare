import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type SendInvitationEmailInput = {
  to: string;
  parentName: string;
  childName: string;
  code: string;
  activateUrl: string;
};

export async function sendInvitationEmail({
  to,
  parentName,
  childName,
  code,
  activateUrl,
}: SendInvitationEmailInput) {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: `Te invitaron a seguir el día de ${childName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #3F362E;">
        <h2 style="color: #D9583C;">¡Hola ${parentName}!</h2>
        <p>Te invitaron a seguir el día de <strong>${childName}</strong> en OpenDayCare.</p>
        <p>Activá tu cuenta desde el siguiente enlace y creá tu contraseña:</p>
        <p>
          <a href="${activateUrl}" style="display: inline-block; padding: 12px 20px; background: #D9583C; color: #fff; border-radius: 8px; text-decoration: none;">
            Activar mi cuenta
          </a>
        </p>
        <p>Tu código de invitación es:</p>
        <p style="font-size: 24px; letter-spacing: 6px; font-weight: bold;">${code}</p>
        <p style="color: #94887B; font-size: 13px;">El enlace vence en 7 días.</p>
      </div>
    `,
    text: `¡Hola ${parentName}!\n\nTe invitaron a seguir el día de ${childName} en OpenDayCare.\n\nActivá tu cuenta desde: ${activateUrl}\n\nTu código de invitación es: ${code}\n\nEl enlace vence en 7 días.`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

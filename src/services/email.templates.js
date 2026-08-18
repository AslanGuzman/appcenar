export function buildActivationEmail(firstName, activationUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1f2937;">Bienvenido a AppCenar</h2>
      <p>Hola ${firstName},</p>
      <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
      <p><a href="${activationUrl}" style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Activar cuenta</a></p>
      <p>Si no realizaste este registro, puedes ignorar este correo.</p>
    </div>
  `;
}

export function buildResetPasswordEmail(firstName, resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1f2937;">Restablecer contraseña</h2>
      <p>Hola ${firstName},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Restablecer contraseña</a></p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
  `;
}

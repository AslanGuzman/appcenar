import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Sin esto, una configuración SMTP incorrecta o bloqueada por la red puede
  // dejar la conexión "colgada" varios minutos (los defaults de Nodemailer
  // son de hasta 2 minutos), congelando cualquier request que espere el
  // envío del correo. Con timeouts cortos, falla rápido y se ve en los logs.
  connectionTimeout: 10000, // 10s para establecer conexión con el servidor SMTP
  greetingTimeout: 10000, // 10s esperando el saludo del servidor
  socketTimeout: 15000, // 15s de inactividad en el socket
});

// Verificación al arrancar el servidor: deja evidencia clara en los logs de
// Railway sobre si las credenciales de correo están bien configuradas, sin
// bloquear el arranque de la aplicación.
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter
    .verify()
    .then(() => console.log("[email.service] Conexión SMTP verificada correctamente."))
    .catch((err) =>
      console.error(
        "[email.service] ADVERTENCIA: no se pudo verificar la conexión SMTP. Revisa EMAIL_SERVICE/EMAIL_USER/EMAIL_PASS. Detalle:",
        err.message
      )
    );
} else {
  console.warn("[email.service] ADVERTENCIA: EMAIL_USER o EMAIL_PASS no están configurados. Los correos no se enviarán.");
}

export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"AppCenar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[email.service] Correo enviado a ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error("[email.service] No se pudo enviar el correo:", err.message);
    // No detenemos el flujo principal por un fallo de correo
    return null;
  }
}

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

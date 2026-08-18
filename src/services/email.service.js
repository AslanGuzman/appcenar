const SEND_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const ACCOUNT_ENDPOINT = "https://api.brevo.com/v3/account";
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_SENDER_NAME = "AppCenar";

function getConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;

  if (!apiKey || !senderEmail) {
    throw new Error("Faltan BREVO_API_KEY y/o EMAIL_FROM en las variables de entorno.");
  }

  return {
    apiKey,
    sender: {
      email: senderEmail,
      name: process.env.EMAIL_FROM_NAME || DEFAULT_SENDER_NAME,
    },
  };
}

async function requestBrevo(url, { apiKey, method = "GET", body }) {
  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        "api-key": apiKey,
        accept: "application/json",
        ...(body && { "content-type": "application/json" }),
      },
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(`No se pudo contactar a Brevo: ${err.message}`);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Brevo respondió ${response.status}: ${payload?.message || response.statusText}`);
  }

  return payload;
}

export async function sendEmail({ to, subject, html }) {
  const { apiKey, sender } = getConfig();

  const { messageId } = await requestBrevo(SEND_ENDPOINT, {
    apiKey,
    method: "POST",
    body: {
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
  });

  console.log(`[email] Correo enviado a ${to} (messageId: ${messageId})`);
  return messageId;
}

export async function verifyEmailConfig() {
  try {
    const { apiKey, sender } = getConfig();
    const account = await requestBrevo(ACCOUNT_ENDPOINT, { apiKey });
    console.log(`[email] Brevo conectado como ${account.email}. Remitente: ${sender.name} <${sender.email}>`);
  } catch (err) {
    console.error(`[email] Los correos no se enviarán: ${err.message}`);
  }
}

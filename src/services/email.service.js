import nodemailer from "nodemailer";

const BREVO_SEND_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const BREVO_ACCOUNT_ENDPOINT = "https://api.brevo.com/v3/account";
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_SENDER_NAME = "AppCenar";

function getSender() {
  const email = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!email) {
    throw new Error("Falta EMAIL_FROM (o EMAIL_USER) en las variables de entorno.");
  }

  return { email, name: process.env.EMAIL_FROM_NAME || DEFAULT_SENDER_NAME };
}

function createTransport() {
  const { EMAIL_SERVICE, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Faltan EMAIL_USER y/o EMAIL_PASS en las variables de entorno.");
  }

  const auth = { user: EMAIL_USER, pass: EMAIL_PASS };

  if (EMAIL_HOST) {
    const port = Number(EMAIL_PORT) || 587;
    return nodemailer.createTransport({ host: EMAIL_HOST, port, secure: port === 465, auth });
  }

  return nodemailer.createTransport({ service: EMAIL_SERVICE || "gmail", auth });
}

async function requestBrevo(url, { method = "GET", body } = {}) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("Falta BREVO_API_KEY en las variables de entorno.");
  }

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

const nodemailerTransport = {
  name: "nodemailer",

  async send({ to, subject, html }) {
    const sender = getSender();
    const info = await createTransport().sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to,
      subject,
      html,
    });

    return info.messageId;
  },

  async verify() {
    const sender = getSender();
    await createTransport().verify();
    return `SMTP listo. Remitente: ${sender.name} <${sender.email}>`;
  },
};

const brevoApiTransport = {
  name: "brevo-api",

  async send({ to, subject, html }) {
    const sender = getSender();
    const { messageId } = await requestBrevo(BREVO_SEND_ENDPOINT, {
      method: "POST",
      body: { sender, to: [{ email: to }], subject, htmlContent: html },
    });

    return messageId;
  },

  async verify() {
    const sender = getSender();
    const account = await requestBrevo(BREVO_ACCOUNT_ENDPOINT);
    return `Brevo conectado como ${account.email}. Remitente: ${sender.name} <${sender.email}>`;
  },
};

const TRANSPORTS = {
  [nodemailerTransport.name]: nodemailerTransport,
  [brevoApiTransport.name]: brevoApiTransport,
};

function getTransport() {
  const requested = process.env.EMAIL_TRANSPORT || nodemailerTransport.name;
  const transport = TRANSPORTS[requested];

  if (!transport) {
    throw new Error(`EMAIL_TRANSPORT '${requested}' no es válido. Usa: ${Object.keys(TRANSPORTS).join(", ")}.`);
  }

  return transport;
}

export async function sendEmail({ to, subject, html }) {
  const transport = getTransport();
  const messageId = await transport.send({ to, subject, html });

  console.log(`[email] Correo enviado a ${to} vía ${transport.name} (messageId: ${messageId})`);
  return messageId;
}

export async function verifyEmailConfig() {
  try {
    const transport = getTransport();
    console.log(`[email] ${await transport.verify()}`);
  } catch (err) {
    console.error(`[email] Los correos no se enviarán: ${err.message}`);
  }
}

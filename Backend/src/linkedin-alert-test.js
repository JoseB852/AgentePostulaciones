const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(
  __dirname,
  "../credentials/google-oauth.json"
);

const TOKEN_PATH = path.join(
  __dirname,
  "../credentials/token.json"
);

function decodeBase64Url(data) {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
}

async function testLinkedInAlert() {
  const credentials = JSON.parse(
    await fs.readFile(CREDENTIALS_PATH, "utf8")
  );

  const token = JSON.parse(
    await fs.readFile(TOKEN_PATH, "utf8")
  );

  const { client_id, client_secret } = credentials.installed;

  const auth = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost"
  );

  auth.setCredentials(token);

  const gmail = google.gmail({
    version: "v1",
    auth,
  });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "from:jobalerts-noreply@linkedin.com",
    maxResults: 1,
  });

  const message = response.data.messages?.[0];

  if (!message) {
    console.log("No se encontraron alertas de LinkedIn.");
    return;
  }

  const email = await gmail.users.messages.get({
    userId: "me",
    id: message.id,
    format: "full",
  });

  const parts = email.data.payload.parts || [];

  const textPart = parts.find(
    (part) => part.mimeType === "text/plain"
  );

  if (!textPart?.body?.data) {
    console.log("No se encontró el cuerpo de texto del correo.");
    return;
  }

  const text = decodeBase64Url(textPart.body.data);

  console.log("✅ Alerta de LinkedIn leída.");
  console.log("");
  console.log("========== CONTENIDO ==========");
  console.log(text);
  console.log("================================");
}

testLinkedInAlert().catch((error) => {
  console.error("❌ Error:", error.message);
});
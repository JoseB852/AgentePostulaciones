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

async function testGmail() {
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
    maxResults: 5,
  });

  console.log("✅ Gmail responde correctamente.");
  console.log(`📨 Mensajes encontrados: ${response.data.messages?.length || 0}`);
}

testGmail().catch((error) => {
  console.error("❌ Error:", error.message);
});
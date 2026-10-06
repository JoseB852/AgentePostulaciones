const fs = require("fs").promises;
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.messages.readonly",
];

const CREDENTIALS_PATH = path.join(
  __dirname,
  "../credentials/google-oauth.json"
);

const TOKEN_PATH = path.join(
  __dirname,
  "../credentials/token.json"
);

async function authorize() {
  const auth = await authenticate({
    keyfilePath: CREDENTIALS_PATH,
    scopes: SCOPES,
    access_type: "offline",
  });

  const credentials = auth.credentials;

  await fs.writeFile(
    TOKEN_PATH,
    JSON.stringify(credentials, null, 2)
  );

  console.log("✅ Autorización de Gmail completada.");
  console.log("✅ Token guardado en credentials/token.json");
}

authorize().catch((error) => {
  console.error("❌ Error durante la autorización:", error.message);
});
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

function extractJobs(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const jobs = [];

  const noisePatterns = [
    /personas estudiaron/i,
    /persona estudió/i,
    /esta empresa busca personal activamente/i,
    /solicitar con perfil y cv/i,
    /^ver todos los empleos/i,
    /^editar alerta/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("Ver anuncio de empleo:")) {
      continue;
    }

    let url = lines[i]
      .replace("Ver anuncio de empleo:", "")
      .trim();

    const markdownMatch = url.match(
      /^\[([^\]]+)\]\(([^)]+)\)$/
    );

    if (markdownMatch) {
      url = markdownMatch[1];
    }

    // Normalizar URL de LinkedIn
    const linkedinJobMatch = url.match(
      /https?:\/\/www\.linkedin\.com\/comm\/jobs\/view\/(\d+)/
    );

    if (linkedinJobMatch) {
      url = `https://www.linkedin.com/comm/jobs/view/${linkedinJobMatch[1]}/`;
    }

    const candidates = [];

    for (let j = i - 1; j >= 0; j--) {
      const line = lines[j];

      if (line === "---------------------------------------------------------") {
        break;
      }

      if (
        line.startsWith("Ver todos los empleos") ||
        line.startsWith("Editar alerta") ||
        line.startsWith("Empleos de") ||
        line.startsWith("Nuevos empleos")
      ) {
        break;
      }

      if (noisePatterns.some((pattern) => pattern.test(line))) {
        continue;
      }

      candidates.unshift(line);

      if (candidates.length === 3) {
        break;
      }
    }

    if (candidates.length !== 3) {
      continue;
    }

    const [title, company, location] = candidates;

    jobs.push({
      title,
      company,
      location,
      url,
      source: "linkedin",
    });
  }

  // Eliminar ofertas duplicadas por URL
  const uniqueJobs = new Map();

  for (const job of jobs) {
    uniqueJobs.set(job.url, job);
  }

  return Array.from(uniqueJobs.values());
}

async function testLinkedInParser() {
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

  console.log("Buscando última alerta de LinkedIn...");

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

  console.log("Alerta encontrada.");

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

  const jobs = extractJobs(text);

  console.log("");
  console.log("========== OFERTAS EXTRAÍDAS ==========");

  jobs.forEach((job, index) => {
    console.log("");
    console.log(`Oferta ${index + 1}`);
    console.log(`Título: ${job.title}`);
    console.log(`Empresa: ${job.company}`);
    console.log(`Ubicación: ${job.location}`);
    console.log(`Fuente: ${job.source}`);
  });

  console.log("");
  console.log("=======================================");
  console.log(`Total encontradas: ${jobs.length}`);
}

testLinkedInParser().catch((error) => {
  console.error("Error:", error.message);
});
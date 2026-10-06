const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");


const {
  calculateJobMatch,
  isRelevantJob,
} = require("./jobMatcher.service");

const { saveJobs } = require("./jobs.service");

const CREDENTIALS_PATH = path.join(
  __dirname,
  "../../credentials/google-oauth.json"
);

const TOKEN_PATH = path.join(
  __dirname,
  "../../credentials/token.json"
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
      description: "",
    });
  }

  const uniqueJobs = new Map();

  for (const job of jobs) {
    uniqueJobs.set(job.url, job);
  }

  return Array.from(uniqueJobs.values());
}

async function getLatestLinkedInAlert() {
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
    return [];
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
    return [];
  }

  const text = decodeBase64Url(textPart.body.data);

  return extractJobs(text);
}

async function searchLinkedInJobs() {
  const jobs = await getLatestLinkedInAlert();

  const relevantJobs = jobs
    .map((job) => {
      const matchResult = calculateJobMatch(job);

      return {
        ...job,
        matchResult,
      };
    })
    .filter((job) => isRelevantJob(job.matchResult));

  const newJobs = await saveJobs(relevantJobs);

  return {
    relevantJobs,
    newJobs,
  };
}

module.exports = {
  getLatestLinkedInAlert,
  searchLinkedInJobs,
};
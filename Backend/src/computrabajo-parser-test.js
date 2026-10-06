const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(
  __dirname,
  "../credentials/google-oauth.json"
);

const TOKEN_PATH = path.join(
  __dirname,
  "../credentials/token.json"
);

const REMITENTE = "trabajos_cl@computrabajo.com";

const decodeBase64Url = (data) => {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf-8");
};

const decodeHtmlEntities = (text) => {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
};

const cleanText = (text) => {
  return decodeHtmlEntities(
    text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
};

const extractOriginalUrl = (href) => {
  try {
    const url = new URL(href);

    const originalUrl = url.searchParams.get("url");

    if (!originalUrl) {
      return null;
    }

    return decodeURIComponent(originalUrl).split("?")[0];
  } catch {
    return null;
  }
};

const parseComputrabajoJobs = (html) => {
  const jobs = [];

  /*
   * Encontramos todos los títulos reales de ofertas.
   */
  const titlePattern =
    /<td class="title_oferta"[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>/gi;

  const titles = [...html.matchAll(titlePattern)];

  console.log(
    "Títulos de ofertas encontrados:",
    titles.length
  );

  for (let i = 0; i < titles.length; i++) {
    const titleMatch = titles[i];

    const title = cleanText(
      titleMatch[1]
    );

    /*
     * Inicio de esta tarjeta.
     */
    const start = titleMatch.index;

    /*
     * Fin de esta tarjeta:
     * justo antes del siguiente título.
     */
    const end =
      i + 1 < titles.length
        ? titles[i + 1].index
        : html.length;

    const block = html.substring(
      start,
      end
    );

    /*
     * Buscamos el enlace de esta tarjeta.
     */
    const urlMatch = block.match(
      /href="([^"]*go\.computrabajo\.com\/go\/app\/o_detail[^"]*)"/i
    );

    if (!urlMatch) {
      console.log(
        "No se encontró URL para:",
        title
      );

      continue;
    }

    const url = extractOriginalUrl(
      urlMatch[1]
    );

    if (!url) {
      continue;
    }

    /*
     * Información de la oferta.
     *
     * Primer texto_oferta:
     * rating + empresa
     *
     * Segundo texto_oferta:
     * ubicación
     */
    const infoMatches = [
      ...block.matchAll(
        /<td class="texto_oferta"[^>]*>([\s\S]*?)<\/td>/gi
      ),
    ];

    let company = null;
    let location = null;
    let publishedText = null;

    if (infoMatches.length >= 1) {
      company = cleanText(
        infoMatches[0][1]
      ).replace(
        /^\d+(\.\d+)?\s*/,
        ""
      );
    }

    if (infoMatches.length >= 2) {
      location = cleanText(
        infoMatches[1][1]
      );

      /*
       * Buscamos el primer <td> después
       * de la ubicación.
       */
      const locationEnd =
        infoMatches[1].index +
        infoMatches[1][0].length;

      const afterLocation =
        block.substring(locationEnd);

      const nextTd =
        afterLocation.match(
          /<td[^>]*>([\s\S]*?)<\/td>/i
        );

      if (nextTd) {
        publishedText = cleanText(
          nextTd[1]
        );
      }
    }

    jobs.push({
      title,
      company,
      location,
      published_text: publishedText,
      url,
      source: "computrabajo",
    });
  }

  /*
   * Eliminamos duplicados por URL.
   */
  const uniqueJobs = new Map();

  for (const job of jobs) {
    uniqueJobs.set(
      job.url,
      job
    );
  }

  return Array.from(
    uniqueJobs.values()
  );
};

async function getLatestComputrabajoAlert() {
  const credentials = JSON.parse(
    fs.readFileSync(
      CREDENTIALS_PATH,
      "utf8"
    )
  );

  const token = JSON.parse(
    fs.readFileSync(
      TOKEN_PATH,
      "utf8"
    )
  );

  const auth = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );

  auth.setCredentials(token);

  const gmail = google.gmail({
    version: "v1",
    auth,
  });

  const response =
    await gmail.users.messages.list({
      userId: "me",
      q: `from:${REMITENTE}`,
      maxResults: 10,
    });

  const messages =
    response.data.messages || [];

  console.log(
    "Correos encontrados:",
    messages.length
  );

  if (messages.length === 0) {
    return [];
  }

  const message =
    await gmail.users.messages.get({
      userId: "me",
      id: messages[0].id,
      format: "full",
    });

  if (
    !message.data.payload ||
    !message.data.payload.body ||
    !message.data.payload.body.data
  ) {
    throw new Error(
      "El correo no contiene HTML en el cuerpo esperado."
    );
  }

  const html = decodeBase64Url(
    message.data.payload.body.data
  );

  return parseComputrabajoJobs(html);
}

async function test() {
  try {
    const jobs =
      await getLatestComputrabajoAlert();

    console.log("");
    console.log(
      "========== COMPUTRABAJO =========="
    );

    jobs.forEach((job, index) => {
      console.log("");
      console.log(
        `Oferta ${index + 1}`
      );

      console.log(
        `Título: ${job.title}`
      );

      console.log(
        `Empresa: ${job.company}`
      );

      console.log(
        `Ubicación: ${job.location}`
      );

      console.log(
        `Publicado: ${job.published_text}`
      );

      console.log(
        `URL: ${job.url}`
      );

      console.log(
        `Fuente: ${job.source}`
      );
    });

    console.log("");
    console.log(
      "=================================="
    );

    console.log(
      `Total encontradas: ${jobs.length}`
    );
  } catch (error) {
    console.error(
      "Error:",
      error.message
    );
  }
}

module.exports = {
  getLatestComputrabajoAlert,
  parseComputrabajoJobs,
};

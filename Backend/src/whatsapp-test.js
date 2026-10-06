require("dotenv").config();

const db = require("./db");

const {
  sendWhatsAppTemplate,
} = require("./services/whatsapp.service");

async function test() {
  try {
    const [jobs] = await db.query(`
      SELECT *
      FROM jobs
      WHERE source = 'computrabajo'
        AND match_score >= 30
      ORDER BY id DESC
      LIMIT 1
    `);

    if (jobs.length === 0) {
      throw new Error(
        "No se encontró ninguna oferta de Computrabajo compatible."
      );
    }

    const job = jobs[0];

    console.log("");
    console.log("======= PRUEBA WHATSAPP =======");
    console.log(`Título: ${job.title}`);
    console.log(`Empresa: ${job.company}`);
    console.log(`Ubicación: ${job.location}`);
    console.log(`Match: ${job.match_score}`);
    console.log(`URL: ${job.url}`);
    console.log("");

    const result = await sendWhatsAppTemplate(
      process.env.WHATSAPP_TEST_TO,
      job.title,
      job.location,
      job.match_score,
      job.url
    );

    console.log("WhatsApp respondió correctamente:");
    console.log(JSON.stringify(result, null, 2));

    console.log("");
    console.log("================================");
  } catch (error) {
    console.error("");
    console.error("Error:", error.message);
  } finally {
    await db.end();
  }
}

test();
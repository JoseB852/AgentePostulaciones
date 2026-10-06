const cron = require("node-cron");

const {
  searchAndSaveJobs,
} = require("./services/getonboard.service");

const {
  searchLinkedInJobs,
} = require("./services/linkedin.service");

const {
  searchComputrabajoJobs,
} = require("./services/computrabajo.service");

const {
  getUnnotifiedJobs,
  markJobAsNotified,
} = require("./services/jobs.service");

const {
  sendWhatsAppTemplate,
} = require("./services/whatsapp.service");

const startScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("\n==============================");
    console.log("EJECUTANDO BÚSQUEDA AUTOMÁTICA");
    console.log("==============================");

    try {
      console.log("\n--- GET ON BOARD ---");

      const newGetOnBoardJobs = await searchAndSaveJobs([
        "node.js",
        "react",
        "typescript",
      ]);

      console.log(
        `Nuevas ofertas Get on Board: ${newGetOnBoardJobs.length}`
      );

      console.log("\n--- LINKEDIN ---");

      const linkedinResult = await searchLinkedInJobs();

      console.log(
        `Ofertas relevantes LinkedIn: ${linkedinResult.relevantJobs.length}`
      );

      console.log(
        `Ofertas nuevas LinkedIn: ${linkedinResult.newJobs.length}`
      );

      console.log("\n--- COMPUTRABAJO ---");

      const computrabajoResult = await searchComputrabajoJobs();

      console.log(
        `Ofertas encontradas Computrabajo: ${computrabajoResult.jobs.length}`
      );

      console.log(
        `Ofertas relevantes Computrabajo: ${computrabajoResult.relevantJobs.length}`
      );

      console.log(
        `Ofertas nuevas Computrabajo: ${computrabajoResult.newJobs.length}`
      );

      console.log("\n--- PENDIENTES DE NOTIFICACIÓN ---");

      const pendingJobs = await getUnnotifiedJobs();

      console.log(
        `Ofertas pendientes de notificación: ${pendingJobs.length}`
      );

      for (const job of pendingJobs) {
        console.log(
          `- [${job.match_score}] ${job.title} | ${
            job.company || "Empresa no especificada"
          } | ${job.source}`
        );

        try {
          await sendWhatsAppTemplate(
            process.env.WHATSAPP_TEST_TO,
            job.title,
            job.location,
            job.match_score,
            job.url
          );

          await markJobAsNotified(job.id);

          console.log(
            `WhatsApp enviado correctamente: ${job.id}`
          );
        } catch (error) {
          console.error(
            `Error enviando WhatsApp para la oferta ${job.id}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Error en la búsqueda automática:",
        error.message
      );
    }
  });

  console.log("Scheduler iniciado. Búsqueda cada hora.");
};

module.exports = {
  startScheduler,
};
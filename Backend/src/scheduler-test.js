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
} = require("./services/jobs.service");

async function test() {
  try {
    console.log("\n==============================");
    console.log("PRUEBA DEL AGENTE COMPLETO");
    console.log("==============================");

    console.log("\n--- GET ON BOARD ---");

    const getOnBoardJobs = await searchAndSaveJobs([
      "node.js",
      "react",
      "typescript",
    ]);

    console.log(
      `Nuevas ofertas Get on Board: ${getOnBoardJobs.length}`
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

    console.log("\n--- PENDIENTES ---");

    const pendingJobs = await getUnnotifiedJobs();

    console.log(
      `Ofertas pendientes de notificación: ${pendingJobs.length}`
    );

    pendingJobs.forEach((job, index) => {
      console.log("");
      console.log(`Oferta ${index + 1}`);
      console.log(`Título: ${job.title}`);
      console.log(`Empresa: ${job.company || "No especificada"}`);
      console.log(`Fuente: ${job.source}`);
      console.log(`Score: ${job.match_score}`);
      console.log(`URL: ${job.url}`);
    });

    console.log("\n==============================");
    console.log("PRUEBA FINALIZADA");
    console.log("==============================");
  } catch (error) {
    console.error("\nError:", error.message);
  }
}

test();
const { searchLinkedInJobs } = require("./services/linkedin.service");

async function test() {
  try {
    const result = await searchLinkedInJobs();

    console.log("");
    console.log("========== LINKEDIN + MYSQL ==========");

    console.log(
      `Ofertas relevantes: ${result.relevantJobs.length}`
    );

    console.log(
      `Ofertas nuevas guardadas: ${result.newJobs.length}`
    );

    result.relevantJobs.forEach((job, index) => {
      console.log("");
      console.log(`Oferta ${index + 1}`);
      console.log(`Título: ${job.title}`);
      console.log(`Empresa: ${job.company}`);
      console.log(`Ubicación: ${job.location}`);
      console.log(`Score: ${job.matchResult.score}`);
      console.log(`URL: ${job.url}`);
    });

    console.log("");
    console.log("======================================");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
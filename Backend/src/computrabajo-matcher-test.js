const {
  searchComputrabajoJobs,
} = require("./services/computrabajo.service");

async function test() {
  try {
    const result = await searchComputrabajoJobs();

    console.log("");
    console.log("======= DIAGNÓSTICO COMPUTRABAJO =======");

    result.jobs.forEach((job, index) => {
      console.log("");
      console.log(`Oferta ${index + 1}`);
      console.log(`Título: ${job.title}`);
      console.log(`Empresa: ${job.company}`);
      console.log(`Ubicación: ${job.location}`);

      const match = job.matchResult;

      console.log(`Score: ${match.score}`);
      console.log(`Roles: ${match.matchedRoles.join(", ") || "ninguno"}`);
      console.log(
        `Stack principal: ${
          match.matchedPrimaryStack.join(", ") || "ninguno"
        }`
      );
      console.log(
        `High priority: ${
          match.matchedHighPrioritySkills.join(", ") || "ninguno"
        }`
      );
      console.log(
        `Medium priority: ${
          match.matchedMediumPrioritySkills.join(", ") || "ninguno"
        }`
      );
      console.log(
        `Exclusiones: ${
          match.exclusionReasons.join(", ") || "ninguna"
        }`
      );
      console.log(
        `Senioridad: ${
          match.seniorityMatches.join(", ") || "ninguna"
        }`
      );
    });

    console.log("");
    console.log("========================================");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
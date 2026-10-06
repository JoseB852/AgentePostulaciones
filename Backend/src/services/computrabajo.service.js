const {
  getLatestComputrabajoAlert,
} = require("../computrabajo-parser-test");

const {
  calculateJobMatch,
  isRelevantJob,
} = require("./jobMatcher.service");

const {
  saveJobs,
} = require("./jobs.service");

async function searchComputrabajoJobs() {
  const jobs = await getLatestComputrabajoAlert();

  const analyzedJobs = jobs.map((job) => {
    const matchResult = calculateJobMatch(job);

    return {
      ...job,
      matchResult,
    };
  });

  const relevantJobs = analyzedJobs.filter((job) =>
    isRelevantJob(job.matchResult)
  );

  const newJobs = await saveJobs(relevantJobs);

  return {
    jobs: analyzedJobs,
    relevantJobs,
    newJobs,
  };
}

module.exports = {
  searchComputrabajoJobs,
};
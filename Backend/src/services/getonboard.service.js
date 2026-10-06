const {
  searchMultipleQueries,
} = require("../collectors/getonboard");

const {
  calculateJobMatch,
  isRelevantJob,
} = require("./jobMatcher.service");

const {
  saveJobs,
} = require("./jobs.service");

const searchAndSaveJobs = async (queries) => {
  const jobs = await searchMultipleQueries(queries);

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

  return newJobs;
};

module.exports = {
  searchAndSaveJobs,
};
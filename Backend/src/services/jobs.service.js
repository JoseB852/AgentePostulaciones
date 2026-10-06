const db = require("../db");

const saveJob = async (job, matchResult) => {
  const [existingJobs] = await db.query(
    "SELECT id FROM jobs WHERE url = ?",
    [job.url]
  );

  const query = `
    INSERT INTO jobs
    (
      title,
      company,
      location,
      url,
      description,
      source,
      published_at,
      match_score,
      matched_roles,
      matched_primary_stack,
      exclusion_reasons
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      company = VALUES(company),
      location = VALUES(location),
      description = VALUES(description),
      source = VALUES(source),
      published_at = VALUES(published_at),
      match_score = VALUES(match_score),
      matched_roles = VALUES(matched_roles),
      matched_primary_stack = VALUES(matched_primary_stack),
      exclusion_reasons = VALUES(exclusion_reasons)
  `;

  await db.query(query, [
    job.title,
    job.company,
    job.location,
    job.url,
    job.description,
    job.source,
    job.published_at,
    matchResult.score,
    JSON.stringify(matchResult.matchedRoles),
    JSON.stringify(matchResult.matchedPrimaryStack),
    JSON.stringify(matchResult.exclusionReasons),
  ]);

  return existingJobs.length === 0;
};

const saveJobs = async (jobs) => {
  const newJobs = [];

  for (const job of jobs) {
    const isNew = await saveJob(job, job.matchResult);

    if (isNew) {
      newJobs.push(job);
    }
  }

  return newJobs;
};

const removeDuplicateJobs = (jobs) => {
  const uniqueJobs = new Map();

  for (const job of jobs) {
    uniqueJobs.set(job.url, job);
  }

  return Array.from(uniqueJobs.values());
};

const filterRecentJobs = (jobs, days = 7) => {
  const limit = new Date();

  limit.setDate(limit.getDate() - days);

  return jobs.filter((job) => {
    if (!job.published_at) {
      return false;
    }

    return new Date(job.published_at) >= limit;
  });
};

const markJobAsNotified = async (jobId) => {
  await db.query(
    "UPDATE jobs SET notified_at = CURRENT_TIMESTAMP WHERE id = ?",
    [jobId]
  );
};

const getUnnotifiedJobs = async () => {
  const [jobs] = await db.query(`
    SELECT *
    FROM jobs
    WHERE notified_at IS NULL
      AND match_score IS NOT NULL
      AND match_score >= 30
    ORDER BY created_at ASC
  `);

  return jobs;
};

module.exports = {
  saveJob,
  saveJobs,
  removeDuplicateJobs,
  filterRecentJobs,
  markJobAsNotified,
  getUnnotifiedJobs
};
const https = require("https");

const getJobsFromGetOnBoard = async (query = "node.js") => {
  return new Promise((resolve, reject) => {
    const url =
      `https://www.getonbrd.com/api/v0/search/jobs?query=${encodeURIComponent(query)}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(
                `Get on Board respondió con HTTP ${res.statusCode}: ${data.trim()}`
              );
            }

            const result = JSON.parse(data);

            const jobs = result.data.map((job) => {
              return {
                title: job.attributes.title,
                company: null,
                location:
                  job.attributes.countries?.join(", ") || null,
                url: job.links.public_url,
                description: job.attributes.description,
                source: "getonbrd",
                published_at: job.attributes.published_at
                  ? new Date(job.attributes.published_at * 1000)
                  : null,
              };
            });

            resolve(jobs);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
};

const searchMultipleQueries = async (queries) => {
  const results = await Promise.all(
    queries.map((query) => getJobsFromGetOnBoard(query))
  );

  const allJobs = results.flat();

  const uniqueJobs = new Map();

  for (const job of allJobs) {
    uniqueJobs.set(job.url, job);
  }

  return Array.from(uniqueJobs.values());
};

module.exports = {
  getJobsFromGetOnBoard,
  searchMultipleQueries,
};
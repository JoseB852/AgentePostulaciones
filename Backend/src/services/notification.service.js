const {
  getUnnotifiedJobs,
} = require("./jobs.service");

const formatJobNotification = (job) => {
  return [
    "🔔 Nueva oferta compatible",
    "",
    `💼 ${job.title}`,
    `🏢 ${job.company || "Empresa no especificada"}`,
    `📍 ${job.location || "Ubicación no especificada"}`,
    `🎯 Match: ${job.match_score}%`,
    "",
    `🔗 ${job.url}`,
  ].join("\n");
};

const previewNotifications = async () => {
  const jobs = await getUnnotifiedJobs();

  for (const job of jobs) {
    console.log("");
    console.log("==============================");
    console.log(formatJobNotification(job));
    console.log("==============================");
  }

  return jobs;
};

module.exports = {
  formatJobNotification,
  previewNotifications,
};
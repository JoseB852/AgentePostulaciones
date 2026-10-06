const { previewNotifications } = require("./services/notification.service");

async function test() {
  try {
    const jobs = await previewNotifications();

    console.log("");
    console.log(`Total pendientes: ${jobs.length}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
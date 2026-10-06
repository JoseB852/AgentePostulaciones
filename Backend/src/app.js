const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { startScheduler } = require("./scheduler");

const jobsRoutes = require("./routes/jobs.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Agente de postulaciones funcionando",
  });
});


app.use("/jobs", jobsRoutes);

startScheduler();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
const express = require("express");


const { createJob, getJobs, getJobById, updateJob, deleteJob } = require("../controllers/jobs.controller");

const router = express.Router();

router.post("/", createJob);
router.get("/", getJobs)
router.get("/:id", getJobById)
router.put("/:id", updateJob)
router.delete("/:id", deleteJob)

module.exports = router;
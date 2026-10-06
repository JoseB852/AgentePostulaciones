
const db = require("../db");

const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      url,
      description,
      source,
    } = req.body;

    const query = `
      INSERT INTO jobs
      (title, company, location, url, description, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      title,
      company,
      location,
      url,
      description,
      source,
    ]);

    res.status(201).json({
      success: true,
      jobId: result.insertId,
    });
  } catch (error) {
    console.error("Error al insertar oferta:", error);

    res.status(500).json({
      success: false,
      message: "No se pudo insertar la oferta",
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const [jobs] = await db.query('SELECT * FROM jobs ORDER BY created_at DESC')

    res.json({
      success: true,
      jobs,

    })
  } catch (error) {
    console.error('Error al obtener ofertas', error)

    res.status(500).json({
    success: false,
    message: 'No se pudieron obtener las ofertas'
  })
  }

}

const getJobById = async (req, res) => {
  try {

    const { id } = req.params;

    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id])

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      })
    }

    res.json({
      success: true,
      job: jobs[0],
    })

  } catch (error) {
    console.error("Error al obtener la oferta", error)

    res.status(500).json({
      success: false,
      message: 'No se pudo obtener la oferta'
    })
  }
}

const updateJob = async (req, res) => {
  try {
    const { id } = req.params
    const { title, company, location, url, description, source } = req.body

    const query = 'UPDATE jobs SET title = ?, company = ?, location = ?, url = ?, description = ?, source = ? WHERE id = ?'
    const [result] = await db.query(query, [title, company, location, url, description, source, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      })
    }

    res.json({
      success: true,
      message: 'Oferta actualizada'
    })
  } catch (error) {
    console.error("Error al actualizar la oferta:", error);

    res.status(500).json({
      success: false,
      message: "No se pudo actualizar la oferta",
    });
  }
}

const deleteJob = async (req, res) => {
  try {
    const {id} = req.params
 
    const query = 'DELETE FROM jobs WHERE id = ?'
    const [result] = await db.query(query, [id])

    if(result.affectedRows === 0){
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      })
    }

    res.json({
      success : true,
      message : 'Oferta eliminada correctamente'
    })
  } catch (error) {
    console.error("Error al actualizar la oferta:", error);

    res.status(500).json({
      success : false,
      message : 'No se pudo eliminar la oferta'
    })
  }
}

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
};
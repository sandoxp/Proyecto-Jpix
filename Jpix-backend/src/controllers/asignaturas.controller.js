const { Asignatura, Seccion, BloqueHorario } = require('../models');

exports.list = async (_req, res, next) => {
  try {
    const data = await Asignatura.findAll({
      order: [['sigla', 'ASC']],
      attributes: ['sigla', 'nombre', 'creditos'],
    });
    res.json({ data });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await Asignatura.findOne({
      where: { sigla: req.params.sigla.toUpperCase() },
      include: [{
        model: Seccion, as: 'secciones',
        include: [{ model: BloqueHorario, as: 'bloques' }],
      }],
    });
    if (!data) return res.status(404).json({ error: { message: 'No encontrada', code: 404 }});
    res.json({ data });
  } catch (e) { next(e); }
};

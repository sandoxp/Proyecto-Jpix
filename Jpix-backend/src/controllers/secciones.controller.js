const { Seccion, BloqueHorario } = require('../models');

exports.list = async (_req, res, next) => {
  try {
    const data = await Seccion.findAll({
      include: [{
        model: BloqueHorario,
        as: 'bloques'
      }]
    });
    res.json({ data });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await Seccion.findOne({
      where: { id: req.params.id },
      include: [{
        model: BloqueHorario,
        as: 'bloques'
      }]
    });
    if (!data) return res.status(404).json({ error: { message: 'Sección no encontrada', code: 404 } });
    res.json({ data });
  } catch (err) { next(err); }
};

const { Requisito, Asignatura } = require('../models');

exports.list = async (_req, res, next) => {
  try {
    const data = await Requisito.findAll({
      include: [{
        model: Asignatura,
        as: 'asignatura'
      }]
    });
    res.json({ data });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await Requisito.findOne({
      where: { id: req.params.id },
      include: [{
        model: Asignatura,
        as: 'asignatura'
      }]
    });
    if (!data) return res.status(404).json({ error: { message: 'Requisito no encontrado', code: 404 } });
    res.json({ data });
  } catch (err) { next(err); }
};

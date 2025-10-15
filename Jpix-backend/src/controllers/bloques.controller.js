const { BloqueHorario } = require('../models');

exports.list = async (_req, res, next) => {
  try {
    const data = await BloqueHorario.findAll();
    res.json({ data });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await BloqueHorario.findOne({
      where: { id: req.params.id }
    });
    if (!data) return res.status(404).json({ error: { message: 'Bloque Horario no encontrado', code: 404 } });
    res.json({ data });
  } catch (err) { next(err); }
};

const { Seccion, BloqueHorario } = require('../models');
const { ok, fail } = require('../utils/responses');


exports.list = async (_req, res) => {
const data = await Seccion.findAll({
include: [{ model: BloqueHorario, as: 'bloques' }]
});
return ok(res, data);
};


exports.getOne = async (req, res) => {
const data = await Seccion.findOne({
where: { id: req.params.id },
include: [{ model: BloqueHorario, as: 'bloques' }]
});
return data ? ok(res, data) : fail(res, 'Sección no encontrada', 404);
};
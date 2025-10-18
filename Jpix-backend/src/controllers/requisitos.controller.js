const { Requisito, Asignatura } = require('../models');
const { ok, fail } = require('../utils/responses');


// Nota: si tu modelo define dos alias (asignatura y requerida), puedes incluir ambos
exports.list = async (_req, res) => {
const data = await Requisito.findAll({
include: [{ model: Asignatura, as: 'asignatura' }]
});
return ok(res, data);
};


exports.getOne = async (req, res) => {
const data = await Requisito.findOne({
where: { id: req.params.id },
include: [{ model: Asignatura, as: 'asignatura' }]
});
return data ? ok(res, data) : fail(res, 'Requisito no encontrado', 404);
};
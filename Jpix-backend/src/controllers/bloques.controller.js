const { BloqueHorario } = require('../models');
const { ok, fail } = require('../utils/responses');


exports.list = async (_req, res) => {
const data = await BloqueHorario.findAll();
return ok(res, data);
};


exports.getOne = async (req, res) => {
const data = await BloqueHorario.findOne({ where: { id: req.params.id } });
return data ? ok(res, data) : fail(res, 'Bloque Horario no encontrado', 404);
};
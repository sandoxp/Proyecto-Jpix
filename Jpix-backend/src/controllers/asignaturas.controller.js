const { Asignatura, Seccion, BloqueHorario } = require('../models');
const { ok, fail } = require('../utils/responses');


exports.list = async (_req, res) => {
const data = await Asignatura.findAll({
order: [['sigla', 'ASC']],
attributes: ['sigla', 'nombre', 'creditos']
});
return ok(res, data);
};


exports.getOne = async (req, res) => {
const sigla = (req.params.sigla || '').toUpperCase();
const data = await Asignatura.findOne({
where: { sigla },
include: [{
model: Seccion, as: 'secciones',
include: [{ model: BloqueHorario, as: 'bloques' }]
}]
});
return data ? ok(res, data) : fail(res, 'No encontrada', 404);
};
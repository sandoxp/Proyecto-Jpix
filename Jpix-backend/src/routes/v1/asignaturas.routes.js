const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/asignaturas.controller');


router.get('/', asyncH(C.list));
router.get('/:sigla', asyncH(C.getOne));


module.exports = router;
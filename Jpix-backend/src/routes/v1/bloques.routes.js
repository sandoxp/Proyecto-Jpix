const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/bloques.controller');


router.get('/', asyncH(C.list));
router.get('/:id', asyncH(C.getOne));


module.exports = router;
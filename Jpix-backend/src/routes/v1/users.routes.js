const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/users.controller');


router.get('/', asyncH(C.list));
router.get('/:id', asyncH(C.getOne));
router.post('/', asyncH(C.create));
router.put('/:id', asyncH(C.update));
router.delete('/:id', asyncH(C.remove));


module.exports = router;
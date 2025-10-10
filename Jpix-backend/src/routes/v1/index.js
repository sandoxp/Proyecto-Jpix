const router = require('express').Router();
router.use('/health', require('./health.routes'));
router.use('/usuarios', require('./users.routes'));
module.exports = router;

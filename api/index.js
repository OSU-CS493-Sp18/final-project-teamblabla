const router = module.exports = require('express').Router();


router.use('/users', require('./users').router);
router.use('/rides', require('./rides').router);
router.use('/reviews', require('./reviews').router);
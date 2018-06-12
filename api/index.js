const router = module.exports = require('express').Router();

const { router: rideRouter } = require('./rides');

router.use('/rides', rideRouter);
router.use('/users', require('./users').router);

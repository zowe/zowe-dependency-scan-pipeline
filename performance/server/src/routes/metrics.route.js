const express = require('express');
const router = express.Router({ mergeParams: true });

const metricsController = require('../controllers/metrics.controller');

router.route('/')
    .get(metricsController.getAll);

router.route('/:_id')
    .get(metricsController.get);

module.exports = router;
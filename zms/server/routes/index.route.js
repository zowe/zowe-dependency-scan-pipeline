const express = require('express');
const metrics = require('./metrics.route');

const router = express.Router();

router.use('/metrics', metrics);

module.exports = router;
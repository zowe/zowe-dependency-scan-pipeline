const util = require('util');
const metricsManager = require('../models/metricsManager.model');
const logger = require('./logger.service');

const get = function (_id) {
    logger.info(`metrics.service get(${_id})`)
    return { "dummy": "data" };
}

const getAll = function () {
    logger.info(`metrics.service getAll()`)
    const metricsList = metricsManager.getMetrics();
    logger.silly(util.format('metrics list: %j', metricsList));
    const response = metricsList.map((m) => m.value).join('\n');
    return response;
}

module.exports = {
    get,
    getAll
};
const metricsManager = require('../models/metricsManager.model');


const get = function (_id) {
    return { "dummy": "data" };
}

const getAll = function () {
    const metricsList = metricsManager.getMetrics();
    const response = metricsList.map((m) => m.value).join('\n');
    return response;
}

module.exports = {
    get,
    getAll
};
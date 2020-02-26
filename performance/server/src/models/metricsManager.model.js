const util = require('util');
const metrics = require('../../configs/metrics.json');
const logger = require('../services/logger.service');

const makeMetricEntry = (metricConfig) => {
    const { name: id, name, schedule, command } = metricConfig;
    const newMetric = {};
    newMetric.id = id;
    newMetric.name = name;
    newMetric.schedule = schedule;
    newMetric.command = command;
    newMetric.worker = '';
    newMetric.lastRequest = new Date();
    newMetric.lastResponse = new Date();
    // FIXME: this should be an object and aggregate later when display
    newMetric.value = '';

    logger.silly(util.format('new metric entry created: %j', newMetric));
    return newMetric;
}

const MetricsManager = {
    metrics: {},
    initMetrics: function (metrics) {
        logger.debug('MetricsManager.initMetrics');
        metrics.map((metric) => this.addMetrics(metric));
        logger.silly(util.format('metrics after init: %j', this.metrics));
    },
    updateMetrics: function (metricId, newValue) {
        logger.debug(`MetricsManager.updateMetrics(${metricId}, ${newValue})`);
        const metric = this.metrics[metricId]
        metric.value = newValue;
        metric.worker = '';
        metric.lastResponse = new Date();
    },
    addMetrics: function (metric) {
        logger.debug(`MetricsManager.addMetrics(${metric})`);
        const newMetric = makeMetricEntry(metric);
        this.metrics[newMetric.id] = newMetric;
    },
    setWorker: function (metricId, worker) {
        logger.debug(`MetricsManager.setWorker(${metricId}, ${worker})`);
        const metric = this.metrics[metricId]
        metric.worker = worker;
        metric.lastRequest = new Date();
    },
    getMetrics: function () {
        logger.debug(`MetricsManager.getMetrics()`);
        const metricsList = Object.keys(this.metrics).map((key) => this.metrics[key]);
        logger.silly(util.format('metrics list: %j', metricsList));
        return metricsList;
    },
    getMetricsAvailableForSchedule: function () {
        logger.debug(`MetricsManager.getMetricsAvailableForSchedule()`);
        const available = this.getMetrics()
            .filter((m) => m.worker === '' && m.command !== 'spool');
        logger.silly(util.format('available metrics: %j', available));
        return available;
    }
};

const metricsManager = Object.create(MetricsManager)
metricsManager.initMetrics(metrics);

module.exports = metricsManager
const metrics = require('../../configs/metrics.json');

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
    return newMetric;
}

const MetricsManager = {
    metrics: {},
    initMetrics: function (metrics) {
        metrics.map((metric) => this.addMetrics(metric));
        // console.log(this.metrics);
    },
    updateMetrics: function (metricId, newValue) {
        const metric = this.metrics[metricId]
        metric.value = newValue;
        metric.worker = '';
        metric.lastResponse = new Date();
    },
    addMetrics: function (metric) {
        // console.log('addMetrics');
        const newMetric = makeMetricEntry(metric);
        this.metrics[newMetric.id] = newMetric;
    },
    setWorker: function (metricId, worker) {
        const metric = this.metrics[metricId]
        metric.worker = worker;
        metric.lastRequest = new Date();
    },
    getMetrics: function () {
        const metricsList = Object.keys(this.metrics).map((key) => this.metrics[key]);
        // console.log('getMetrics', metricsList);
        return metricsList;
    },
    getMetricsAvailableForSchedule: function () {
        const available = this.getMetrics()
            .filter((m) => m.worker === '' && m.command !== 'spool');
        // console.log('available:', available);
        return available;
    }
};

const metricsManager = Object.create(MetricsManager)
metricsManager.initMetrics(metrics);

module.exports = metricsManager
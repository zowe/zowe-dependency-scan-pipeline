const metricsManager = require('../models/metricsManager.model');
const logsManager = require('../models/logsManager.model.js');
const metricsWorker = require('../models/metricsWorker');
const logsWorker = require('../models/logsWorker');
const spoolWorker = require('../models/spoolWorker');

const Scheduler = {
    metricsManager: {},
    logsManager: {},
    metricCounter: 0,
    logCounter: 0,
    initScheduler: function () {
        this.metricsManager = metricsManager;
        this.logsManager = logsManager;
    },
    spawnMetrics: function () {
        // console.log('spawnMetrics')
        const metrics = this.metricsManager.getMetricsAvailableForSchedule();
        metrics.map((m) => {
            this.metricsManager.setWorker(m.id, 'true');
            const result = metricsWorker.run(m.command);
            this.metricCounter++;
            this.onMetricResult(m.id, result);
        });

        setTimeout(this.spawnMetrics.bind(this), 5000);
    },
    spawnLogs: function () {
        // console.log('spawnMetrics')
        const logs = this.logsManager.getLogsAvailableForSchedule();
        logs.map((l) => {
            this.logsManager.setWorker(l.id, 'true');
            // console.log('scheduler:',l.program, l.script, l.source, l.offset )
            const offset = logsWorker.run(l.program, l.script, l.source, l.offset);
            this.logCounter++;
            this.onLogResult(l.id, offset);
        });

        setTimeout(this.spawnLogs.bind(this), 1000);
    },
    spawnSpool: function () {
        this.logsManager.setWorker('memory1');
        this.spoolWorker.run(this.onSpoolResult.bind(this));
    },
    onLogResult: function (id, value) {
        this.logCounter--;
        // console.log('onWorkerResult:', result);
        // const { id, value } = result;
        this.logsManager.updateOffset(id, value);
    },
    onMetricResult: function (id, value) {
        this.metricCounter--;
        // console.log('onWorkerResult:', result);
        // const { id, value } = result;
        this.metricsManager.updateMetrics(id, value);
    },
    onSpoolResult: function (response) {
        this.metricsManager.updateMetrics('memory1', response);
        setTimeout(this.spawnSpool.bind(this), 1000);
    }
}

const scheduler = Object.create(Scheduler)
scheduler.initScheduler();
//scheduler.spawnMetrics();
scheduler.spawnLogs();
// scheduler.spawnSpool();

module.exports = scheduler;
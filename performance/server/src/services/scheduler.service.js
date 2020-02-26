const metricsManager = require('../models/metricsManager.model');
const logsManager = require('../models/logsManager.model');
const metricsWorker = require('../models/metricsWorker');
const logsWorker = require('../models/logsWorker');
const spoolWorker = require('../models/spoolWorker');
const path = require('path');
const logger = require('./logger.service');

const Scheduler = {
    metricsManager: {},
    logsManager: {},
    metricCounter: 0,
    logCounter: 0,
    initScheduler: function () {
        logger.debug('Scheduler.initScheduler');
        this.metricsManager = metricsManager;
        this.logsManager = logsManager;
    },
    spawnMetrics: function () {
        logger.debug('Scheduler.spawnMetrics')
        const metrics = this.metricsManager.getMetricsAvailableForSchedule();
        const metricsCollectorPath = path.resolve(__dirname, '../collectors/metrics');
        metrics.map((m) => {
            this.metricsManager.setWorker(m.id, 'true');
            const resolvedCommand = path.resolve(metricsCollectorPath, m.command);
            logger.silly(`metric ${m.id} starts: ${resolvedCommand}`);
            const result = metricsWorker.run(resolvedCommand);
            this.metricCounter++;
            this.onMetricResult(m.id, result);
        });

        setTimeout(this.spawnMetrics.bind(this), 5000);
    },
    spawnLogs: function () {
        logger.debug('Scheduler.spawnLogs')
        const logs = this.logsManager.getLogsAvailableForSchedule();
        const logsCollectorPath = path.resolve(__dirname, '../collectors/logs');
        logs.map((l) => {
            this.logsManager.setWorker(l.id, 'true');
            const resolvedScript = path.resolve(logsCollectorPath, l.script);
            logger.silly(`log ${m.id} starts: ${l.program} ${resolvedScript} - ${l.source}#${l.offset}`);
            const offset = logsWorker.run(l.program, resolvedScript, l.source, l.offset);
            this.logCounter++;
            this.onLogResult(l.id, offset);
        });

        setTimeout(this.spawnLogs.bind(this), 1000);
    },
    spawnSpool: function () {
        logger.debug('Scheduler.spawnSpool')
        this.logsManager.setWorker('memory1');
        this.spoolWorker.run(this.onSpoolResult.bind(this));
    },
    onLogResult: function (id, value) {
        logger.silly(`log ${id} ends: ${value}`);
        this.logCounter--;
        this.logsManager.updateOffset(id, value);
    },
    onMetricResult: function (id, value) {
        logger.silly(`metric ${id} ends: ${value}`);
        this.metricCounter--;
        this.metricsManager.updateMetrics(id, value);
    },
    onSpoolResult: function (response) {
        logger.silly(`spool ends: ${response}`);
        this.metricsManager.updateMetrics('memory1', response);
        setTimeout(this.spawnSpool.bind(this), 1000);
    }
}

const scheduler = Object.create(Scheduler)
scheduler.initScheduler();
scheduler.spawnMetrics();
// scheduler.spawnLogs();
// scheduler.spawnSpool();

module.exports = scheduler;
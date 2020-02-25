// id, worker, last ts, offset
const logConfig = require('../../configs/logs.json');
const { logserver: { LOGSTASH_SERVER, LOGSTASH_PORT, MAX_LINES, PROGRAM }, logs } = logConfig;

const makeLogEntry = (logEntry) => {
    const { name: id, name, source, script, MAX_LINES: maxLines
        , LOGSTASH_SERVER: logstashServer, LOGSTASH_PORT: logstashPort, PROGRAM: program, offset } = logEntry;
    const newLogEntry = {};
    newLogEntry.id = id;
    newLogEntry.name = name;
    newLogEntry.source = source;
    newLogEntry.script = script;
    newLogEntry.maxLines = maxLines || MAX_LINES;
    newLogEntry.logstashServer = logstashServer || LOGSTASH_SERVER;
    newLogEntry.logstashPort = logstashPort || LOGSTASH_PORT;
    newLogEntry.lastResponse = new Date();
    newLogEntry.offset = offset || 0;
    // console.log('offffffffset:', newLogEntry.name, newLogEntry.offset);
    newLogEntry.worker = '';
    newLogEntry.program = program || PROGRAM;
    return newLogEntry;
}


const LogsManager = {
    logs: {},
    initLogs: function (logs) {
        logs.map((log) => this.addLogs(log));
        // console.log(this.logs);
    },
    updateOffset: function (logId, newOffset) {
        const log = this.logs[logId]
        log.offset = newOffset;
        log.worker = '';
        log.lastResponse = new Date();
    },
    addLogs: function (log) {
        // console.log('addMetrics');
        const newLog = makeLogEntry(log);
        this.logs[newLog.id] = newLog;
    },
    setWorker: function (logId, worker) {
        const log = this.logs[logId]
        // console.log('LOGGGGG:', log, logId, worker);
        log.worker = worker;
        log.lastRequest = new Date();
    },
    getLogs: function () {
        const logsList = Object.keys(this.logs).map((key) => this.logs[key]);
        // console.log('getMetrics', metricsList);
        return logsList;
    },
    getLogsAvailableForSchedule: function () {
        const available = this.getLogs()
            .filter((m) => m.worker === '');
        // console.log('available:', available);
        return available;
    }
}

const logsManager = Object.create(LogsManager)
logsManager.initLogs(logs);

module.exports = logsManager
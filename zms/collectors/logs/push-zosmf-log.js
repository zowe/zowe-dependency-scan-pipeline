// const fs = require('fs');
const LineByLineReader = require('line-by-line');
const net = require('net');

// constants
const LOGSTASH_SERVER = '9.28.238.109';
const LOGSTASH_PORT = 5000;
const MAX_LINES = 2000;

// parse parameters
const args = process.argv.slice(2);
if (args.length < 2) {
    process.stderr.write('[ERROR] push-log.js require 2 parameters.');
    process.exit(1);
}
const fileName = args[0];
let offset = parseInt(args[1], 10);
offset = offset && !isNaN(offset) ? offset : 0;
let rows = 0;

var logstash = new net.Socket();
logstash.connect(LOGSTASH_PORT, LOGSTASH_SERVER, function() {
    let lr = new LineByLineReader(fileName, {
        // FIXME: z/OSMF log /var/zosmf/data/logs/IZUG0.log is ISO8859-1 encoding
        encoding: 'latin1',
        skipEmptyLines: false,
        start: offset
    });

    let zOSMFLogRecord = {
        lines: [],
        obj: null,
    }
    let writeZOSMFLog = function() {
        if (!zOSMFLogRecord.obj || !zOSMFLogRecord.obj.logname) {
            return;
        }

        let rec = JSON.stringify(zOSMFLogRecord.obj) + '\n';
        logstash.write(rec);
        // process.stdout.write('> ' + rec);

        // set counter
        // FIXME: line end
        offset += zOSMFLogRecord.lines.join('\n').length + 1;

        // reset
        zOSMFLogRecord.lines = [];
        zOSMFLogRecord.obj = null;
    }
    
    lr.on('error', function (err) {
        process.stderr.write('[ERROR] failed on reading file: ' + err);
        process.stdout.write('' + offset);
        process.exit(2);
    });
    
    lr.on('line', function (line) {
        if (rows >= MAX_LINES) {
            process.stdout.write('' + offset);
            logstash.end(); 
            process.exit(0);
        }

        lr.pause();

        setImmediate(function () {

            // REF: https://www.ibm.com/support/knowledgecenter/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua300/IZUHPINFO_ExaminingLogs.htm
            let m;
            // first line
            if (m = line.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/)) {
                writeZOSMFLog();

                zOSMFLogRecord.obj = {
                    logname: fileName,
                    '@timestamp': new Date(m[1]),
                    threadId: m[2],
                    className: m[3],
                    methodName: m[4],
                    message: '',
                };
                zOSMFLogRecord.lines.push(line);
            // second line
            } else if (m = line.match(/^(INFO|WARNING|SEVERE):(.+)$/)) {
                zOSMFLogRecord.obj.loglevel = m[1];
                zOSMFLogRecord.obj.message += m[2] + '\n';

                zOSMFLogRecord.lines.push(line);
            // last line
            } else if (m = line.match(/^\[([^:]+):([^ @]+)@([^ ]+) \((.+)\) (.+)\]$/)) {
                zOSMFLogRecord.obj.transactionId = m[1];
                zOSMFLogRecord.obj.remoteUsername = m[2];
                zOSMFLogRecord.obj.remoteHost = m[3];
                zOSMFLogRecord.obj.servletVerb = m[4];
                zOSMFLogRecord.obj.url = m[5];

                zOSMFLogRecord.lines.push(line);
            // last line, alternatives
            } else if (m = line.match(/^\[([^:]+):(.*)\]$/)) {
                zOSMFLogRecord.obj.transactionId = m[1];
                zOSMFLogRecord.obj.transactionContext = m[2];

                zOSMFLogRecord.lines.push(line);
            } else {
                zOSMFLogRecord.obj.message += line + '\n';
                zOSMFLogRecord.lines.push(line);
            }

            lr.resume();
        });

        rows++;
    });
    
    lr.on('end', function () {
        process.stdout.write('' + offset);
        logstash.end(); 
        process.exit(0);
    });
});

logstash.on('data',function(data) {
    process.stderr.write('[ERROR] surprisingly the server talks: ' + data);
    process.stdout.write('' + offset);
    process.exit(3);
});

logstash.on('error',function(err) {
    process.stderr.write('[ERROR] logstash server failed: ' + err);
    process.stdout.write('' + offset);
    process.exit(3);
});

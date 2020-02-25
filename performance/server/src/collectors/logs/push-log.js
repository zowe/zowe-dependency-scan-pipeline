// const fs = require('fs');
const LineByLineReader = require('line-by-line');
const net = require('net');

// logstash server configs
const logConfig = require('../../../configs/logs.json');
const { logserver: { LOGSTASH_SERVER, LOGSTASH_PORT, MAX_LINES } } = logConfig;
if (!LOGSTASH_SERVER || !LOGSTASH_PORT) {
    process.stderr.write('[ERROR] LOGSTASH_SERVER or LOGSTASH_PORT is not defined on configs/logs.json.');
    process.exit(1);
}

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
        // encoding: 'utf8',
        skipEmptyLines: false,
        start: offset
    });
    
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
            logstash.write(JSON.stringify({
                message: line,
                logname: fileName
            }) + '\n');
            // process.stdout.write('> ' + line + '\n');

            // FIXME: line end
            offset += line.length + 1;
            rows++;

            lr.resume();
        });
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

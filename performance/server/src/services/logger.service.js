const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const applicationPackage = require('../../package.json');
 
const customFormat = printf(({ level, message, label, timestamp }) => {
  return `[${label}][${timestamp}][${level}] ${message}`;
});

const logger = createLogger({
    format: combine(
        label({ label: applicationPackage.name }),
        timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console({
            level: process.env.LOG_LEVEL || 'info'
        })
    ]
});

module.exports = logger;

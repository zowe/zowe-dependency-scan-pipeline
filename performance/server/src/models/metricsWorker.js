const util = require('util');
const shell = require('shelljs');
const logger = require('../services/logger.service');

/**
 * Calling the run function and passing in a script will result in a message
 * being passed to parent
 */
class MetricWorker {

    constructor() {
        this.collectionTime;
    }

    /**
     * Main function to start worker/collector
     * @param {string} script Shell command or script to be executed
     */
    run(script) {
        logger.silly(`metric worker run ${script}`);
        let scriptOutput = this.executeScript(script);
        logger.silly(`metric worker response: ${scriptOutput}`);
        const response = this.parseScriptOutput(scriptOutput);
        logger.silly(`metric worker formatted response: ${response}`);
        return response;
    }

    /**
     * Given the path to a script/command return the stdout
     * @param {String} script Shell command or script to be executed
     */
    executeScript(script) {
        const response = shell.exec(script, { silent: true }).stdout;
        this.collectionTime = new Date().getTime();
        return response;
    }

    /**
     * Given a json string will return openMetrics response string
     * @param {String} scriptOutput stdout of a worker/collector script
     */
    parseScriptOutput(scriptOutput) {
        let responseString = [];
        let outputObject;

        try {
            outputObject = JSON.parse(scriptOutput);
        } catch (e) {
            logger.warn(util.format(`Failed to parse output with error: ${e}. Original output is: %j`, scriptOutput));
        }

        if (outputObject) {
            for (let row of outputObject) {
                //sanetise special characters
                if (row.process && row.process.includes('*')) {
                    row.process = 'MASTER'
                }
                responseString.push(this.createRowString(row));
            }
        }

        return responseString.join('');
    }

    /**
     * Given a Json Object return openMetrics format string
     * @param {Object} row 
     */
    createRowString(row) {
        let rowKey = row.key;
        let extraKeys = [];
        for (const key of Object.keys(row)) {
            if (key !== 'key' && key !== 'value') {
                extraKeys.push(key + '="' + row[key] + '"');
            }
        }
        if (extraKeys.length > 0) {
            rowKey += '{' + extraKeys.join(',') + '}'
        }

        return [
            rowKey,
            row.value,
            this.collectionTime,
        ].join(' ') + '\n';
    }
}

module.exports = new MetricWorker();




const shell = require('shelljs');

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
        let scriptOutput = this.executeScript(script);
        const response = this.parseScriptOutput(scriptOutput);
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
        let responseString = '';
        // if (scriptOutput.indexOf('\"') == 0) {
        scriptOutput = scriptOutput.replace('\n', '');
        //}

        for (let row of JSON.parse(scriptOutput)) {
            //sanetise special characters
            if (row.process && row.process.includes('*')) {
                row.process = 'MASTER'
            }
            responseString += this.createRowString(row);
        }
        return responseString;
    }

    /**
     * Given a Json Object return openMetrics format string
     * @param {Object} row 
     */
    createRowString(row) {
        let rowString = '';
        rowString += row.key
        let extraKeysString = '';
        for (const key of Object.keys(row)) {
            if (key !== 'key' && key !== 'value') {
                extraKeysString += key + '=' + row[key] + ','
            }
        }
        rowString += '{' + extraKeysString.substring(0, extraKeysString.length - 1) + '} '
            + row.value + ' ' + this.collectionTime + '\n';
        return rowString
    }
}

module.exports = new MetricWorker();




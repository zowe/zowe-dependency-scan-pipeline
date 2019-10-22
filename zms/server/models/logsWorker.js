const shell = require('shelljs');

/**
 * Calling the run function and passing in a script will result in a message
 * being passed to parent
 */
class LogWorker {


    constructor() {
        this.collectionTime;
    }

    /**
     * Main function to start worker/collector
     * @param {string} script Shell command or script to be executed
     */
    run(program, script, source, offset) {
        const params = [program, script, source, offset];
        const command = params.join(' ');
        const response = this.executeScript(command);
        // console.log(program, script, source, offset, response);
        return response;
    }

    /**
     * Given the path to a script/command return the stdout
     * @param {String} script Shell command or script to be executed
     */
    executeScript(script) {
        const response = shell.exec(script).stdout;
        // console.log('responseeeeee:', response);
        this.collectionTime = new Date().getTime();
        return response;
    }
}

module.exports = new LogWorker()




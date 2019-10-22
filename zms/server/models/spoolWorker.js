const shell = require('shelljs');
const https = require('https');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const JOBNAME = "DCOLLECT";
const FILEID = "103";

class ZMSSpoolWorker {
    constructor() {
        this.collectionTime;
    }

    run(clbk) {
        const stdout = shell.exec('submit /u/ibmuser/dcollect.jcl').stdout
        this.collectionTime = new Date().getTime();
        const JOBID = stdout.substring(4, 12);
        const path = `/api/v1/jobs/${JOBNAME}/${JOBID}/files/${FILEID}/content`
        this.getSpoolContent(path, clbk);
    }

    getSpoolContent(path, clbk) {
        let options = {
            hostname: 'tvt5003.svl.ibm.com',
            port: 7554,
            path,
            headers: {
            Authorization: "Basic am9yZGFuOlcycmxkbWFw",
            'Content-Type': 'application/json'
            }
        }
        https.get(options, response => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                data = JSON.parse(data).content;
                data = data.replace(new RegExp('1\{', 'g'), '{');
                data = data.substring(data.indexOf('['));
                data = data.substring(0, data.lastIndexOf(']')+1);
                clbk(this.parseScriptOutput(data));
            });
        });
    }

    parseScriptOutput(scriptOutput) {
        let responseString = '';
        for(let row of JSON.parse(scriptOutput)) {
            responseString += this.createRowString(row);
        }
        return responseString;
    }
    
    createRowString(row) {
    let rowString = '';
    rowString += row.KEY
    let extraKeysString = '';
    for (const key of Object.keys(row)) {
        if (key !== 'KEY' && key !== 'VALUE') {
            extraKeysString += key + '="' + row[key] + '",'
        }
    }
    rowString += '{' + extraKeysString.substring(0, extraKeysString.length - 1) + '} ' 
                + row.VALUE + ' ' + this.collectionTime + '\n';
    return rowString
    }
}

module.exports = new ZMSSpoolWorker();

// dummyclbk = responseString => {
//     //response string contains the prometheus consumable sstring
//     console.log(responseString);
// }
// new ZMSSpoolWorker().run(dummyclbk);
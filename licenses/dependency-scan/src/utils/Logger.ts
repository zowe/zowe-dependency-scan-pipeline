/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ChildProcess, SpawnSyncReturns } from "child_process";
import * as fs from "fs";
import { injectable } from "inversify";
import * as path from "path";
import { isNullOrUndefined } from "util";
import { Constants } from "../constants/Constants";
import { ExtraLogOpts } from "./ExtraLogOpts";
import rimraf = require("rimraf");

@injectable()
export class Logger {

    constructor() {
        console.log("Making dir " + Constants.LOG_DIR);
        if (Constants.CLEAN_LOGS_ON_START) {
            rimraf.sync(Constants.LOG_DIR);
        }
        if (!fs.existsSync(Constants.LOG_DIR)) {
            fs.mkdirSync(Constants.LOG_DIR, { recursive: true });
        }
    }

    public getLogFile(fileName: string, subdir?: string): number {
        return fs.openSync(this.getLogFilepath(fileName, subdir), "a+");
    }

    public logOutputSync(activeProcess: SpawnSyncReturns<Buffer>, fileName: string, subdir?: string, extraOpts?: ExtraLogOpts) {
        const file = fs.openSync(this.getLogFilepath(fileName, subdir), "a");
        fs.writeSync(file, activeProcess.stdout.toString());
        fs.writeSync(file, activeProcess.stderr.toString());
        if (!isNullOrUndefined(extraOpts) && !isNullOrUndefined(extraOpts.stdOutOnlyFile) && extraOpts.stdOutOnlyFile.length > 0) {
            const stdOutFile = fs.openSync(this.getLogFilepath(extraOpts.stdOutOnlyFile, subdir), "a");
            fs.writeSync(stdOutFile, activeProcess.stdout.toString());
        }
        if (!isNullOrUndefined(extraOpts) && !isNullOrUndefined(extraOpts.stdErrOnlyFile) && extraOpts.stdErrOnlyFile.length > 0) {
            const stdErrFile = fs.openSync(this.getLogFilepath(extraOpts.stdErrOnlyFile, subdir), "a");
            fs.writeSync(stdErrFile, activeProcess.stderr.toString());
        }

    }

    public logOutputAsync(activeProcess: ChildProcess, fileName: string, subdir?: string, extraOpts?: ExtraLogOpts) {
        return new Promise<any>((resolve, reject) => {
            const logFile = fs.openSync(this.getLogFilepath(fileName, subdir), "a");

            // stdout
            if (!isNullOrUndefined(extraOpts) && !isNullOrUndefined(extraOpts.stdOutOnlyFile) && extraOpts.stdOutOnlyFile.length > 0) {
                const stdOutFile = fs.openSync(this.getLogFilepath(extraOpts.stdOutOnlyFile, subdir), "a");
                activeProcess.stdout.on("data", (data) => {
                    fs.write(stdOutFile, Buffer.from(data, "utf-8").toString(), (error) => { if (error) { console.log(error); } });
                });
            }
            activeProcess.stdout.on("data", (data) => {
                fs.write(logFile, Buffer.from(data, "utf-8").toString(), (error) => { if (error) { console.log(error); } });
            });

            // stderr
            if (!isNullOrUndefined(extraOpts) && !isNullOrUndefined(extraOpts.stdErrOnlyFile) && extraOpts.stdErrOnlyFile.length > 0) {
                const stdErrFile = fs.openSync(this.getLogFilepath(extraOpts.stdErrOnlyFile, subdir), "a");
                activeProcess.stderr.on("data", (data) => {
                    fs.write(stdErrFile, Buffer.from(data, "utf-8").toString(), (error) => { if (error) { console.log(error); } });
                });
                activeProcess.on("error", (err) => {
                    fs.write(stdErrFile, "error:\n" + err, (error) => { if (error) { console.log(error); } });
                });
            }
            activeProcess.stderr.on("data", (data) => {
                fs.write(logFile, Buffer.from(data, "utf-8").toString(), (error) => { if (error) { console.log(error); } });
            });

            // Error
            activeProcess.on("error", (err) => {
                fs.write(logFile, "error:\n" + err, (error) => { if (error) { console.log(error); } });
                console.log("An error happened for " + fileName + " : " + err);
                reject(err);
            });
            activeProcess.on("exit", (code) => {
                fs.write(logFile, "process exited with code " + code, (error) => {
                    if (error) { console.log(error); }
                    if (code === 0) {
                        resolve(code);
                    }
                    else {
                        reject(`${fileName}: RC ${code}`);
                    }

                });
            });
        });
    }

    public getLogFilepath(fileName: string, subdir?: string) {
        let basePath = Constants.LOG_DIR;
        if (!isNullOrUndefined(subdir)) {
            const subDirPath = path.join(Constants.LOG_DIR, subdir);
            if (!fs.existsSync(subDirPath)) {
                fs.mkdirSync(subDirPath);
            }
            basePath = path.join(Constants.LOG_DIR, subdir);
        }
        const d = new Date();
        const adjustedFileName = fileName.replace(/[\\\/]/g, "_");
        return path.join(basePath, adjustedFileName + ".build.log");
    }

}

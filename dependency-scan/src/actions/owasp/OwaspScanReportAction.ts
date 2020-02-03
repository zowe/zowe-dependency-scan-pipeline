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

import * as async from "async";
import * as spawn from "cross-spawn";
import * as fs from "fs-extra";
import { inject, injectable } from "inversify";
import * as path from "path";
import "reflect-metadata";
import * as rimraf from "rimraf";
import { Constants } from "../../constants/Constants";
import { TYPES } from "../../constants/Types";
import { Logger } from "../../utils/Logger";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";


@injectable()
export class OwaspScanReportAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: any;
    private scanQueue: async.AsyncQueue<any> = async.queue(this.scanProject.bind(this), Constants.PARALLEL_SCAN_COUNT);

    constructor() {
        if (Constants.CLEAN_REPO_DIR_ON_START && (Constants.EXEC_SCANS || Constants.EXEC_REPORTS)) {
            rimraf.sync(Constants.OWASP_REPORTS_DIR);
        }
        if (!fs.existsSync(Constants.OWASP_REPORTS_DIR)) {
            fs.mkdirSync(Constants.OWASP_REPORTS_DIR, { recursive: true });
        }
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log("OWASP: Scan Projects");
            const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
            const rulesDirs = this.repoRules.getExtraProjectPaths(projectDirs);
            const relativeDirs: string[] = projectDirs.concat(rulesDirs);
            this.scanQueue.push(relativeDirs);
            this.scanQueue.drain = () => {
                resolve(true);
            };
        });
    }

    private scanProject(projectDir: string, cb: (error: any, val?: any) => void) {
        console.log("Scanning project " + projectDir);
        const absProjectDir: string = path.join(Constants.CLONE_DIR, projectDir);
        let processComplete: Promise<any>;
        if (Utilities.dirHasGradleProject(absProjectDir)) {
            this.replaceOwaspInBuildGradle(absProjectDir).then((result) => {
                this.copyGradleInitScript(absProjectDir);
                const licenseProcess = spawn(`./gradlew`, [
                    "--init-script", "dependency-scan.gradle",
                    "dependencyCheckAggregate"], {
                        cwd: absProjectDir,
                        env: process.env,
                        shell: true
                    });
                processComplete = this.log.logOutputAsync(licenseProcess, projectDir, "owasp_scan");

                processComplete.then((res) => {
                    fs.copySync(path.join(absProjectDir, "build", "reports"),
                        path.join(Constants.OWASP_REPORTS_DIR, projectDir), {
                            filter: (src: string, dest: string): boolean => {
                                // first filter is the exact directory we are copying from
                                if (src.endsWith("reports")) {
                                    return true;
                                }
                                // we want the flat files in build/reports directory
                                else {
                                    return !fs.statSync(src).isDirectory();
                                }
                            }
                        });
                    cb(null, res);
                }).catch((error) => {
                    console.log(error);
                    cb(error);
                });
            }).catch((error) => {
                console.log("Error on gradle nonsense?");
                console.log(error);
                cb(error);
                return;
            });
        }
        else {
            fs.mkdirpSync(path.join(Constants.OWASP_REPORTS_DIR, projectDir));
            // ignoring windows users for now
            const licenseProcess = spawn(path.join(Constants.OWASP_CLI_BIN_PATH, "dependency-check.sh"), ["--scan", ".", "--format", "ALL",
                "--project", projectDir, "--out", path.resolve(Constants.OWASP_REPORTS_DIR, projectDir)], {
                    cwd: absProjectDir,
                    env: process.env,
                    shell: true
                });
            processComplete = this.log.logOutputAsync(licenseProcess, projectDir, "owasp_scan");
            processComplete.then((result) => {
                cb(null, result);
            }).catch((error) => {
                console.log(error);
                cb(error);
            });
        }
    }

    private replaceOwaspInBuildGradle(projectPath: string) {
        return new Promise<any>((resolve, reject) => {
            fs.readFile(path.join(projectPath, "build.gradle"), "utf8", (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                let result = data.replace(/classpath\s+'org\.owasp:dependency(.*)$/gm, "");
                result = result.replace(/apply\s+plugin:\s+'org\.owasp\.dependencycheck'$/gm, "");
                fs.writeFile(path.join(projectPath, "build.gradle"), result, "utf8", (writeErr) => {
                    if (writeErr) { console.log(writeErr); reject(writeErr); }
                    resolve(true);
                });
            });
        });
    }

    private copyGradleInitScript(projectAbsPath: string) {
        fs.copyFileSync(path.join(Constants.SOURCE_RESOURCES_DIR, "dependency-scan.gradle"),
            path.join(projectAbsPath, "dependency-scan.gradle"));
    }
}

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
import * as fs from "fs";
import { inject, injectable } from "inversify";
import * as path from "path";
import "reflect-metadata";
import { Constants } from "../../constants/Constants";
import { TYPES } from "../../constants/Types";
import { Logger } from "../../utils/Logger";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";

@injectable()
export class LicenseScanAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: any;
    private scanQueue: async.AsyncQueue<any> = async.queue(this.scanProject.bind(this), Constants.PARALLEL_SCAN_COUNT);

    constructor() {
        //TODO:
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Scan Projects");
            const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
            const rulesDirs = this.repoRules.getExtraProjectPaths(projectDirs);
            const relativeDirs: string[] = projectDirs.concat(rulesDirs).map((leafDir) => path.join(Constants.CLONE_DIR, leafDir));
            if (Constants.SCAN_INDIVIDUALS && Constants.SCAN_AGGREGATE) {
                this.scanQueue.push(relativeDirs);
                this.scanQueue.drain = () => {
                    this.scanAggregate(relativeDirs).then((result) => {
                        resolve(true);
                    }).catch((error) => {
                        reject(error);
                    });
                };
            }
            else if (Constants.SCAN_INDIVIDUALS) {
                this.scanQueue.push(relativeDirs);
                this.scanQueue.drain = () => {
                    resolve(true);
                };
            }
            else if (Constants.SCAN_AGGREGATE) {
                this.scanAggregate(relativeDirs).then((result) => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            }
            else {
                resolve(true);
            }

        });
    }

    private scanAggregate(allProjects: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log("Running scan with aggregate-paths=" + allProjects.join(" "));
            // const licenseProcess = spawn.sync("license_finder", ["action_items", "--format", "json", "--quiet",
            //     "--decisions-file=" + Constants.DEPENDENCY_DECISIONS_YAML,
            //     "--aggregate-paths='" + allProjects.join("' '") + "'"], {
            const licenseProcess = spawn.sync("docker", [
                "run",
                "--rm",
                "-v", `${process.cwd()}/${Constants.BASE_WORK_DIR}:/build`,
                "-v", `${Constants.LICENSE_FINDER_DIR}:/LicenseFinder`,
                "licensefinder/license_finder",
                "/bin/bash",
                "-c",
                "'" + [
                // [
                    ". /root/.bash_profile",
                    "&&",
                    "cd /LicenseFinder",
                    "&&",
                    "rm -f pkg/*",
                    "&&",
                    "bundle install --local",
                    "&&",
                    // bundle clean failed if don't run bundle install
                    // bundle clean is required to clean up license-finder gem cache
                    "bundle clean --force",
                    "&&",
                    "bundle install -j4",
                    "&&",
                    "rake install",
                    "&&",
                    "cd ~",
                    "&&",
                    "license_finder",
                    "action_items",
                    "--format", "json",
                    "--quiet",
                    `--decisions-file=/${Constants.DEPENDENCY_DECISIONS_YAML}`,
                    "--aggregate-paths", "/" + allProjects.join(" /"),
                ].join(" ") + "'",
                // ].join(" "),
            ], {
                cwd: process.env.cwd,
                env: process.env,
                // Shell true required for aggregate paths with spaces between projects
                shell: true
            });
            this.log.logOutputSync(licenseProcess, "dependency_approvals_aggregate");
            const logFile: number = this.log.getLogFile("dependency_approvals_aggregate");
            // The log is pure JSON with a header, so we strip the header and write the final "output" of the aggregate scan.
            fs.writeFileSync(Constants.SCAN_AGGREGATE_REPORT_FILE,
                fs.readFileSync(logFile).toString().replace("Dependencies that need approval:\n", ""));
            resolve(true);
        });
    }

    private scanProject(projectDir: string, cb: (error: any, val?: any) => void) {
        console.log("Scanning individual project " + projectDir);
        // const licenseProcess = spawn("license_finder", ["report", "--project-path", projectDir, "--format", "json",
        //     "--decisions-file=" + Constants.DEPENDENCY_DECISIONS_YAML], {
        const licenseProcess = spawn("docker", [
            "run",
            "--rm",
            "-v", `${process.cwd()}/${Constants.BASE_WORK_DIR}:/build`,
            "-v", `${Constants.LICENSE_FINDER_DIR}:/LicenseFinder`,
            "licensefinder/license_finder",
            "/bin/bash",
            "-c",
            // "'" + [
            [
                ". /root/.bash_profile",
                "&&",
                "cd /LicenseFinder",
                "&&",
                "rm -f pkg/*",
                "&&",
                "bundle install --local",
                "&&",
                // bundle clean failed if don't run bundle install
                // bundle clean is required to clean up license-finder gem cache
                "bundle clean --force",
                "&&",
                "bundle install -j4",
                "&&",
                "rake install",
                "&&",
                "cd ~",
                "&&",
                "license_finder",
                "report",
                "--project-path", `/${projectDir}`,
                "--format", "json",
                `--decisions-file=/${Constants.DEPENDENCY_DECISIONS_YAML}`,
            // ].join(" ") + "'",
            ].join(" "),
        ], {
            cwd: process.env.cwd,
            env: process.env,
            shell: false
        });
        const processComplete = this.log.logOutputAsync(licenseProcess, projectDir, "license_scan");
        processComplete.then((res) => {
            cb(null, res);
        }).catch((error) => {
            cb(error);
        });
    }
}

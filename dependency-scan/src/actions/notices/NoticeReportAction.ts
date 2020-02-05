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
import { ZoweManifest } from "../../repos/ZoweManifest";
import { Logger } from "../../utils/Logger";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";



@injectable()
export class NoticeReportAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: any;
    @inject(TYPES.ZoweManifest) private readonly zoweManifest: ZoweManifest;

    private readonly NOTICE_REPORT_FILE = path.resolve(Constants.NOTICE_REPORTS_DIR, "notices_aggregate.txt");
    private projectNoticeQueue: async.AsyncQueue<any> = async.queue(this.generateProjectNotice.bind(this), Constants.PARALLEL_NOTICE_REPORT_COUNT);

    constructor() {
        console.log("Making dir " + Constants.NOTICE_REPORTS_DIR);
        if (Constants.CLEAN_REPO_DIR_ON_START && (Constants.EXEC_REPORTS || Constants.EXEC_SCANS)) {
            rimraf.sync(Constants.NOTICE_REPORTS_DIR);
        }
        if (!fs.existsSync(Constants.NOTICE_REPORTS_DIR)) {
            fs.mkdirSync(Constants.NOTICE_REPORTS_DIR, { recursive: true });
        }
        this.aggregateNotices.bind(this);
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            console.log("Generate Notices Report");
            const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
            const rulesDirs = this.repoRules.getExtraProjectPaths(projectDirs);
            // As compared to other actions, we do not fully resolve project dirs. We will use the project dir as the name i
            this.projectNoticeQueue.push(projectDirs);
            this.projectNoticeQueue.push(rulesDirs);
            this.projectNoticeQueue.drain = () => {
                this.aggregateNotices().then((noticeDone) => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            };
        });
    }

    private aggregateNotices(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    private generateProjectNotice(projectDir: string, cb: (error: any, val?: any) => void) {
        console.log("Generating notices for project " + projectDir);
        const absProjectDir: string = path.join(Constants.CLONE_DIR, projectDir);
        let processComplete: Promise<any>;
        const noticeDestinationDir = path.join(Constants.NOTICE_REPORTS_DIR, projectDir);
        fs.mkdirpSync(noticeDestinationDir);
        if (Utilities.dirHasGradleProject(absProjectDir)) {
            // ignoring windows users for now
            const noticeProcess = spawn("./gradlew", ["downloadLicenses"], {
                cwd: absProjectDir,
                env: process.env,
                shell: true
            });
            processComplete = this.log.logOutputAsync(noticeProcess, projectDir, "notices_report");
            processComplete.then((result) => {
                fs.copySync(path.join(absProjectDir, "build", "reports", "license", "license-dependency.xml"),
                    path.join(noticeDestinationDir, "license-dependency.xml"));
                cb(null, result);
            }).catch((error) => {
                console.log(error);
                cb(error);
            });

        }
        else if (Utilities.dirHasNodeProject(absProjectDir)) {
            // ignoring windows users for now
            const noticeProcess = spawn("yarn", ["licenses", "generate-disclaimer"], {
                cwd: absProjectDir,
                env: process.env,
                shell: true
            });
            processComplete = this.log.logOutputAsync(noticeProcess, projectDir, "notices_report");
            processComplete.then((result) => {
                cb(null, result);
            }).catch((error) => {
                console.log(error);
                cb(error);
            });
        }
    }

}

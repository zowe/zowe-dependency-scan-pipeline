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
import * as xml2js from "xml2js";
import { Constants } from "../../constants/Constants";
import { TYPES } from "../../constants/Types";
import { ZoweManifest } from "../../repos/ZoweManifest";
import { ZoweManifestSourceDependency } from "../../repos/ZoweManifestSourceDependency";
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
            console.log(projectDirs);
            console.log(rulesDirs);
            // As compared to other actions, we do not fully resolve project dirs. We will use the project dir as the name i
            this.projectNoticeQueue.push(projectDirs);
            this.projectNoticeQueue.push(rulesDirs);
            this.projectNoticeQueue.drain = () => {
                this.aggregateNotices().then((result) => {
                    resolve(true);
                });
            };
        });
    }

    private aggregateNotices(): Promise<any> {
        return new Promise((resolve, reject) => {

            const sourceDependencies: ZoweManifestSourceDependency[] = this.zoweManifest.sourceDependencies;
            const aggregateNoticesFile = path.join(Constants.NOTICE_REPORTS_DIR, "notices_aggregate.txt");
            (sourceDependencies).forEach((dependency: ZoweManifestSourceDependency) => {
                const notices = (dependency.entries.map((depEntry) => depEntry.repository))
                    .concat((this.repoRules.getExtraPathForRepositories(dependency.entries)));

                notices.forEach((noticeInstance: string) => {
                    const noticeDestinationDir = path.join(Constants.NOTICE_REPORTS_DIR, noticeInstance);
                    // check if we have notices.txt (yarn) or license-dependency.xml (gradle)
                    const noticesTxtFile = path.join(noticeDestinationDir, "notices.txt");
                    const licenseXmlFile = path.join(noticeDestinationDir, "license-dependency.xml");
                    if (fs.existsSync(noticesTxtFile)) {
                        fs.appendFileSync(aggregateNoticesFile, fs.readFileSync(noticesTxtFile).toString() + "\n");
                    }
                    else if (fs.existsSync(licenseXmlFile)) {
                        console.log(licenseXmlFile);
                        const parser = new xml2js.Parser();
                        fs.readFile(licenseXmlFile, (error, fileData) => {
                            parser.parseString(fileData, (err: any, result: any) => {
                                result.licenses.license.forEach((license: any) => {
                                    fs.appendFileSync(aggregateNoticesFile, "The following software may be included in this product: "
                                         + JSON.stringify(license.dependency) + ". This software contains the following license(s):\n\n");
                                    fs.appendFileSync(aggregateNoticesFile, license.$.name + ": " + license.$.url + "\n\n\n");
                                });
                            });
                        });
                    }

                });
            });
        });
    }

    private generateProjectNotice(projectDir: string, cb: (error: any, val?: any) => void) {
        console.log("Generating notices for project " + projectDir);
        const processPromises: Array<Promise<any>> = [];
        const absProjectDir: string = path.join(Constants.CLONE_DIR, projectDir);
        const noticeDestinationDir = path.join(Constants.NOTICE_REPORTS_DIR, projectDir);
        fs.mkdirpSync(noticeDestinationDir);
        if (Utilities.dirHasGradleProject(absProjectDir)) {
            let processComplete: Promise<any>;

            // ignoring windows users for now
            const noticeProcess = spawn("./gradlew", ["downloadLicenses"], {
                cwd: absProjectDir,
                env: process.env,
                shell: true
            });
            processComplete = this.log.logOutputAsync(noticeProcess, projectDir, "notices_report");
            processPromises.push(processComplete);
            processComplete.then((result) => {
                fs.copySync(path.join(absProjectDir, "build", "reports", "license", "license-dependency.xml"),
                    path.join(noticeDestinationDir, "license-dependency.xml"));
            }).catch((error) => {
                console.log(error);
            });

        }
        else if (Utilities.dirHasNodeProject(absProjectDir)) {
            let processComplete: Promise<any>;

            // ignoring windows users for now
            const noticeProcess = spawn("yarn", ["licenses", "generate-disclaimer", "--production"], {
                cwd: absProjectDir,
                env: process.env,
                shell: true
            });
            processComplete = this.log.logOutputAsync(noticeProcess, projectDir, "notices_report", {
                stdOutOnlyFile: projectDir + "notices.txt"
            });
            processPromises.push(processComplete);
            processComplete.then((result) => {
                fs.copySync(this.log.getLogFilepath(projectDir + "notices.txt", "notices_report"),
                    path.join(noticeDestinationDir, "notices.txt"));
            }).catch((error) => {
                console.log(error);
            });
        }
        else {
            console.log("Nothing found: " + absProjectDir);
        }
        Promise.all(processPromises).then((result) => {
            cb(null);
        }).catch((error) => {
            console.log(error);
            cb(error, null);
        });
    }

}

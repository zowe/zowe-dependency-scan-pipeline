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
import { ReportInfo } from "../../repos/RepositoryReportDest";
import { ZoweManifest } from "../../repos/ZoweManifest";
import { ZoweManifestSourceDependency } from "../../repos/ZoweManifestSourceDependency";
import { Logger } from "../../utils/Logger";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";


@injectable()
export class OrtReportAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: any;
    @inject(TYPES.ZoweManifest) private readonly zoweManifest: ZoweManifest;

    private readonly AGG_REPORT_MARKDOWN_FILE = path.resolve(Constants.LICENSE_REPORTS_DIR, "markdown_dependency_report.md");
    private readonly CLI_REPORT_MARKDOWN_FILE = path.resolve(Constants.LICENSE_REPORTS_DIR, "cli_dependency_report.md")
    private readonly ZOS_REPORT_MARKDOWN_FILE = path.resolve(Constants.LICENSE_REPORTS_DIR, "zos_dependency_report.md")

    private reportQueue: async.AsyncQueue<any> = async.queue(this.reportProject.bind(this), Constants.PARALLEL_REPORT_COUNT);

    constructor() {
        console.log("Making dir " + Constants.LICENSE_REPORTS_DIR);
        if (Constants.CLEAN_REPO_DIR_ON_START && (Constants.EXEC_REPORTS || Constants.EXEC_SCANS)) {
            rimraf.sync(Constants.LICENSE_REPORTS_DIR);
        }
        if (!fs.existsSync(Constants.LICENSE_REPORTS_DIR)) {
            fs.mkdirSync(Constants.LICENSE_REPORTS_DIR, { recursive: true });
        }
        this.completeTpsrMdReport.bind(this);
        this.completeNoticesReport.bind(this);
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (Constants.EXEC_REPORTS) {

                console.log("Generate Report");
                const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
               
                // As compared to other actions, we do not fully resolve project dirs. We will use the project dir as the name i
                this.reportQueue.push(projectDirs);

                this.reportQueue.drain = () => {
                    const reportPromises: Promise<any>[] = [];
                    reportPromises.push(this.completeTpsrMdReport());
                    reportPromises.push(this.completeNoticesReport());
                    Promise.all(reportPromises).then(() => {
                        resolve(true);
                    }).catch((error) => {
                        reject(error);
                    });
                };
            }

        });
    }

    private completeNoticesReport(): Promise<any> {
        return new Promise((resolve, reject) => { 
            const sourceDependencies: ZoweManifestSourceDependency[] = this.zoweManifest.sourceDependencies;
            const aggregateNoticesFile = path.join(Constants.NOTICE_REPORTS_DIR, "notices_aggregate.txt");
            const cliNoticesFile = path.join(Constants.NOTICE_REPORTS_DIR, "notices_cli.txt");
            const zosNoticesFile = path.join(Constants.NOTICE_REPORTS_DIR, "notices_zos.txt");

            (sourceDependencies).forEach((dependency: ZoweManifestSourceDependency) => {
                const notices = (dependency.entries.map((depEntry): ReportInfo => {
                    return { destinations: depEntry.destinations, reportName: depEntry.repository }
                }))

                notices.forEach((noticeInstance: ReportInfo) => {
                    const noticeDestinationDir = path.join(Constants.NOTICE_REPORTS_DIR, noticeInstance.reportName);
                    // check if we have notices.txt (yarn) or license-dependency.xml (gradle)
                    const noticesTxtFile = path.join(noticeDestinationDir, "notices.txt");
                    if (fs.existsSync(noticesTxtFile)) {
                        fs.appendFileSync(aggregateNoticesFile, fs.readFileSync(noticesTxtFile).toString() + "\n");
                        if (noticeInstance.destinations.join(",").includes("CLI")) {
                            fs.appendFileSync(cliNoticesFile, fs.readFileSync(noticesTxtFile).toString() + "\n");
                        } else {
                            fs.appendFileSync(zosNoticesFile, fs.readFileSync(noticesTxtFile).toString() + "\n");
                        }
                    } else {
                        console.log("Could not find notices for " + noticeInstance.reportName);
                    }
                });
            });

        })
    }

    private completeTpsrMdReport(): Promise<any> {
        return new Promise((resolve, reject) => {

            const sourceDependencies: ZoweManifestSourceDependency[] = this.zoweManifest.sourceDependencies;

            const aggregateReportFile = fs.createWriteStream(this.AGG_REPORT_MARKDOWN_FILE, { flags: "a" });
            const cliReportFile = fs.createWriteStream(this.CLI_REPORT_MARKDOWN_FILE)
            const zosReportFile = fs.createWriteStream(this.ZOS_REPORT_MARKDOWN_FILE)
            aggregateReportFile.write("# Zowe Third Party Library Usage\n\n");
            cliReportFile.write("# Zowe CLI Third Party Library Usage\n\n");
            zosReportFile.write("# Zowe z/OS Third Party Library Usage\n\n");
            (sourceDependencies).forEach((dependency) => {
                aggregateReportFile.write("* [" + dependency.componentGroup + "](#" + dependency.componentGroup.replace(/\s/g, "-").toLowerCase()
                    + "-dependency-attributions)" + "\n");
                if (dependency.entries.length > 0) {
                    if (dependency.entries[0].destinations.join(",").includes("CLI")) {
                        cliReportFile.write("* [" + dependency.componentGroup + "](#" + dependency.componentGroup.replace(/\s/g, "-").toLowerCase()
                            + "-dependency-attributions)" + "\n");
                    } else {
                        zosReportFile.write("* [" + dependency.componentGroup + "](#" + dependency.componentGroup.replace(/\s/g, "-").toLowerCase()
                            + "-dependency-attributions)" + "\n");
                    }
                }
            });
            aggregateReportFile.write("\n");
            zosReportFile.write("\n");
            cliReportFile.write("\n");

            (sourceDependencies).forEach((dependency: ZoweManifestSourceDependency) => {
                const reports: ReportInfo[] = (dependency.entries.map((depEntry): ReportInfo => {
                    return { destinations: depEntry.destinations, reportName: depEntry.repository }
                }))

                reports.forEach((repoReport: ReportInfo) => {
                    repoReport.reportName = repoReport.reportName.replace(/[\\\/]/g, "-")
                })

                let totalDepCt = 0;
                let cliDepCt = 0;
                let zosDepCt = 0;
                let missingReport: boolean = false;
                let fullReportString = "";
                let cliReportString = fullReportString
                let zosReportString = fullReportString
                reports.forEach((reportInstance: ReportInfo) => {
                    try {
                        fs.statSync(path.join(Constants.LICENSE_REPORTS_DIR, `${reportInstance.reportName}.md`));
                        const lines: string[] = fs.readFileSync(path.join(Constants.LICENSE_REPORTS_DIR, `${reportInstance.reportName}.md`), "utf-8")
                            .split("\n").filter(Boolean);
                        const reportDepCt = lines.length;
                        if (reportDepCt > 2) { // We always have 2 lines for header + table separator
                            totalDepCt += reportDepCt;
                            fullReportString += `### ${dependency.componentGroup} Dependency Attributions\n`;
                            fullReportString += lines.join("\n")
                            if (reportInstance.destinations.join(",").includes("CLI")) {
                                cliDepCt += reportDepCt
                                cliReportString += `### ${dependency.componentGroup} Dependency Attributions\n`
                                cliReportString += lines.join("\n");
                            } else {
                                zosDepCt += reportDepCt
                                zosReportString += `### ${dependency.componentGroup} Dependency Attributions\n`
                                zosReportString += lines.join("\n");
                            }
                        }
                    }
                    catch {
                        console.log("INFO: Missing file " + reportInstance.reportName + ".md");
                        missingReport = true;
                    }
                });
                if (totalDepCt > 0) {
                    aggregateReportFile.write(fullReportString);
                    aggregateReportFile.write("\n\n");
                }
                if (cliDepCt > 0) {
                    cliReportFile.write(cliReportString);
                    cliReportFile.write("\n\n")
                }
                if (zosDepCt > 0) {
                    zosReportFile.write(zosReportString);
                    zosReportFile.write("\n\n")
                }
                else if (!missingReport && totalDepCt <= 0) {
                    console.log(dependency.componentGroup + " is empty");
                }
            });
            resolve(true);
        });
    }

    private reportProject(projectPath: string, cb: (error: any, val?: any) => void) {

        const resolvedDir = path.join(Constants.CLONE_DIR, projectPath);
        const normalizedProjectName = projectPath.replace(/[\\\/]/g, "-");
        console.log("Running license_finder report on " + resolvedDir);
        const reportProcess = spawn("ort", ["report", "-i", resolvedDir + "/analyzer-result.json",
            "-o", Constants.LICENSE_REPORTS_DIR + path.sep + path.basename(projectPath),
            "-f", "PlainTextTemplate",
            "-O", "PlainTextTemplate=template.id=NOTICE_DEFAULT", // generates notices
            "-O", `PlainTextTemplate=template.path=${Constants.SOURCE_RESOURCES_DIR}/../resources/tpsr-full-template.md.ftl` //generates tpsr section
            ], {
            cwd: process.env.cwd,
            env: process.env,
            // Shell true required for aggregate paths with spaces between projects
            shell: true
        });
       
        const logPromise: Promise<any> = this.log.logOutputAsync(reportProcess, projectPath, "report");
        logPromise.then((result) => {

            const noticeFileFrom = path.join(Constants.LICENSE_REPORTS_DIR, path.basename(projectPath), "NOTICE_DEFAULT")
            const tpsrFileFrom = path.join(Constants.LICENSE_REPORTS_DIR, path.basename(projectPath), "tpsr-full-template.md");

            const noticeFileTo = path.join(Constants.NOTICE_REPORTS_DIR, path.basename(projectPath), "notices.txt")
            const tpsrFileTo = path.join(Constants.LICENSE_REPORTS_DIR, path.basename(projectPath) + ".md" );
            fs.mkdirpSync(path.dirname(noticeFileTo));
            fs.mkdirpSync(path.dirname(tpsrFileTo));
            fs.copyFileSync(noticeFileFrom, noticeFileTo);
            fs.copyFileSync(tpsrFileFrom, tpsrFileTo);
            cb(null, result);
            if (result !== 0) {
                // TODO: do something in fail state?
            }
        }).catch((error) => {
            cb(error, null);
            console.log(error);
        });

    }

}

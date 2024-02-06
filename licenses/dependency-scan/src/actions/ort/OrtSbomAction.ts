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
import { IAction } from "../IAction";
import { Utilities } from "../../utils/Utilities";
import { ZoweManifestSourceDependency } from "../../repos/ZoweManifestSourceDependency";
import { ReportInfo } from "../../repos/RepositoryReportDest";

@injectable()
export class OrtSbomAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: any;
    @inject(TYPES.ZoweManifest) private readonly zoweManifest: ZoweManifest;

    private readonly SBOM_ZOS_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_zos.spdx.yml");
    private readonly SBOM_CLI_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_cli.spdx.yml");
    private readonly SBOM_AGG_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_aggregate.spdx.yml");
    private sbomQueue: async.AsyncQueue<any> = async.queue(this.reportSboms.bind(this), Constants.PARALLEL_NOTICE_REPORT_COUNT);

    constructor() {
        console.log("Making dir " + Constants.SBOM_REPORTS_DIR);
        if (Constants.CLEAN_REPO_DIR_ON_START && Constants.EXEC_SBOM) {
            rimraf.sync(Constants.SBOM_REPORTS_DIR);
        }
        if (!fs.existsSync(Constants.SBOM_REPORTS_DIR)) {
            fs.mkdirSync(Constants.SBOM_REPORTS_DIR, { recursive: true });
        }
        this.aggregateSboms.bind(this);
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (Constants.EXEC_SBOM) {
                console.log("Generate SBOM Report");

                const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
                // As compared to other actions, we do not fully resolve project dirs. We will use the project dir as the name i
                this.sbomQueue.push(projectDirs);
                this.sbomQueue.drain = () => {
                    this.aggregateSboms().then((result) => {
                        resolve(true);
                    }).catch((error) => {
                        console.log(error);
                    });
                };
            }
        });
    }

    private aggregateSboms(): Promise<any> {
        return new Promise((resolve, reject) => {
            const sourceDependencies: ZoweManifestSourceDependency[] = this.zoweManifest.sourceDependencies;
            (sourceDependencies).forEach((dependency: ZoweManifestSourceDependency) => {
                const reports = (dependency.entries.map((depEntry): ReportInfo => {
                    return { destinations: depEntry.destinations, reportName: depEntry.repository }
                }))

                reports.forEach((sbomReport: ReportInfo) => {
                    const sbomReportDir = path.join(Constants.SBOM_REPORTS_DIR, sbomReport.reportName);
                    const sbomFile = path.join(sbomReportDir, "bom.spdx.yml");
                    if (fs.existsSync(sbomFile)) {
                        fs.appendFileSync(this.SBOM_AGG_REPORT, fs.readFileSync(sbomFile).toString());
                        if (sbomReport.destinations.join(",").includes("CLI")) {
                            fs.appendFileSync(this.SBOM_CLI_REPORT, fs.readFileSync(sbomFile).toString());
                        } else {
                            fs.appendFileSync(this.SBOM_ZOS_REPORT, fs.readFileSync(sbomFile).toString());
                        }
                    } else {
                        console.log("Could not find SBOM for " + sbomReport.reportName);
                    }
                });
            });
            resolve(1);
        });
    }

    private reportSboms(projectPath: string, cb: (error: any, val?: any) => void) {

        const resolvedDir = path.join(Constants.CLONE_DIR, projectPath);
        console.log("Running ORT SBOM generation for " + resolvedDir);
        const reportProcess = spawn("ort", [Constants.ORT_LOG_LEVEL, "report", "-i", resolvedDir + "/analyzer-result.json",
            "-o", Constants.SBOM_REPORTS_DIR + path.sep + path.basename(projectPath),
            "-O", `SpdxDocument=document.name=${path.basename(projectPath)}`,
            "-f", "SpdxDocument"
            ], {
            cwd: process.env.cwd,
            env: process.env,
            // Shell true required for aggregate paths with spaces between projects
            shell: true
        });
       
        const logPromise: Promise<any> = this.log.logOutputAsync(reportProcess, projectPath, "sboms");
        logPromise.then((result) => {
            // spdx doc invalid only for cli
            if (path.basename(projectPath) == "zowe-cli") {
                console.log("Modifying Zowe CLI Ref to Secrets-core")
                const spdxFile = Constants.SBOM_REPORTS_DIR + path.sep + path.basename(projectPath) + path.sep + "bom.spdx.yml";
                let spdxContent: string = fs.readFileSync(spdxFile).toString();
                spdxContent = spdxContent.replace("SPDXRef-Package-Crate-secrets-core-0.1.0", 
                                    "SPDXRef-Project-Cargo-secrets-core-0.1.0");
                fs.writeFileSync(spdxFile, spdxContent);
            }
            cb(null, result);
        }).catch((error) => {
            cb(error, null);
            console.log(error);
        });

    }

}

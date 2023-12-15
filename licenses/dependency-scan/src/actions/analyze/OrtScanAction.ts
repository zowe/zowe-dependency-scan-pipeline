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
export class OrtScanAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: any;
    private scanQueue: async.AsyncQueue<any> = async.queue(this.scanProject.bind(this), Constants.PARALLEL_SCAN_COUNT);

    constructor() {
        
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log("Scan Projects");
            const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
            const relativeDirs: string[] = projectDirs.map((leafDir) => path.join(Constants.CLONE_DIR, leafDir));
            
            for (const dir of projectDirs) {
                const ortYaml = this.repoRules.makeOrtYaml(dir);
                fs.writeFileSync(path.join(Constants.CLONE_DIR, dir, ".ort.yml"), ortYaml);
            }

            this.scanQueue.push(relativeDirs);
            this.scanQueue.drain = () => {
                resolve(true);
            };
     
          
        });
    }

    private scanProject(projectDir: string, cb: (error: any, val?: any) => void) {
        console.log("Scanning individual project " + projectDir);

        const analyzerFlags = this.repoRules.getOrtAnalyzerFlags(projectDir);
     

        const licenseProcess = spawn("ort", [analyzerFlags, "analyze", "-i",
                projectDir,
                "-o",
                projectDir,
                "-f",
                "JSON"], {
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

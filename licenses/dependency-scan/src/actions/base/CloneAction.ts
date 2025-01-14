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
import "reflect-metadata";
import * as rimraf from "rimraf";
import { Constants } from "../../constants/Constants";
import { TYPES } from "../../constants/Types";
import { RepositoryInfo } from "../../repos/RepositoryInfo";
import { ZoweManifest } from "../../repos/ZoweManifest";
import { Logger } from "../../utils/Logger";
import { IAction } from "../IAction";
import path = require("path");

@injectable()
export class CloneAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.ZoweManifest) private readonly repoData: ZoweManifest;
    private readonly cloneQueue: async.AsyncQueue<any> = async.queue(this.cloneRepository.bind(this), Constants.PARALLEL_CLONE_COUNT);

    constructor() {
        console.log("Making dir " + Constants.CLONE_DIR);
        if (Constants.CLEAN_REPO_DIR_ON_START && Constants.EXEC_CLONE) {
            rimraf.sync(Constants.CLONE_DIR);
        }
        if (!fs.existsSync(Constants.CLONE_DIR)) {
            fs.mkdirSync(Constants.CLONE_DIR, { recursive: true });
        }
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            (this.repoData.sourceDependencies).forEach((componentEntry) => {
                componentEntry.entries.forEach((repo: RepositoryInfo) => {
                    this.cloneQueue.push(repo);
                });
            });
            this.cloneQueue.drain = () => {
                resolve(true);
            };
        });
    }

    private cloneRepository(repositoryData: RepositoryInfo, cb: (error: any, val?: any) => void) {

        let cloneCmd;
        let usingTag = false;
        const tagRegex = /^[a-zA-Z0-9\-_.]+$/;
        if (!tagRegex.test(repositoryData.tag)) {
            // we have a branch
            cloneCmd = ["clone", "--depth", "1", "--branch",  repositoryData.tag,`https://www.github.com/zowe/${repositoryData.repository}` ]
        } else {
            cloneCmd = ["clone", `https://www.github.com/zowe/${repositoryData.repository}`];
            usingTag = true;
        }
        
        const cloneProcess = spawn("git", cloneCmd,
            { cwd: Constants.CLONE_DIR, env: process.env });
        const logPromise = this.log.logOutputAsync(cloneProcess, repositoryData.repository, "clones");
        logPromise.then((result) => {
            if (usingTag) {
                const repoDir = path.join(Constants.CLONE_DIR, repositoryData.repository);
                spawn.sync("git", ["checkout", repositoryData.tag], {cwd: repoDir, env: process.env});
            }
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

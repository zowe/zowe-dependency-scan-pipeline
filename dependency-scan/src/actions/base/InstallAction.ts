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
import * as os from "os";
import * as path from "path";
import "reflect-metadata";
import * as rimraf from "rimraf";
import { Constants } from "../../constants/Constants";
import { TYPES } from "../../constants/Types";
import { RepositoryRules } from "../../repos/RepositoryRules";
import { Logger } from "../../utils/Logger";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";

@injectable()
export class InstallAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    @inject(TYPES.RepoRules) private readonly repoRules: RepositoryRules;
    private installQueue: async.AsyncQueue<any> = async.queue(this.installProject.bind(this), Constants.PARALLEL_INSTALL_COUNT);

    constructor() {
        //TODO:
    }

    /**
     * downloadRepositories - from <root>/resources/repos.json
     */
    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
            const rulesDirs = this.repoRules.getExtraProjectPaths(projectDirs);
            this.installQueue.push(projectDirs);
            this.installQueue.push(rulesDirs);
            this.installQueue.drain = () => {
                resolve(true);
            };
        });
    }

    private installProject(projectDir: string, cb: (error: any, val?: any) => void) {
        // absolute path
        const absDir = path.join(Constants.CLONE_DIR, projectDir);
        const processPromises: Array<Promise<any>> = [];
        if (Utilities.dirHasMavenProject(absDir)) {
            console.log("Issuing mvn install in " + absDir);
            const installProcess = spawn("mvn", ["install", "-DskipTests"], { cwd: absDir, env: process.env });
            processPromises.push(this.log.logOutputAsync(installProcess, projectDir, "install"));
        }
        if (Utilities.dirHasGradleProject(absDir)) {
            console.log("Issuing ./bootstrap_gradle in " + absDir);
            const osSuffix = os.platform() === "win32" ? "bat" : "sh";
            const bootstrapGradle = spawn.sync(`./bootstrap_gradlew.sh`, [], { cwd: absDir, env: process.env, shell: true });
            this.log.logOutputSync(bootstrapGradle, projectDir, "install");

            let gradleArgs = ["build", "-x", "test"];
            if (this.repoRules.hasExtraGradleArgs(projectDir)) {
                gradleArgs = gradleArgs.concat(this.repoRules.getExtraGradleArgs(projectDir));
            }
            console.log(`Issuing ./gradlew build in ${absDir} with args ${gradleArgs}`);
            const installProcess = spawn(`./gradlew`, gradleArgs, { cwd: absDir, env: process.env, shell: true });
            processPromises.push(this.log.logOutputAsync(installProcess, projectDir, "install"));

        }
        if (Utilities.dirHasNodeProject(absDir)) {
            console.log("Issuing yarn install in " + absDir);
            fs.copyFileSync("resources/private_npmrc/.npmrc", path.join(absDir, ".npmrc"));
            fs.copyFileSync("resources/private_npmrc/.yarnrc", path.join(absDir, ".yarnrc"));
            if (fs.existsSync(path.join(absDir, "package-lock.json"))) {
                fs.unlinkSync(path.join(absDir, "package-lock.json"));
            }
            if (fs.existsSync(path.join(absDir, "node_modules"))) {
                rimraf.sync(path.join(absDir, "node_modules"));
            }
            // skip-integrity-check is required to bypass some errors on build environment...
            // Integrity isn't *critically* important here as we just want to get dependency trees down and check their license info.
            // So far, there are no failures downstream due to an integrity mismatch at this step.
            /// -- Alternatives to skip-integrity-check are dropping network-concurrency to 1 and/or setting a mutex on yarn install.
            const installProcess = spawn("yarn", ["install", "--production", "--network-timeout", "300000",
                "--skip-integrity-check", "--network-concurrency", "5"], { cwd: absDir, env: process.env, shell: true });
            processPromises.push(this.log.logOutputAsync(installProcess, projectDir, "install"));
        }
        Promise.all(processPromises).then((result) => {
            cb(null);
        }).catch((error) => {
            console.log(error);
            cb(error, null);
        });
    }

}
